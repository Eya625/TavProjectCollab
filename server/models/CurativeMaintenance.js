const mongoose = require('mongoose');

const curativeMaintenanceSchema = new mongoose.Schema({
  Printer_ID: { type: String, required: true }, // Numéro de série
  date: { type: Date, required: true }, // Date de l'intervention
  type: { type: String, required: true }, // Type d'intervention
  technician: { type: String, required: true }, // Nom du technicien
  description: { type: String }, // Description détaillée
  cost: { type: Number, required: true } // Coût en $
}, { timestamps: true }); // Ajoute createdAt et updatedAt

const CurativeMaintenance = mongoose.model('CurativeMaintenance', curativeMaintenanceSchema,'curativemaintenances');

module.exports = CurativeMaintenance;
