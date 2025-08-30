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
    // a) récupération de chemin du fichier transféré
    const filePath = req.file.path;
    // b) appel au service d'extraction(regex / ...)
    const result = await extractFromPdf(filePath);
    // c) on renvoit l'objet (period/ data) au front
    return res.status(200).json(result);
  } catch (err) {
    console.error("Erreur lors de l'upload des relevés:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

// validation et synchronsation en base MongoDB
async function saveReleves(req, res) {
  try {
    // 1) Validation du payload
    const { period, data } = req.body;
    if (typeof period !== 'string' || !Array.isArray(data)) {
      console.error('Invalid payload:', req.body);
      return res
        .status(400)
        .json({ error: 'invalid_payload', body: req.body });
    }

    // 2) Décodage de l'année et du mois
    const [yearStr, monthStr] = period.split('-');
    const year     = parseInt(yearStr, 10);
    const monthKey = monthNames[parseInt(monthStr, 10) - 1];
    if (!monthKey) {
      console.error('Invalid month extracted:', period);
      return res
        .status(400)
        .json({ error: 'invalid_period', message: `Cannot parse month from ${period}` });
    }

    // 3) recherche du doucment annuel existant
    let doc = await OlaConsumption.findOne({ year });

    // 3a) vérification des doublons : si ce mois à déjà été importé
    if (doc) {
      const alreadyUploaded = doc.details.some(d => {
        // handle Map vs object
        const val = d.consumptions instanceof Map
          ? d.consumptions.get(monthKey)
          : d.consumptions[monthKey];
        return Number(val) > 0;
      });
      if (alreadyUploaded) {
        // 409 Conflict: month already uploaded
        return res
          .status(409)
          .json({
            error: 'duplicate_upload',
            message: `Details for ${monthKey} ${year} have already been uploaded.`
          });
      }
    }

    // 4) Création du document si c'est la première fois pour cette année
    if (!doc) {
      doc = new OlaConsumption({
        year,
        details: defaultApsDetails.map(d => ({
          ...d,
          consumptions: new Map(Object.entries(d.consumptions || {}))
        }))
      });
    }

    // 5) pour chaque ligne extraite, mettre à jour ou ajouter un détail
    for (const entry of data) {
      //a) on nettoie les 0 du num carte 
      const cleanCard = entry.cardNumber.replace(/^0+/, '');
      const total     = Number(entry.total) || 0;
      // b) recherche d'un détail existant
      const detail = doc.details.find(d =>
        d.card_number.replace(/^0+/, '') === cleanCard
      );

      if (detail) {
        // Mise à jour de la Map de consommation pour ce mois 
        if (!(detail.consumptions instanceof Map)) {
          detail.consumptions = new Map(
            Object.entries(detail.consumptions || {})
          );
        }
        detail.consumptions.set(monthKey, total);
      } else {
        // création d'un nv détail minimal 
        doc.details.push({
          card_number: cleanCard,
          employe:     entry.employe || '',
          consumptions: new Map([[monthKey, total]])
        });
      }
    }

    // 6) Informer mongoose que la propriété 'details' à changé
    doc.markModified('details');

    // 7) Recalculer le total annuel
    doc.totalConsumption = doc.details.reduce((sum, d) => {
      if (d.consumptions instanceof Map) {
        for (const v of d.consumptions.values()) {
          sum += Number(v) || 0;
        }
      }
      return sum;
    }, 0);

    // 8) Final save
    await doc.save();
    console.log(`Save completed for year ${year}`);

    // 9) Return success message with month and year
    return res
      .status(200)
      .json({
        success: true,
        message: `Successfully uploaded ${monthKey} ${year} details.`
      });

  } catch (err) {
    console.error('Error in saveReleves:', err);
    return res.status(500).json({
      error:   'server_error',
      message: err.message
    });
  }
}


module.exports = {
  uploadDetailsReleves,
  saveReleves
};
