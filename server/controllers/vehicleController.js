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
    if (dateOf1stRegistration != null)
      vehicle.dateOf1stRegistration = dateOf1stRegistration;
    if (registrationNumber != null)
      vehicle.registrationNumber = registrationNumber;
    if (allocation != null) vehicle.allocation = allocation;

    // Sauvegarde du véhicule mis à jour
    const updatedVehicle = await vehicle.save();
    return res.json(updatedVehicle);
  } catch (err) {
    console.error('Error while updating vehicle:', err);
    return res.status(400).json({ message: err.message });
  }
};

exports.delete = async (req, res) => {
  const { id } = req.params;

  // Vérifier que l'ID est un ObjectId valide
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid Vehicle ID' });
  }
  try {
    const vehicle = await Vehicle.findById(id);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    await vehicle.deleteOne(); // Utiliser deleteOne() pour supprimer le document
    res.json({ message: 'Vehicle deleted' });
  } catch (err) {
    console.error('Error deleting vehicle:', err);
    res.status(500).json({ message: err.message });
  }
};

/* récupère la liste des véhicules pour alimenter un select(immat + model) */
exports.getListForSelect = async (req, res) => {
  try {
    // interroge mongo db pour obtenir tous les véhicules (deux champs registra + model)
    // .lean retourne des objets js au lieu des doc mongoose
    const list = await Vehicle.find({}, 'registrationNumber model').lean();
    //test résultat : console.log(' Liste trouvée:', list);
    // on transforme chaque document en objet simplifié
    //avec des clés adaptées à l'interface(immat + type)
    // v est l'objet , transformation de deux noms pour s'adapter côté client
    const mapped = list.map((v) => ({
      Immatriculation: v.registrationNumber,
      Type: v.model
    }));
    return res.status(200).json(mapped);
  } catch (err) {
    console.error('Errror getListForSelect:', err.message);
    return res
      .status(500)
      .json({ message: 'Error server', detail: err.message });
  }
};

/**
 * Recherche un véhicule par immatriculation, en tolérant les caractères parasites
 */
exports.getByImmat = async (req, res) => {
  try {
    // 1) Récupération et normalisation de la saisie
    //    - req.params.immat : la chaîne fournie dans l'URL
    //    - .trim() : supprime les espaces en début et fin
    //    - .toUpperCase() : uniformise en majuscules pour ignorer la casse    const raw = req.params.immat.trim().toUpperCase();

    // 2) Nettoyage : ne conserver que les caractères A–Z et 0–9
    //    Cela supprime tout ce qui pourrait gêner la regex (espaces, tirets, accents…)
    const cleaned = raw.replace(/[^A-Z0-9]/g, '');

    // 3) On crée un pattern qui laisse passer n'importe quel non-alphanum
    //    entre chaque caractère du cleaned
    //    Exemple : "RS144174WDB6421S3"
    //    => /^R[^A-Z0-9]*S[^A-Z0-9]*1...$/
    const pattern = cleaned
      .split('') // sépare en carctère
      // b) Échappe les métacaractères regex pour éviter toute interprétation
      .map((ch) => ch.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')) // échapper si jamais
      .join('[^A-Z0-9]*');
    // 4) Création de la RegExp finale
    //    - ^ et $ : ancrent le début et la fin de la chaîne pour correspondance exacte
    //    - 'i' : rend la recherche insensible à la casse (déjà normalisée, mais c'est une bonne pratique)
    const regex = new RegExp(`^${pattern}$`, 'i');

 // 5) Recherche en base avec Mongoose
    //    - Critère : registrationNumber correspond à la regex
    //    - Projection : ne récupérer que les champs utiles
    //    - .lean() : renvoyer un objet JS brut (POJO) plus léger qu’un document Mongoose
        const veh = await Vehicle.findOne(
      { registrationNumber: { $regex: regex } },
      'registrationNumber model assignedTo allocation'
    ).lean();
    // 6) Gestion du cas « vehicule pas trouvé »
    if (!veh) {
      return res.status(404).json({ message: 'Véhicule Not found' });
    }
    // 5) On renvoie tous les champs utiles
    return res.status(200).json({
      Immatriculation: veh.registrationNumber,
      Type: veh.model,
      assignedTo: veh.assignedTo,
      allocation: veh.allocation
    });
  } catch (err) {
    console.error('Error GetByImmat:', err);
    return res.status(500).json({ message: 'Error server' });
  }
};
