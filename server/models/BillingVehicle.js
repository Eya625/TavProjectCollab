// models/BillingVehicle.js (mis à jour)
const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  Ref: { type: String},
  Date: { type: Date},              
  Immatriculation: { type: String, default: '' }, 
  Type: { type: String, default: '' },  
  Montant: { type: Number},
  statut: {
    type: String,
    enum: ['payé', 'non payé', 'partiellement payé'],
    default: 'non payé'
  }
});

module.exports = mongoose.model('BillingVehicle', invoiceSchema, 'billingvehicles');

