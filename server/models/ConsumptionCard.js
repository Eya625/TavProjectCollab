// models/ConsumptionCard.js
const mongoose = require('mongoose');

const CardSchema = new mongoose.Schema({
  year: { type: Number, required: true, unique: true },
  totalConsumption: { type: Number, default: 0 }
});

module.exports = mongoose.model('ConsumptionCard', CardSchema, 'consumption_cards');
