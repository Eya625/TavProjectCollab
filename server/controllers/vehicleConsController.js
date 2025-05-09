// vehicleConsController Invoices.js

//const upload = multer(); // passer les données pour l'upgrade
const Invoice = require('../models/Invoice');
const ActionHistory = require('../models/ActionHistory');
const InvoicePDF = require('../models/InvoicePDF');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Historique des actions en mémoire
const logAction = (type, entity, data) => {
  const action = new ActionHistory({
    type,
    entity,
    data
  });

  // Enregistrer l'action dans la base de données
  action
    .save()
    .then(() => {
      console.log("Action enregistrée dans l'historique");
    })
    .catch((err) => {
      console.error(
        "Erreur lors de l'enregistrement de l'action historique :",
        err
      );
    });
};

/*                partie facturation           */
exports.getAllInvoices = async (req, res) => {
  try {
    console.log('Requête reçue pour récupérer les factures');
    const invoices = await Invoice.find();
    console.log('Factures récupérées :', invoices);
    res.status(200).json(invoices);
  } catch (error) {
    console.error('Erreur lors de la récupération des factures:', error);
    res
      .status(500)
      .json({ message: 'Erreur lors de la récupération des factures', error });
  }
};
exports.addInvoice = async (req, res) => {
  try {
    console.log('Données reçues :', req.body); // Ajoute ce log pour vérifier les données envoyées

    const invoice = new Invoice(req.body);
    const savedInvoice = await invoice.save();
    logAction('add', 'invoice', savedInvoice);

    res.status(201).json(savedInvoice);
  } catch (error) {
    console.error("Erreur lors de l'ajout :", error); // Log plus détaillé
    res
      .status(500)
      .json({ message: "Erreur lors de l'ajout", error: error.message });
  }
};

// Modifier une facture
exports.updateInvoice = async (req, res) => {
  try {
    const updatedInvoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedInvoice)
      return res.status(404).json({ message: 'Facture non trouvée' });

    logAction('update', 'invoice', updatedInvoice);
    res.status(200).json(updatedInvoice);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour', error });
  }
};

// Supprimer une facture
exports.deleteInvoice = async (req, res) => {
  try {
    const deletedInvoice = await Invoice.findByIdAndDelete(req.params.id);
    if (!deletedInvoice)
      return res.status(404).json({ message: 'Facture non trouvée' });

    logAction('delete', 'invoice', deletedInvoice);
    res.status(200).json({ message: 'Facture supprimée' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la suppression', error });
  }
};
// Récupérer tout l'historique des actions
exports.getActionHistory = async (req, res) => {
  try {
    const actions = await ActionHistory.find().sort({ timestamp: -1 }); // Trier par date décroissante
    res.status(200).json(actions);
  } catch (error) {
    console.error("Erreur lors de la récupération de l'historique :", error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

/*  __________ Uploading des factures OLA mensuelles */

// on va s'assurer <ue le dossier existe
const baseUploadDir = path.join(__dirname, '..', 'Uploads');
const olaDir = path.join(baseUploadDir, 'OLAMonthInvoices');
if (!fs.existsSync(olaDir)) {
  fs.mkdirSync(olaDir, { recursive: true });
  console.log(`Created directory ${olaDir}`);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, olaDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    // on préserve originalname après le suffixe
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') cb(null, true);
  else cb(new Error('Only PDF files are allowed'), false);
};
const limits = { fileSize: 5 * 1024 * 1024 }; // 5 Mo max

// Export du middleware Multer
exports.uploadMiddleware = multer({ storage, fileFilter, limits }).single(
  'file'
);

// ------------------ Méthodes CRUD PDF ------------------

// Upload d’un PDF de facturation
exports.uploadPdf = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const newPdf = new InvoicePDF({
      filename:req.file.originalname,
      path: req.file.path,
      mimetype: req.file.mimetype,
      size: req.file.size
    });
    const saved = await newPdf.save();
    res.status(201).json(saved);
  } catch (err) {
    next(err);
  }
};

// Lister tous les PDF (metadata)
exports.getAllPdfs = async (req, res, next) => {
  try {
    const pdfs = await InvoicePDF.find().sort({ uploadedAt: -1 });
    res.status(200).json(pdfs);
  } catch (err) {
    next(err);
  }
};

// recupérer le pdf (btn see details)
exports.getPdfUrl = async (req, res, next) => {
  try {
    const pdf = await InvoicePDF.findById(req.params.id);
    if (!pdf) 
      return res.status(404).json({ message: 'PDF not found' });

    // calcule le chemin relatif sous server/ 
    const relPath = path.relative(
      path.join(__dirname, '..'),
      pdf.path
    ).replace(/\\/g, '/');  
    // relPath === 'uploads/OLAMonthInvoices/<votre-fichier>.pdf'

    const url = `${req.protocol}://${req.get('host')}/${relPath}`;
    res.status(200).json({ url });

  } catch (err) {
    next(err);
  }
};