// services/billingServiceextract.js
const PurchaseOrder   = require('../models/PurchaseOrder');
const BillingVehicle  = require('../models/BillingVehicle');
const { extractInvoiceData } = require('./invoiceServices');
const { parse }       = require('date-fns');

/**
 * Traite un PDF de facture de véhicule :
 *  - Extraction OCR + parsing Python
 *  - Upsert PurchaseOrder
 *  - Création BillingVehicle
 *
 * @param {string} pdfPath
 * @returns {Promise<Object>}
 */
async function processInvoicePdf(pdfPath) {
  const data = await extractInvoiceData(pdfPath);
  const { Ref, Date: invDate, Immatriculation, Type, Montant, statut, po_number, po_date } = data;

  // Upsert PO
  const po = await PurchaseOrder.findOneAndUpdate(
    { poNumber: po_number },
    {
      poNumber:    po_number,
      createdDate: po_date
        ? (() => {
            const [d, m, y] = po_date.split('/').map(n=>parseInt(n,10));
            return new Date(y, m-1, d);
          })()
        : new Date(),
      supplier:    data.supplier || 'Inconnu',
      totalEstimated: data.total_estimated || 0
    },
    { upsert: true, new: true }
  );

  // Création BillingVehicle
  const invoice = await BillingVehicle.create({
    Ref,
    Date: invDate
      ? (() => {
          const [d, m, y] = invDate.split('/').map(n=>parseInt(n,10));
          return new Date(y, m-1, d);
        })()
      : new Date(),
    Immatriculation,
    Type,
    Montant,
    statut: statut || 'non payé',
    po:     po._id
  });

  return invoice;
}

module.exports = { processInvoicePdf };
