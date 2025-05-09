const CurativeMaintenance = require('../models/CurativeMaintenance');

exports.addMaintenance = async (req, res) => {
  try {
    console.log("Received Maintenance Data:", req.body); // Log des données reçues
    const { Printer_ID, date, type, technician, description, cost } = req.body;

    if (!Printer_ID) {
      return res.status(400).json({ message: "Printer_ID is required" });
    }

    const newMaintenance = new CurativeMaintenance({
      Printer_ID,
      date,
      type,
      technician,
      description,
      cost
    });

    await newMaintenance.save();
    res.status(201).json({ message: 'Maintenance added successfully', data: newMaintenance });
  } catch (error) {
    res.status(500).json({ message: 'Error adding maintenance', error: error.message });
  }
};


// Récupérer toutes les interventions
exports.getAllMaintenances = async (req, res) => {
  try {
    const maintenances = await CurativeMaintenance.find();
    res.status(200).json(maintenances);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching maintenances', error: error.message });
  }
};
