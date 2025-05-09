const Vehicle = require('../models/Vehicles');
const mongoose = require('mongoose');
// Récupérer la liste de tous les véhicules
exports.getAll = async (req, res) => {
  try {
    const vehicles = await Vehicle.find();
    res.json(vehicles);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Récupérer un véhicule par son id
exports.getById = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }
    res.json(vehicle);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Ajouter un nouveau véhicule
exports.add = async (req, res) => {
  // On extrait les champs en supposant que le client envoie "branch" pour la branche
  const { N, assignedTo, Brunch, model, year, dateOf1stRegistration, registrationNumber, allocation } = req.body;
  const vehicle = new Vehicle({
    N,
    assignedTo,
    // Utilisation de "branch" pour renseigner le champ "Brunch" dans le modèle
    Brunch,
    model,
    year,
    dateOf1stRegistration,
    registrationNumber,
    allocation
  });
  try {
    const newVehicle = await vehicle.save();
    res.status(201).json(newVehicle);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// controllers/vehicleController.js

// Mettre à jour un véhicule existant
exports.update = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    // On extrait les données depuis le corps de la requête.
    // On attend désormais "Brunch" et non "branch" pour être en cohérence avec le frontend.
    const {
      N,
      assignedTo,
      Brunch,
      model,
      year,
      dateOf1stRegistration,
      registrationNumber,
      allocation
    } = req.body;

    // Mise à jour des champs s'ils sont fournis
    if (N != null) vehicle.N = N;
    if (assignedTo != null) vehicle.assignedTo = assignedTo;
    if (Brunch != null) vehicle.Brunch = Brunch;
    if (model != null) vehicle.model = model;
    if (year != null) vehicle.year = year;
    if (dateOf1stRegistration != null) vehicle.dateOf1stRegistration = dateOf1stRegistration;
    if (registrationNumber != null) vehicle.registrationNumber = registrationNumber;
    if (allocation != null) vehicle.allocation = allocation;

    // Sauvegarde du véhicule mis à jour
    const updatedVehicle = await vehicle.save();
    return res.json(updatedVehicle);
  } catch (err) {
    console.error("Erreur lors de la mise à jour du véhicule :", err);
    return res.status(400).json({ message: err.message });
  }
};

exports.delete = async (req, res) => {
  const { id } = req.params;

  // Vérifier que l'ID est un ObjectId valide
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'ID de véhicule invalide' });
  }

  try {
    const vehicle = await Vehicle.findById(id);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    await vehicle.deleteOne(); // Utiliser deleteOne() pour supprimer le document
    res.json({ message: 'Vehicle deleted' });
  } catch (err) {
    console.error('Erreur lors de la suppression du véhicule:', err);
    res.status(500).json({ message: err.message });
  }
};



