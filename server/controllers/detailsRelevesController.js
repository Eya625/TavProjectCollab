// controllers/detailsRelevesController.js
const { extractFromPdf } = require('../services/detailsReleves');
const OlaConsumption = require('../models/OlaConsumption');
const defaultApsDetails = require('../data/defaultApsDetails.json');

const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];

async function uploadDetailsReleves(req, res, next) {
  try {
    const filePath = req.file.path;
    const result = await extractFromPdf(filePath);
    return res.status(200).json(result);
  } catch (err) {
    console.error("Erreur lors de l'upload des relevés:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

async function saveReleves(req, res) {
  try {
    // 1) Valide et log le payload
    const { period, data } = req.body;
    if (typeof period !== 'string' || !Array.isArray(data)) {
      console.error('Payload invalide:', req.body);
      return res
        .status(400)
        .json({ error: 'Payload invalide', body: req.body });
    }

    // 2) Détermine l'année et le mois
    const [yearStr, monthStr] = period.split('-');
    const year     = parseInt(yearStr, 10);
    const monthKey = monthNames[parseInt(monthStr, 10) - 1];

    // 3) Récupère ou crée le doc pour cette année
    let doc = await OlaConsumption.findOne({ year });
    if (!doc) {
      // Initialise avec defaultApsDetails, en convertissant consumptions → Map
      doc = new OlaConsumption({
        year,
        details: defaultApsDetails.map(d => ({
          ...d,
          consumptions: new Map(Object.entries(d.consumptions || {}))
        }))
      });
    }

    // 4) Pour chaque ligne extraite, mets à jour la carte correspondante
    for (const entry of data) {
      const cleanCard = entry.cardNumber.replace(/^0+/, '');
      const total     = Number(entry.total) || 0;

      const detail = doc.details.find(d =>
        d.card_number.replace(/^0+/, '') === cleanCard
      );

      if (detail) {
        // Met à jour la Map du mois, sans toucher à detail.employe
        if (!(detail.consumptions instanceof Map)) {
          detail.consumptions = new Map(
            Object.entries(detail.consumptions || {})
          );
        }
        detail.consumptions.set(monthKey, total);

      } else {
        // === TEST MINIMAL : on ajoute uniquement card_number et employe ===
        doc.details.push({
          card_number: cleanCard,
          employe:     entry.employe || ''
        });
      }
    }

    // 5) Indique à Mongoose que details (et donc chaque Map) a changé
    doc.markModified('details');

    // 6) Recalcul du total annuel à partir des Map
    doc.totalConsumption = doc.details.reduce((sum, d) => {
      if (d.consumptions instanceof Map) {
        for (const v of d.consumptions.values()) {
          sum += Number(v) || 0;
        }
      }
      return sum;
    }, 0);

    // 7) Sauvegarde finale
    await doc.save();
    console.log(`Sauvegarde terminée pour l'année ${year}`);
    return res
      .status(200)
      .json({ message: 'Relevés enregistrés avec succès.' });

  } catch (err) {
    console.error('Erreur saveReleves :', err);
    return res.status(500).json({
      error:   'Erreur interne serveur.',
      message: err.message
    });
  }
}

module.exports = {
  uploadDetailsReleves,
  saveReleves
};
