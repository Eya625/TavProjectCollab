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

    // Vérification de la présence des champs obligatoires
    if (!data.Ref) {
      return res.status(400).json({ message: "Champs manquants : Ref." });
    }
     // ─── Empêcher les doublons de référence ───
   const existing = await Invoice.findOne({ Ref: data.Ref });
  if (existing) {
     return res.status(409).json({ message: "Une facture avec cette référence existe déjà." });
   }

    // ─── Conversion de la date (DD/MM/YYYY) ───
    const [day, month, year] = data.Date.split('/');
    const invoiceDate = new Date(Number(year), Number(month) - 1, Number(day));

    // ─── Construction de l'objet à sauvegarder ───
    const parsedData = {
      Ref:            data.Ref,
      Date:           invoiceDate,
      Immatriculation: data.Immatriculation || '',
      Type:           data.Type            || '',
      Montant:        data.Montant,
      Category:       data.Category        || '',
      statut:         data.statut         || 'non payé'   // ← ajout du champ statut
    };

    // Sauvegarde dans MongoDB
    const newInvoice = new Invoice(parsedData);
    await newInvoice.save();

    return res.status(201).json({
      message: "Facture enregistrée avec succès.",
      invoice: parsedData
    });
  } catch (error) {
    console.error("Erreur lors de l'enregistrement :", error);
    return res.status(500).json({ message: "Erreur lors de l'enregistrement." });
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



module.exports = { handleInvoiceUpload, getVehicleInvoices, registerVehicleInvoice,getInvoicePdf };
