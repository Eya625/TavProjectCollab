const mongoose = require("mongoose");

// Schéma pour chaque département dans une région (non utilisé directement ici)
const departmentSchema = new mongoose.Schema({
  depCode: { type: String, required: true }, // Code du département
  amount: { type: Number},    // Montant de la dépense pour le département
});

// Schéma pour chaque région
const regionSchema = new mongoose.Schema({
  regionTotal: { type: Number, required: true },       // Total pour cette région
  expenseCategory: { type: String },     // Catégorie de dépenses
  // On utilise ici une Map pour stocker les départements : clé = code du département, valeur = montant
  departments: { type: Map, of: Number, required: true },
});

// Schéma principal pour la facture
const invoiceSchema = new mongoose.Schema({
  invoiceType: { type: String, required: true },   // Type de la facture
  month: { type: String, required: true },           // Mois de la facture
  grandTotal: { type: Number, required: true },      // Grand total
  stampTax: { type: Number, required: true },        // Taxe de timbre
  totalWithTax: { type: Number, required: true },    // Total avec la taxe
  // Les régions sont stockées dans une Map, clé = nom de la région, valeur = région (regionSchema)
  regions: { type: Map, of: regionSchema, required: true },
  isInvoiceGenerated: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },      // Date de création
  updatedAt: { type: Date, default: Date.now },      // Date de mise à jour
});

const Invoice = mongoose.model("Invoice", invoiceSchema);
module.exports = Invoice;
