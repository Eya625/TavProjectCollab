const mongoose = require('mongoose');

const PurchaseOrderSchema = new mongoose.Schema({
  poNumber:        { type: String, required: true, unique: true },
  createdDate:     { type: Date,   required: false },
  supplier:        { type: String, required: false },
  destinataire:    { type: String, required: false },
  poInternalNumber:{ type: String, required: false },
  demandeNumber:   { type: String, required: false },
  deliveryDate:    { type: Date,   required: false },
  totalEstimated:  { type: Number, default: 0 },
  status:          { type: String, enum: ['open','closed'], default: 'open' },
  createdAt:       { type: Date,   default: Date.now }
});

module.exports = mongoose.model('PurchaseOrder', PurchaseOrderSchema);
