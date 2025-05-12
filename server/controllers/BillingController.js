const path = require('path'); 
const fs = require('fs');
const { extractInvoiceData } = require("../services/invoiceServices");
const Invoice = require("../models/BillingVehicle");

// Chemin vers le dossier où les factures PDF sont stockées
const VEHICLE_INVOICES_DIR = path.join(__dirname, '../Uploads/vehicleInvoices');

// Récupérer toutes les factures depuis MongoDB
const getVehicleInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find();  // Récupérer les factures depuis MongoDB
    res.status(200).json(invoices);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération des factures." });
  }
};

// Enregistrer une facture extraite dans MongoDB
const registerVehicleInvoice = async (req, res) => {
  try {
    const data = req.body.data || req.body;

    console.log('📥 registerVehicleInvoice payload:', data);

    // 1) Ref obligatoire
    if (!data.Ref) {
      return res.status(400).json({ message: "Champs manquants : Ref." });
    }

    // 2) Pas de doublon
    const existing = await Invoice.findOne({ Ref: data.Ref });
    if (existing) {
      return res.status(409).json({ message: "Une facture avec cette référence existe déjà." });
    }

    // 3) Conversion de la date
    let invoiceDate;
    if (typeof data.Date === 'string' && data.Date.includes('/')) {
      const [day, month, year] = data.Date.split('/').map(n => parseInt(n, 10));
      invoiceDate = new Date(year, month - 1, day);
    } else {
      invoiceDate = new Date(data.Date);
    }
    if (isNaN(invoiceDate.getTime())) {
      return res.status(400).json({ message: "Date invalide." });
    }

    // 4) Conversion du montant
    let montantNum = 0;
    if (data.Montant !== undefined) {
      // enlève les espaces et remplace la virgule par un point
      const cleaned = String(data.Montant)
        .replace(/\s+/g, '')
        .replace(',', '.');
      montantNum = parseFloat(cleaned);
      if (isNaN(montantNum)) {
        return res.status(400).json({ message: "Montant invalide." });
      }
    }

    // 5) Construction du document
    const parsedData = {
      Ref:            data.Ref,
      Date:           invoiceDate,
      Immatriculation: data.Immatriculation || '',
      Type:           data.Type || '',
      Montant:        montantNum,
      Category:       data.Category || '',
      statut:         data.statut || 'non payé',
    };

    // 6) Sauvegarde
    const newInvoice = new Invoice(parsedData);
    await newInvoice.save();

    return res.status(201).json({
      message: "Facture enregistrée avec succès.",
      invoice: parsedData
    });
  } catch (error) {
    console.error("Erreur lors de l'enregistrement :", error);
    return res.status(500).json({ message: error.message || "Erreur lors de l'enregistrement." });
  }
};


// gérer l'uplaod des factures 
const handleInvoiceUpload = async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ success: false, message: "Aucun fichier PDF fourni." });

    // 1) Extraire les données
    const extractedData = await extractInvoiceData(req.file.path);
// 1.1) Détection de la catégorie si non fournie
  extractedData.Category = extractedData.Category
    || (!extractedData.Immatriculation && /pneu/i.test(JSON.stringify(extractedData)))
      ? 'Pneus'
      : (extractedData.Immatriculation ? 'Véhicule' : ''); 
    // 2) Construire le nouveau nom basé sur la référence extraite
    const ref = extractedData.Ref || '';
    const safeRef = typeof ref === 'string' ? ref.replace(/[\\/:"*?<>|]+/g, '_') : 'facture_sans_ref';
    const destFilename = `${safeRef}.pdf`;
    const destPath = path.join(VEHICLE_INVOICES_DIR, destFilename);

    // 3) Déplacer/renommer le fichier uploadé
    fs.renameSync(req.file.path, destPath);

    // 4) Retourner la data et le nouveau nom de fichier
    res.status(200).json({
      success: true,
      data: extractedData,
      filename: destFilename    // on renvoie juste le file name
    });
  } catch (error) {
    console.error("Erreur extraction :", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
// controllers/BillingController.js
const getInvoicePdf = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: "Facture non trouvée." });

    // nom canonique basé sur la Ref
    const safeRef = invoice.Ref.trim().replace(/[\\/:"*?<>|]+/g, '_');
    let filename = `${safeRef}.pdf`;
    const fullPath = path.join(VEHICLE_INVOICES_DIR, filename);

    // fallback si besoin…
    if (!fs.existsSync(fullPath)) {
      const all = fs.readdirSync(VEHICLE_INVOICES_DIR);
      const fallback = all.find(f => f.toLowerCase().includes(invoice.Ref.toLowerCase()));
      if (!fallback) return res.status(404).json({ message: "PDF introuvable." });
      filename = fallback;
    }

    const url = `${req.protocol}://${req.get('host')}/uploads/vehicleInvoices/${filename}`;
    // on renvoie **pdf** pour coller à votre service
    res.status(200).json({ pdf: url });
  } catch (err) {
    next(err);
  }
};
const getInvoiceStats = async (req, res) => {
  try {
    const stats = await Invoice.aggregate([
      {
        $group: {
          _id: "$Category",
          totalMontant: { $sum: "$Montant" },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    res.status(200).json(stats);
  } catch (error) {
    console.error("Erreur lors de l'agrégation des stats :", error);
    res.status(500).json({ message: "Erreur lors de la récupération des statistiques." });
  }
};



module.exports = { handleInvoiceUpload, getVehicleInvoices, registerVehicleInvoice,getInvoicePdf ,getInvoiceStats};
