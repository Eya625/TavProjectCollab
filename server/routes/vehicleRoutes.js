// vehicleRoutes.js
const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicleController');



// **Nouvelles routes pour le front Facturation.vue**
router.get('/select',          vehicleController.getListForSelect);
router.get('/by-immat/:immat', vehicleController.getByImmat);


// Récupérer tous les véhicules
router.get('/', vehicleController.getAll);

// Récupérer un véhicule par son id
router.get('/:id', vehicleController.getById);

// Ajouter un véhicule
router.post('/', vehicleController.add);

// Mettre à jour un véhicule
router.put('/:id', vehicleController.update);

// Supprimer un véhicule
router.delete('/:id', vehicleController.delete);



  
module.exports = router;
