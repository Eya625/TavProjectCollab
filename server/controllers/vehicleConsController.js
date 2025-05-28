
const multer = require('multer'); // gestionnaire d'upload de fichiers -> middleware dans express
const Invoice = require('../models/Invoice');
const ActionHistory = require('../models/ActionHistory');
const InvoicePDF = require('../models/InvoicePDF'); // modele enregistre la version PDF
const path = require('path'); // manipulation des fichiers
const fs = require('fs'); //file system (lire/ écrire/ supprimer) des fichiers locaux

// Historique des actions en mémoire : traçage de toute opération
const logAction = (type, entity, data) => {
  const action = new ActionHistory({
    type,
    entity,
    data
  });
  // Enregistrer l'action dans la base de données
  action
    .save() // retourne une promesse en cas de succ ou err
    .then(() => {
      console.log("action saved ");
    })
    .catch((err) => {
      console.error(
        "error while saving Action history :",
        err
      );
    });
};

/*                partie facturation           */
// handler(gestionnaire) de la route get / invoice ex 
exports.getAllInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find();
    console.log('Factures récupérées :', invoices);
    res.status(200).json(invoices);
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Erreur fetching invoices', error });
  }
};

exports.addInvoice = async (req, res) => {
  try {
    //console.log('Added Data :', req.body); //  vérifier les données envoyées dans le console
    const invoice = new Invoice(req.body);
    const savedInvoice = await invoice.save();
    logAction('add', 'invoice', savedInvoice);
    res.status(201).json(savedInvoice);
  } catch (error) {
    console.error("Error while Adding:", error); 
    res.status(500).json({ error: "Error while Adding "});
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
      return res.status(404).json({ message: 'invoice Not found ' });

    logAction('update', 'invoice', updatedInvoice);
    res.status(200).json(updatedInvoice);
  } catch (error) {
    res.status(500).json({ message: 'Error while Updating ', error });
  }
};
//Supprimer une facture
exports.deleteInvoice = async (req, res) => {
  try {
    const deletedInvoice = await Invoice.findByIdAndDelete(req.params.id);
    if (!deletedInvoice)
      return res.status(404).json({ message: 'Invoice not Found' });

    logAction('delete', 'invoice', deletedInvoice);
    res.status(200).json({ message: 'Invoice deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting Invoice', error });
  }
};

// Récupérer tout l'historique des actions
exports.getActionHistory = async (req, res) => {
  try {
    const actions = await ActionHistory.find().sort({ timestamp: -1 }); // Trier par date décroissante
    res.status(200).json(actions);
  } catch (error) {
    console.error("Error while fetching action history :", error);
    res.status(500).json({ message: 'Server Error' });
  }
};


/*  __________ Uploading des factures OLA mensuelles */

// on va s'assurer que le dossier existe
const baseUploadDir = path.join(__dirname, '..', 'Uploads');
const olaDir = path.join(baseUploadDir, 'OLAMonthInvoices');
if (!fs.existsSync(olaDir)) {
  fs.mkdirSync(olaDir, { recursive: true });
  console.log(`Created directory ${olaDir}`);
}

const storage = multer.diskStorage({
  // fonction qui indique où on stocke le fichier (olaDir)
  destination: (req, file, cb) => {
    cb(null, olaDir);
  },
  // on préserve le nom originale du fichier 
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    // on préserve originalname après le suffixe
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
// autorisation seulement des pdfs
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') cb(null, true);
  else cb(new Error('format erronée'), false);
};
const limits = { fileSize: 5 * 1024 * 1024 }; // 5 Mo max

// Export du middleware Multer
exports.uploadMiddleware = multer({ storage, fileFilter, limits }).single(
  'file'
);

// ------------------ Méthodes CRUD PDF ------------------

// Upload d’un PDF de facturation
// création de middleware multer (gestionnaire)
exports.uploadPdf = async (req, res, next) => {
  try {
    if (!req.file) 
      return res.status(400).json({ message: 'No file uploaded' });

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
    const url = `${req.protocol}://${req.get('host')}/${relPath}`;
    res.status(200).json({ url });

  } catch (err) {
    next(err);
  }
};