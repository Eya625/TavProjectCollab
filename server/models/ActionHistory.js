// model 
const mongoose = require('mongoose');

const actionSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  type: String, // add, update, delete
  entity: String, // consumption, invoice
  data: Object
});

module.exports = mongoose.model('ActionHistory', actionSchema);
