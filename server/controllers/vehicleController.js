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
  const { N, assignedTo, Brunch, model, year, dateOf1stRegistration, registrationNumber, allocation } = req.body;
  const vehicle = new Vehicle({
    N,
    assignedTo,
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


// Mettre à jour un véhicule existant
exports.update = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    // On extrait les données depuis le corps de la requête.
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
exports.getListForSelect = async (req, res) => {
  try {
    console.log(" Requête reçue pour getListForSelect");
    const list = await Vehicle.find({}, 'registrationNumber model').lean();
    console.log(" Liste trouvée:", list);
    const mapped = list.map(v => ({
      Immatriculation: v.registrationNumber,
      Type: v.model
    }));
    return res.status(200).json(mapped);
  } catch (err) {
    console.error('🏷 Erreur getListForSelect:', err.message);
    return res.status(500).json({ message: 'Erreur serveur', detail: err.message });
  }
};

/* section facturation afin de récupéerr la liste des immat existante  */
// controllers/vehicleController.js
exports.getByImmat = async (req, res) => {
  try {
    // 1) On récupère la valeur brute, uppercase
    const raw = req.params.immat.trim().toUpperCase();

    // 2) On nettoie pour ne garder que A–Z et 0–9
    const cleaned = raw.replace(/[^A-Z0-9]/g, '');

    // 3) On crée un pattern qui laisse passer n'importe quel non-alphanum
    //    entre chaque caractère du cleaned
    //    Exemple : "RS144174WDB6421S3"
    //    => /^R[^A-Z0-9]*S[^A-Z0-9]*1...$/
    const pattern = cleaned
      .split('')
      .map(ch => ch.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')) // échapper si jamais
      .join('[^A-Z0-9]*');
    const regex = new RegExp(`^${pattern}$`, 'i');

    // 4) On cherche en base
    const veh = await Vehicle.findOne(
      { registrationNumber: { $regex: regex } },
      'registrationNumber model assignedTo allocation'
    ).lean();

    if (!veh) {
      return res.status(404).json({ message: 'Véhicule non trouvé' });
    }

    // 5) On renvoie tous les champs utiles
    return res.status(200).json({
      Immatriculation: veh.registrationNumber,
      Type:            veh.model,
      assignedTo:      veh.assignedTo,
      allocation:      veh.allocation
    });
  } catch (err) {
    console.error('Erreur getByImmat:', err);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};
