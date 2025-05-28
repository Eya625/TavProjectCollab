const express = require("express");  // création d'un routeur et gestion des requêtes HTTP
const router = express.Router(); // cération d'un contrôleur pour définir ces sous-routes
const vehicleConsController = require("../controllers/vehicleConsController");




// Routes for invoices

// GET  /invoices
// Récupère toutes les factures depuis la base de données
router.get("/invoices",vehicleConsController.getAllInvoices);


// POST /invoices
// Ajoute une nouvelle facture (données reçues dans req.body)
router.post("/invoices", vehicleConsController.addInvoice);


// PUT  /invoices/:id
// Met à jour la facture dont l’ID est passé en paramètre d’URL
router.put("/invoices/:id", vehicleConsController.updateInvoice);
// DELETE /invoices/:id
// Supprime la facture identifiée par l’ID en paramètre
router.delete("/invoices/:id", vehicleConsController.deleteInvoice);


// GET /history
// Récupère le journal complet (logs) des actions réalisées (add, update, delete, etc.)
// Route for fetching all historical actions
router.get('/history',vehicleConsController.getActionHistory);



module.exports = router;
