const express = require('express');
const router = express.Router();
const curativeMaintenanceController = require('../controllers/curativeMaintenanceController');

// Route pour ajouter une intervention
router.post('/add', curativeMaintenanceController.addMaintenance);

// Route pour récupérer toutes les interventions
router.get('/all', curativeMaintenanceController.getAllMaintenances);

module.exports = router;
