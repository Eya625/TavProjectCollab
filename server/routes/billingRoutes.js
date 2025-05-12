const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const {
  handleInvoiceUpload,
  getVehicleInvoices,
  registerVehicleInvoice,
  getInvoicePdf,
  getInvoiceStats 
} = require("../controllers/BillingController");

const router = express.Router();

// 1) Upload & extraction
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tempDir = path.join(__dirname, "../tempUploads");
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });
router.post("/upload", upload.single("pdf"), handleInvoiceUpload);

// 2) Lister les factures
router.get("/", getVehicleInvoices);

// 3) Enregistrer en base
//    Note : Vue.js appelle POST sur '/api/invoices'
router.post("/", registerVehicleInvoice);

// 4) Télécharger le PDF d'une facture
router.get("/:id/pdf", getInvoicePdf);

router.get("/stats", getInvoiceStats);

module.exports = router;
