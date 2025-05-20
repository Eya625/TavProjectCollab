// models/BillingVehicle.js
const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  Ref:            { type: String, required: false },
  Date:           { type: Date,   required: false },
  Immatriculation:{ type: String, default: '' },
  Type:           { type: String, default: '' },
  Montant:        { type: Number, required: true },
  Category:       { type: String, default: '' },
  statut: {
    type: String,
    enum: ['payé', 'non payé', 'partiellement payé'],
    default: 'non payé'
  }
}, { timestamps: true });

module.exports = mongoose.model('BillingVehicle', invoiceSchema, 'billingvehicles');
