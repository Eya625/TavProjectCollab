const OlaConsumption = require('../models/OlaConsumption');

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

function parseFilters(query) {
  const year     = +query.year || new Date().getFullYear();
  const employee = query.employee || null;
  let locations  = [];

  if (query.locations) {
    if (Array.isArray(query.locations)) {
      locations = query.locations.filter(Boolean);
    } else if (typeof query.locations === 'string') {
      locations = query.locations.split(',').map(s => s.trim()).filter(Boolean);
    }
  }

  return { year, employee, locations };
}

async function getByLocation(req, res) {
  try {
    const { year, employee, locations } = parseFilters(req.query);
    const match = { year };
    if (employee)      match['details.employe']   = employee;
    if (locations.length) match['details.location'] = { $in: locations };

    const pipeline = [
      { $unwind: '$details' },
      { $match: match },
      { $group: {
          _id: '$details.location',
          total: { $sum: { $add: MONTHS.map(m => `$details.consumptions.${m}`) } }
        }
      }
    ];

    const agg = await OlaConsumption.aggregate(pipeline);
    res.json(agg);
  } catch (err) {
    console.error('getByLocation error', err);
    res.status(500).json({ error: 'Erreur getByLocation' });
  }
}

async function getByMonth(req, res) {
  try {
    const { year, employee, locations } = parseFilters(req.query);
    const match = { year };
    if (employee)      match['details.employe']   = employee;
    if (locations.length) match['details.location'] = { $in: locations };

    const groupStage = MONTHS.reduce((g, m) => {
      g[m] = { $sum: `$details.consumptions.${m}` };
      return g;
    }, { _id: null });

    const pipeline = [
      { $unwind: '$details' },
      { $match: match },
      { $group: groupStage }
    ];

    const result = await OlaConsumption.aggregate(pipeline);
    if (!result.length) {
      return res.json(Object.fromEntries(MONTHS.map(m => [m, 0])));
    }
    const { _id, ...monthlySums } = result[0];
    res.json(monthlySums);
  } catch (err) {
    console.error('getByMonth error', err);
    res.status(500).json({ error: 'Erreur getByMonth' });
  }
}

async function getTopEmployees(req, res) {
  try {
    const { year, employee, locations } = parseFilters(req.query);
    const match = { year };
    if (employee)      match['details.employe']   = employee;
    if (locations.length) match['details.location'] = { $in: locations };

    const pipeline = [
      { $unwind: '$details' },
      { $match: match },
      { $group: {
          _id: '$details.employe',
          total: { $sum: { $add: MONTHS.map(m => `$details.consumptions.${m}`) } }
        }
      },
      { $sort:  { total: -1 } },
      { $limit: 10 }
    ];

    const agg = await OlaConsumption.aggregate(pipeline);
    res.json(agg);
  } catch (err) {
    console.error('getTopEmployees error', err);
    res.status(500).json({ error: 'Erreur getTopEmployees' });
  }
}

async function getYoYFuelVariation(req, res) {
  try {
    const { year: curr, employee, locations } = parseFilters(req.query);
    const prev = curr - 1;
    const match = { year: { $in: [prev, curr] } };
    if (employee)      match['details.employe']   = employee;
    if (locations.length) match['details.location'] = { $in: locations };

    const pipeline = [
      { $unwind: '$details' },
      { $match: match },
      { $project: { year: 1, arr: { $objectToArray: '$details.consumptions' } } },
      { $unwind: '$arr' },
      { $group: {
          _id: { year: '$year', month: '$arr.k' },
          total: { $sum: '$arr.v' }
        }
      }
    ];

    const agg = await OlaConsumption.aggregate(pipeline);
    const dataMap = {};
    agg.forEach(({ _id, total }) => {
      dataMap[_id.month] = dataMap[_id.month] || {};
      dataMap[_id.month][_id.year] = total;
    });

    const result = MONTHS.map(m => {
      const a = dataMap[m]?.[prev] || 0;
      const b = dataMap[m]?.[curr] || 0;
      return {
        month: m,
        [prev]: a,
        [curr]: b,
        variation: a > 0 && b > 0 ? parseFloat(((b - a) / a * 100).toFixed(2)) : null
      };
    });

    res.json(result);
  } catch (err) {
    console.error('getYoYFuelVariation error', err);
    res.status(500).json({ error: 'Erreur getYoYFuelVariation' });
  }
}

async function getAllEmployees(req, res) {
  try {
    const result = await OlaConsumption.aggregate([
      { $unwind: '$details' },
      { $group: { _id: '$details.employe' } },
      { $sort: { _id: 1 } }
    ]);
    res.json(result.map(r => r._id).filter(Boolean));
  } catch (err) {
    console.error('getAllEmployees error', err);
    res.status(500).json({ error: 'Erreur getAllEmployees' });
  }
}

async function getInvoiceDetails(req, res) {
  try {
    const { year, employee, locations } = parseFilters(req.query);
    const month      = req.query.month;
    const cardNumber = req.query.card_number;

    const doc = await OlaConsumption.findOne({ year, 'details.card_number': cardNumber });
    if (!doc) return res.status(404).json({ error: 'Carte non trouvée' });

    const detail = doc.details
      .filter(d => (!employee || d.employe === employee))
      .filter(d => (!locations.length || locations.includes(d.location)))
      .find(d => d.card_number === cardNumber);

    const consumption = detail?.consumptions?.[month] || 0;
    res.json({ month, cardNumber, consumption });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur getInvoiceDetails' });
  }
}
async function getAllLocations(req, res) {
  try {
    const result = await OlaConsumption.aggregate([
      { $unwind: '$details' },
      { $group: { _id: '$details.location' } },
      { $sort: { _id: 1 } }
    ]);
    res.json(result.map(r => r._id).filter(Boolean));
  } catch (err) {
    console.error('getAllLocations error', err);
    res.status(500).json({ error: 'Erreur getAllLocations' });
  }
}

async function getAllYears(req, res) {
  try {
    const result = await OlaConsumption.aggregate([
      { $group: { _id: '$year' } },
      { $sort: { _id: 1 } }
    ]);
    res.json(result.map(r => r._id));
  } catch (err) {
    console.error('getAllYears error', err);
    res.status(500).json({ error: 'Erreur getAllYears' });
  }
}

async function getYearlyConsumption(req, res) {
  try {
    const { year, employee, locations } = parseFilters(req.query);

    // Si pas de filtre employé / localisation, on renvoie direct le champ totalConsumption
    if (!employee && locations.length === 0) {
      const doc = await OlaConsumption.findOne({ year });
      const total = doc?.totalConsumption ?? 0;
      return res.json({ totalConsumption: total });
    }

    // Sinon on recalcule via aggregation sur details
    const match = { year };
    if (employee)        match['details.employe']   = employee;
    if (locations.length) match['details.location'] = { $in: locations };

    const pipeline = [
      { $unwind: '$details' },
      { $match: match },
      {
        $group: {
          _id: null,
          total: {
            $sum: {
              $add: MONTHS.map(m => `$details.consumptions.${m}`)
            }
          }
        }
      }
    ];

    const [agg] = await OlaConsumption.aggregate(pipeline);
    const total = agg?.total || 0;
    res.json({ totalConsumption: total });

  } catch (err) {
    console.error('getYearlyConsumption error', err);
    res.status(500).json({ error: 'Erreur getYearlyConsumption' });
  }
}
module.exports = {
  getByLocation,
  getByMonth,
  getTopEmployees,
  getYoYFuelVariation,
  getAllEmployees,
  getInvoiceDetails,
  getAllLocations,
  getAllYears,
  getYearlyConsumption
};
