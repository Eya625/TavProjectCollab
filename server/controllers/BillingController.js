// controllers/BillingController.js
const path = require('path');
const fs = require('fs');
const { extractInvoiceData } = require("../services/invoiceServices");
const Invoice = require("../models/BillingVehicle");

// Dossier de stockage des PDFs
const VEHICLE_INVOICES_DIR = path.join(__dirname, '../Uploads/vehicleInvoices');

// 1) Upload & extraction + renommage + sauvegarde
const handleInvoiceUpload = async (req, res) => {
  try {
    console.log("[upload] req.file =", req.file);
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Aucun fichier PDF fourni (champ 'pdf')." });
    }

    // 1.1 Extraction
    const result = await extractInvoiceData(req.file.path);
    console.log("[upload] service result =", result);
    if (!result.success) {
      console.error("[upload] Échec extraction :", result);
      return res.status(500).json({ success: false, message: "Échec de l'extraction des données." });
    }
    const extractedData = result.data;
    const extractor = result.extractor ?? null;
    console.log("[upload] extractedData =", extractedData);

    // 1.2 Catégorie automatique
    extractedData.Category = extractedData.Category
      || (!extractedData.Immatriculation && /pneu/i.test(JSON.stringify(extractedData)))
        ? 'Pneus'
        : (extractedData.Immatriculation ? 'Véhicule' : '');

    // 1.3 Création du dossier cible si besoin
    if (!fs.existsSync(VEHICLE_INVOICES_DIR)) {
      fs.mkdirSync(VEHICLE_INVOICES_DIR, { recursive: true });
    }

    // 1.4 Construction du nom de fichier sécurisé
    const rawRef   = extractedData.Ref || '';
    const safeRef  = String(rawRef).replace(/[\\/:"*?<>|]+/g, '_') || `sans_ref_${Date.now()}`;
    const destName = `${safeRef}.pdf`;
    const destPath = path.join(VEHICLE_INVOICES_DIR, destName);

    // 1.5 Déplacement du PDF
    await fs.promises.rename(req.file.path, destPath)
      .catch(err => {
        console.error("[upload] Erreur lors du rename :", err);
        throw new Error("Échec du renommage du PDF");
      });

    // 1.6 Conversion & validation des champs
    const invoiceDate = new Date(extractedData.Date);
    if (isNaN(invoiceDate.getTime())) {
      return res.status(400).json({ success: false, message: "Date extraite invalide." });
    }
    const montantNum = parseFloat(extractedData.Montant);
    if (isNaN(montantNum)) {
      return res.status(400).json({ success: false, message: "Montant extrait invalide." });
    }

    // 1.7 Statut validé
    const validStatuts = ['payé', 'non payé', 'partiellement payé'];
    const statut = validStatuts.includes(extractedData.statut)
      ? extractedData.statut
      : 'non payé';

    // 1.8 Création du document MongoDB
    const newInvoice = new Invoice({
      Ref:            extractedData.Ref,
      Date:           invoiceDate,
      Immatriculation: extractedData.Immatriculation,
      Type:           extractedData.Type,
      Montant:        montantNum,
      Category:       extractedData.Category,
      statut:         statut,
    });
    await newInvoice.save();

    // 1.9 Réponse
    return res.status(200).json({
      success:   true,
      data:      extractedData,
      filename:  destName,
      invoice:   newInvoice,
      extractor: extractor
    });

  } catch (error) {
    console.error("[upload] Erreur interne :", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 2) Enregistrer une facture à partir d’un payload JSON
const registerVehicleInvoice = async (req, res) => {
  try {
    const data = req.body.data || req.body;

    if (!data.Ref) {
      return res.status(400).json({ message: "Champs manquants : Ref." });
    }
    if (await Invoice.findOne({ Ref: data.Ref })) {
      return res.status(409).json({ message: "Une facture avec cette référence existe déjà." });
    }

    let invoiceDate;
    if (typeof data.Date === 'string' && data.Date.includes('/')) {
      const [d, m, y] = data.Date.split('/').map(n => parseInt(n, 10));
      invoiceDate = new Date(y, m - 1, d);
    } else {
      invoiceDate = new Date(data.Date);
    }
    if (isNaN(invoiceDate.getTime())) {
      return res.status(400).json({ message: "Date invalide." });
    }

    const cleaned = String(data.Montant || '').replace(/\s+/g, '').replace(',', '.');
    const montantNum = parseFloat(cleaned);
    if (isNaN(montantNum)) {
      return res.status(400).json({ message: "Montant invalide." });
    }

    const parsedData = {
      Ref:            data.Ref,
      Date:           invoiceDate,
      Immatriculation: data.Immatriculation || '',
      Type:           data.Type || '',
      Montant:        montantNum,
      Category:       data.Category || '',
      statut:         ['payé', 'non payé', 'partiellement payé'].includes(data.statut)
                       ? data.statut
                       : 'non payé',
    };

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

// 3) Lister toutes les factures
const getVehicleInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find();
    res.status(200).json(invoices);
  } catch (error) {
    console.error("Erreur récupération factures :", error);
    res.status(500).json({ message: "Erreur lors de la récupération des factures." });
  }
};

// 4) Retourner l’URL du PDF d’une facture
const getInvoicePdf = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: "Facture non trouvée." });

    const safeRef = invoice.Ref.trim().replace(/[\\/:"*?<>|]+/g, '_');
    let filename = `${safeRef}.pdf`;
    let fullPath = path.join(VEHICLE_INVOICES_DIR, filename);

    if (!fs.existsSync(fullPath)) {
      const allFiles = fs.readdirSync(VEHICLE_INVOICES_DIR);
      const fallback = allFiles.find(f => f.toLowerCase().includes(invoice.Ref.toLowerCase()));
      if (!fallback) return res.status(404).json({ message: "PDF introuvable." });
      filename = fallback;
      fullPath = path.join(VEHICLE_INVOICES_DIR, filename);
    }

    const url = `${req.protocol}://${req.get('host')}/uploads/vehicleInvoices/${filename}`;
    res.status(200).json({ pdf: url });
  } catch (err) {
    next(err);
  }
};

// 5) Statistiques par catégorie
const getInvoiceStats = async (req, res) => {
  try {
    const stats = await Invoice.aggregate([
      { $group: { _id: "$Category", totalMontant: { $sum: "$Montant" }, count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    res.status(200).json(stats);
  } catch (error) {
    console.error("Erreur stats :", error);
    res.status(500).json({ message: "Erreur lors de la récupération des statistiques." });
  }
};

module.exports = {
  handleInvoiceUpload,
  registerVehicleInvoice,
  getVehicleInvoices,
  getInvoicePdf,
  getInvoiceStats
};
