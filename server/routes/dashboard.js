// routes/dashboard.js
const express = require('express');
const router  = express.Router();

// Si tu veux garder ton test-insert dans ce même fichier :
const mongoose = require('mongoose');
const coll = mongoose.connection.collection('consumptions');

router.post('/test-insert', async (req, res) => {
  try {
    const doc = {
      timestamp: new Date(),
      value: Math.floor(Math.random() * 100)
    };
    const result = await coll.insertOne(doc);
    return res.status(201).json({ inserted: result.insertedId, doc });
  } catch (err) {
    console.error('Test-insert error:', err);
    return res.status(500).json({ error: 'Échec insertion test' });
  }
});

// Passe l’import ESModule en require CommonJS
const {
  getByLocation,
  getByMonth,
  getTopEmployees,
  getYoYFuelVariation,
  getInvoiceDetails,
  getAllEmployees,
  getAllLocations,
  getAllYears,
  getYearlyConsumption
} = require('../controllers/dashboard');

router.get('/by-location',    getByLocation);
router.get('/by-month',       getByMonth);
router.get('/top-employees',  getTopEmployees);
router.get('/yoy-fuel-variation',getYoYFuelVariation);
router.get('/invoice-details',getInvoiceDetails);
router.get('/employees', getAllEmployees);
router.get('/locations', getAllLocations);      
router.get('/years', getAllYears);
router.get('/consumption/yearly',getYearlyConsumption);

module.exports = router;
