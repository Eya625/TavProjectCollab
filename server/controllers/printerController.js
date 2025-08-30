const Printer = require('../models/Printer');

// Récupérer tous les printers avec filtres possibles
exports.getAllPrinters = async (req, res) => {
  try {
    const { ref, type, state, department } = req.query;
    const filter = {};

    if (ref) {
      // filtre par identifiant (chaîne partielle, insensible à la casse)
      filter.Printer_ID = { $regex: ref, $options: 'i' };
    }
    if (type) {
      filter.Type = type;
    }
    if (state) {
      filter.Status = state;
    }
    if (department) {
      // department peut être une liste séparée par des virgules
      const deps = department.split(',').map(d => d.trim());
      filter.Department = { $in: deps };
    }

    const printers = await Printer.find(filter);
    res.status(200).json(printers);
  } catch (err) {
    console.error('Error fetching printers:', err);
    res.status(500).json({ error: err.message });
  }
};

// Récupérer une imprimante par son ID
exports.getPrinterById = async (req, res) => {
  try {
    const printer = await Printer.findById(req.params.id);
    if (!printer) {
      return res.status(404).json({ message: 'Printer not found' });
    }
    res.status(200).json(printer);
  } catch (err) {
    console.error('Error fetching printer by ID:', err);
    res.status(500).json({ error: err.message });
  }
};

// Ajouter une nouvelle imprimante
// controllers/printerController.js

// Ajouter une nouvelle imprimante
exports.addPrinter = async (req, res) => {
  try {
    const { Printer_ID } = req.body;

    // 1. Vérifier si la reference existe déjà
    const exists = await Printer.findOne({ Printer_ID: Printer_ID.trim() });
    if (exists) {
      // 2. Si oui, renvoyer un statut 409 Conflict
      return res
        .status(409)
        .json({ error: 'Printer_ID already exists.' });
    }

    // 3. Sinon, création normale
    const newPrinter = new Printer(req.body);
    await newPrinter.save();
    res.status(201).json(newPrinter);
  } catch (err) {
    console.error('Error adding printer:', err);
    res.status(400).json({ error: err.message });
  }
};

// Mettre à jour une imprimante existante
exports.updatePrinter = async (req, res) => {
  try {
    const updates = req.body;
    const updatedPrinter = await Printer.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );
    if (!updatedPrinter) {
      return res.status(404).json({ message: 'Printer not found' });
    }
    res.status(200).json(updatedPrinter);
  } catch (err) {
    console.error('Error updating printer:', err);
    res.status(400).json({ error: err.message });
  }
};

// Supprimer une imprimante
exports.deletePrinter = async (req, res) => {
  try {
    const deleted = await Printer.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Printer not found' });
    }
    res.status(200).json({ message: 'Printer deleted successfully' });
  } catch (err) {
    console.error('Error deleting printer:', err);
    res.status(500).json({ error: err.message });
  }
};
