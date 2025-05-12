const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const VehicleSchema = new Schema({
  N: { type: Number, required: true },
  assignedTo: { type: String, required: true },
  Brunch: { type: String, required: true },
  model: { type: String, required: true },
  year: { type: Number, required: true },
  dateOf1stRegistration: { type: Date, required: true },
  registrationNumber: { type: String, required: true },
  allocation: { type: String, required: true }
});

module.exports = mongoose.model('Vehicles', VehicleSchema, 'vehicles');
