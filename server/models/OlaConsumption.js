const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Charger les détails par défaut depuis le fichier JSON en toute sécurité
const defaultDetailsPath = path.join(__dirname, '../data/defaultApsDetails.json');
let defaultApsDetails = [];

try {
  const fileData = fs.readFileSync(defaultDetailsPath, 'utf8');
  defaultApsDetails = JSON.parse(fileData);
} catch (error) {
  console.error('Erreur lors du chargement des détails OLA energy par défaut:', error);
}

// Définition du sous-schéma pour les détails de consommation APS
const OlaConsumptionDetailSchema = new mongoose.Schema({
  id: { type: String },
  employe: { type: String },
  card_number: { type: String },
  dep_code: { type: String },
  location: { type: String },
  monthly_limit: { type: Number, min: 0 },
  // Remplacer "monthly_consumption" par "consumptions"
  consumptions: { 
    type: Map, 
    of: Number, 
    default: () => new Map()
  }
}, { _id: false });

// Schéma principal de la carte APS
const OlaConsumptionSchema = new mongoose.Schema({
  year: { type: Number, required: true, index: true },
  totalConsumption: { type: Number, default: 0 },
  // Ici, "details" est un tableau de documents qui contiendra chacun une instance de ApsConsumptionDetailSchema
  details: { type: [OlaConsumptionDetailSchema], default: defaultApsDetails },
  isInvoiceGenerated: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('OlaConsumption', OlaConsumptionSchema);
