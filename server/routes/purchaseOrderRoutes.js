const express = require('express');
const PurchaseOrder = require('../models/PurchaseOrder');
const router = express.Router();

// GET /api/pos — lister toutes les commandes
router.get('/', async (req, res) => {
  const pos = await PurchaseOrder.find().sort({ createdDate: -1 });
  res.json(pos);
});

// GET /api/pos/:id — détail d’une commande
router.get('/:id', async (req, res) => {
const po = await PurchaseOrder.findById(req.params.id);
   if (!po) return res.status(404).json({ message: 'PO non trouvée' });
   res.json(po);
 });

module.exports = router;
