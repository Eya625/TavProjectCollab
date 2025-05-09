const express = require('express');
const multer = require('multer');
const router = express.Router();
const printerController = require('../controllers/printerController');

// Middleware pour gérer les données multipart/form-data (si besoin)
const upload = multer();

// Routes pour le parc d'imprimantes
// Récupérer tous les imprimeurs (avec filtres query éventuels)
router.get('/', printerController.getAllPrinters);

// Récupérer une imprimante par ID
router.get('/:id', printerController.getPrinterById);

// Ajouter une nouvelle imprimante
// upload.none() si pas de fichier, sinon adapter upload.single('fileField')
router.post('/', upload.none(), printerController.addPrinter);

// Mettre à jour une imprimante existante
router.put('/:id', upload.none(), printerController.updatePrinter);

// Supprimer une imprimante
router.delete('/:id', printerController.deletePrinter);

module.exports = router;
