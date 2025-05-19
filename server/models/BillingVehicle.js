// models/BillingVehicle.js 
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
  },
  po: {
    poNumber:        String,
    createdDate:     Date,
    supplier:        String,
    destinataire:    String,
    poInternalNumber:String,
    demandeNumber:   String,
    deliveryDate:    Date,
    totalEstimated:  Number,
    status:          { type: String, enum: ['open','closed'], default: 'open' }
  }
}, { timestamps: true });

module.exports = mongoose.model('BillingVehicle', invoiceSchema, 'billingvehicles');

