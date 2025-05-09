const mongoose = require('mongoose');


const PrinterSchema = new mongoose.Schema({
  Printer_ID:    { type: String, required: true, unique: true },
  Manufacturer:  String,
  Model:         String,
  Type:          { type: String, enum: ['Laser','Inkjet'] },
  Location:      String,
  Purchase_Date: Date,
  Warranty_Expiry: Date,
  Total_Pages:   Number,
  Network_IP:    String,
  Status:        { type: String, enum: ['Active','Inactive'] },
  Department:    String
});
module.exports = mongoose.model('printer', PrinterSchema, 'Printer');
