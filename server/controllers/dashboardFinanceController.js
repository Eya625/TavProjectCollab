// File: src/controllers/dashboardFinanceController.js

const Vehicle        = require('../models/Vehicles');
const BillingVehicle = require('../models/BillingVehicle'); // votre modèle

// === Helpers pour construire le filtre ===

// Filtre sur Vehicles : on compare exactement registrationNumber
const buildVehicleMatch = veh =>
  veh ? { registrationNumber: veh } : {};

// Normalisation d’une immatriculation (on retire tous les espaces)
const normalize = s => s.replace(/\s+/g, '');

const buildInvoiceMatch = veh => {
  if (!veh) return {};
  const noSpace = normalize(veh);
  return {
    // on matche soit la version avec espaces, soit sans espaces
    $or: [
      { Immatriculation: veh },
      { Immatriculation: noSpace }
    ]
  };
};


// 1. Liste des véhicules (pour le select)
exports.getVehicles = async (req, res, next) => {
  try {
    const list = await Vehicle
      .find({}, 'registrationNumber model')
      .lean();
    // ex. [{ registrationNumber: "177 TU 206", model: "Passat ..." }, …]
    res.json(list);
  } catch (err) {
    next(err);
  }
};


// 2. Total véhicules (KPI)
exports.getTotalVehicles = async (req, res, next) => {
  try {
    const match = buildVehicleMatch(req.query.veh);
    const count = await Vehicle.countDocuments(match);
    // { count: 70 }
    res.json({ count });
  } catch (err) {
    next(err);
  }
};


// 3. Répartition par allocation (Pie chart)
exports.getAllocation = async (req, res, next) => {
  try {
    const match = buildVehicleMatch(req.query.veh);
    const data = await Vehicle.aggregate([
      { $match: match },
      { $group: { _id: '$allocation', count: { $sum: 1 } } },
      { $project: { allocation: '$_id', count: 1, _id: 0 } }
    ]);
    // ex. [{ allocation: "Landside", count: 12 }, …]
    res.json(data);
  } catch (err) {
    next(err);
  }
};


// 4. Total facturé & tendance 6 mois (KPI + Chart)
exports.getTotalBilled = async (req, res, next) => {
  try {
    const match = buildInvoiceMatch(req.query.veh);

    // — Total facturé global
    const aggTotal = await BillingVehicle.aggregate([
      { $match: match },
      { $group: { _id: null, total: { $sum: '$Montant' } } }
    ]);
    const total = aggTotal[0]?.total ?? 0;

    // — Tendance 6 derniers mois
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);

    const trend = await BillingVehicle.aggregate([
      { $match: {
          ...match,
          Date: { $gte: new Date(
            sixMonthsAgo.getFullYear(),
            sixMonthsAgo.getMonth(),
            1
          ) }
        }
      },
      {
        $project: {
          month: { $dateToString: { format: '%Y-%m', date: '$Date' } },
          Montant: 1
        }
      },
      { $group: { _id: '$month', total: { $sum: '$Montant' } } },
      { $sort: { _id: 1 } },
      { $project: { month: '$_id', total: 1, _id: 0 } }
    ]);

    // Retour uniforme : { total: Number, trend: [{ month, total }, …] }
    res.json({ total, trend });
  } catch (err) {
    next(err);
  }
};


// 5. Moyenne factures & variation annuelle (KPI/bar chart)
exports.getAvgInvoice = async (req, res, next) => {
  try {
    const match = buildInvoiceMatch(req.query.veh);

    // Moyenne actuelle
    const curr = await BillingVehicle.aggregate([
      { $match: match },
      { $group: { _id: null, avg: { $avg: '$Montant' } } }
    ]);
    const avg = curr[0]?.avg ?? 0;

    // Moyenne il y a un an
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const prev = await BillingVehicle.aggregate([
      { $match: {
          ...match,
          Date: { $lt: oneYearAgo }
        }
      },
      { $group: { _id: null, avg: { $avg: '$Montant' } } }
    ]);
    const prevAvg = prev[0]?.avg ?? 0;

    const change = prevAvg
      ? Number(((avg - prevAvg) / prevAvg * 100).toFixed(1))
      : null;

    // { avg: Number, change: Number|null }
    res.json({ avg, change });
  } catch (err) {
    next(err);
  }
};


// 6. Top 5 véhicules par montant facturé (Bar chart)
exports.getTop5 = async (req, res, next) => {
  try {
    const match = buildInvoiceMatch(req.query.veh);
    const data = await BillingVehicle.aggregate([
      { $match: match },
      { $group: { _id: '$Immatriculation', total: { $sum: '$Montant' } } },
      { $sort: { total: -1 } },
      { $limit: 5 },
      { $project: { vehicle: '$_id', total: 1, _id: 0 } }
    ]);
    // ex. [{ vehicle: "177TU206", total: 500.32 }, …]
    res.json(data);
  } catch (err) {
    next(err);
  }
};


// 7. Coût par agence (Bar/Pie chart)
exports.getByBranch = async (req, res, next) => {
  try {
    const invMatch = buildInvoiceMatch(req.query.veh);

    const data = await BillingVehicle.aggregate([
      // 1. Filtrer les factures
      { $match: invMatch },

      // 2. Lookup pour joindre Vehicles et normaliser l’immatriculation
      {
        $lookup: {
          from: 'vehicles',       // nom exact de la collection
          let: { imm: '$Immatriculation' },
          pipeline: [
            {
              $addFields: {
                normReg: {
                  $replaceAll: {
                    input: '$registrationNumber',
                    find: ' ',
                    replacement: ''
                  }
                }
              }
            },
            {
              $match: {
                $expr: { $eq: ['$$imm', '$normReg'] }
              }
            }
          ],
          as: 'veh'
        }
      },

      // 3. Dépiler le résultat
      { $unwind: '$veh' },

      // 4. Grouper par agence (champ `Brunch` dans Vehicles)
      {
        $group: {
          _id: '$veh.Brunch',
          total: { $sum: '$Montant' }
        }
      },

      // 5. Reformater la sortie
      {
        $project: {
          branch: '$_id',
          total: 1,
          _id: 0
        }
      }
    ]);

    // ex. [{ branch: "HO", total: 1234.56 }, …]
    res.json(data);

  } catch (err) {
    next(err);
  }
};


// 8. Nombre de factures par mois (Line/Bar chart)
exports.getInvoicesByMonth = async (req, res, next) => {
  try {
    const match = buildInvoiceMatch(req.query.veh);

    const data = await BillingVehicle.aggregate([
      { $match: match },
      {
        $project: {
          month: { $dateToString: { format: '%Y-%m', date: '$Date' } }
        }
      },
      { $group: { _id: '$month', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
      { $project: { month: '$_id', count: 1, _id: 0 } }
    ]);

    // ex. [{ month: "2025-01", count: 3 }, …]
    res.json(data);
  } catch (err) {
    next(err);
  }
};
