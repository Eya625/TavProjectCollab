const express = require("express");
const multer = require("multer");
const router = express.Router();
const vehicleConsController = require("../controllers/vehicleConsController");

// Middleware pour gérer les données multipart/form-data
const upload = multer();




// Routes for invoices
router.get("/invoices",vehicleConsController.getAllInvoices);
router.post("/invoices", vehicleConsController.addInvoice);
router.put("/invoices/:id", vehicleConsController.updateInvoice);
router.delete("/invoices/:id", vehicleConsController.deleteInvoice);


// Route for fetching all historical actions
router.get('/history',vehicleConsController.getActionHistory);



module.exports = router;
