 /* ===== Routes de facturation PDF OLA  ===== */

 const express = require('express');
 const router = express.Router();
 const controller = require('../controllers/vehicleConsController');



 router.post('/upload', controller.uploadMiddleware, controller.uploadPdf); // GET             → lister tous les PDF
 router.get('/', controller.getAllPdfs);
 
 
 // GET  /billing/vehicle-pdfs/:id/url    → récupérer l’URL publique d’un PDF
 router.get('/:id/url', controller.getPdfUrl);
 
 
 module.exports = router;
