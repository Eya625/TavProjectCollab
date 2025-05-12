const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/dashboardFinanceController');

router.get('/vehicles',       ctrl.getVehicles);
router.get('/totalVehicles',  ctrl.getTotalVehicles);
router.get('/allocation',     ctrl.getAllocation);
router.get('/totalBilled',    ctrl.getTotalBilled);
router.get('/avgInvoice',     ctrl.getAvgInvoice);
router.get('/top5',           ctrl.getTop5);
router.get('/byBranch',       ctrl.getByBranch);
router.get('/invoicesByMonth',ctrl.getInvoicesByMonth);

module.exports = router;
