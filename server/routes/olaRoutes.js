const express = require('express');
const router = express.Router();
const {
  getConsumptionCardsStandard,
  addConsumptionCardStandard,
  getConsumptionCardDetails,
  updateConsumptionCardStandard,
  deleteConsumptionCardStandard,
  deleteDetailFromCard,
} = require('../controllers/olaController'); 
const historyController = require('../controllers/historyController');

// Routes pour les cartes de consommation OLA
router.get('/consumption-cards-standard', getConsumptionCardsStandard);
router.post('/consumption-cards-standard', addConsumptionCardStandard);
router.get('/consumption-cards-standard/:id', getConsumptionCardDetails);
router.put('/consumption-cards-standard/:id', updateConsumptionCardStandard);
router.delete('/consumption-cards-standard/:id', deleteConsumptionCardStandard);
router.put('/consumption-cards-standard/:cardId/details/:detailId?', deleteDetailFromCard);


// historique
router.get('/history', historyController.getActionHistory);
router.delete('/history', historyController.clearActionHistory);
module.exports = router; 