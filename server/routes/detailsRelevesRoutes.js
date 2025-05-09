// routes/detailsRelevesRoutes.js

const express = require('express');
const multer = require('multer');
const path = require('path');
const { uploadDetailsReleves } = require('../controllers/detailsRelevesController');
const { saveReleves } = require('../controllers/detailsRelevesController');
const router = express.Router();
const upload = multer({ dest: path.join(__dirname, '../Uploads/invoiceDetails') });

router.post(
    '/upload/details-releves',
    upload.single('file'),
    uploadDetailsReleves
  );
  
  // POST /api/billing/releves/save-releves
  router.post('/save-releves', saveReleves);
module.exports = router;
