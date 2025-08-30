const path = require('path'); // manipulation des chemins des fichiers
const fs = require('fs'); // accès au systeme fichiers(lecture / ecriture / ...)

// Service qui encapsule la logique d’OCR et d’extraction de données depuis un PDF
const { extractInvoiceData } = require('../services/invoiceServices');
const Invoice = require('../models/BillingVehicle');

// Dossier de stockage  des des factures PDFs
const VEHICLE_INVOICES_DIR = path.join(__dirname, '../Uploads/vehicleInvoices');

/**
 * 1) Upload & extraction + renommage du PDF + réponse JSON
 * Reçoit un PDF uploadé,
 * Extrait automatiquement les données via un service OCR,
 * Renomme et déplace le fichier sur le serveur,
 * Retourne en JSON les données extraites (sans encore enregistrer en base).
 */
const handleInvoiceUpload = async (req, res) => {
  try {
    console.log('[upload] req.file =', req.file);
    // --- 1.0 Vérification de la présence du fichier dans la requête ---
    if (!req.file) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Aucun fichier PDF fourni (champ 'pdf')."
        });
    }

    // --- 1.1 Extraction OCR des données de la facture ---
    // extractInvoiceData appelle le « master extractor » qui combine extractor.py et extractor2.py    
    const result = await extractInvoiceData(req.file.path);
    console.log('[upload] service result =', result);
    if (!result.success) {
      console.error('[upload] Échec extraction :', result);
      return res
        .status(500)
        .json({
          success: false,
          message: "Échec de l'extraction des données."
        });
    }
    const extractedData = result.data; // { Ref, Date, Immatriculation, Montant, statut, etc. }
    const extractor = result.extractor ?? null; // indique quel extracteur a été utilisé
    console.log('[upload] extractedData =', extractedData);

    // --- 1.2 Catégorisation automatique “Pneus” vs “Véhicule” ---
    // Si pas d’Immatriculation mais qu’on trouve “pneu” dans les données, on regroupe en 'Pneus'
    // Sinon, si Immatriculation existe, on choisit 'Véhicule'
    extractedData.Category =
      extractedData.Category ||
      (!extractedData.Immatriculation &&
        /pneu/i.test(JSON.stringify(extractedData)))
        ? 'Pneus'
        : extractedData.Immatriculation
          ? 'Véhicule'
          : '';

    // --- 1.3 Création du dossier de destination si nécessaire ---
    if (!fs.existsSync(VEHICLE_INVOICES_DIR)) {
      fs.mkdirSync(VEHICLE_INVOICES_DIR, { recursive: true });
    }

    // --- 1.4 Construction d’un nom de fichier “sûr” à partir de la Ref ---
    const rawRef = extractedData.Ref || '';
    // On remplace tous les caractères interdits dans un nom de fichier par ‘_’
    const safeRef =
      String(rawRef).replace(/[\\/:"*?<>|]+/g, '_') || `sans_ref_${Date.now()}`;
    const destName = `${safeRef}.pdf`;
    const destPath = path.join(VEHICLE_INVOICES_DIR, destName);

    // --- 1.5 Déplacement / renommage du fichier uploadé vers notre dossier ---
    await fs.promises.rename(req.file.path, destPath).catch((err) => {
      console.error('[upload] Erreur lors du rename :', err);
      throw new Error('Échec du renommage du PDF');
    });

    // --- 1.6 Validation des champs extraits : Date et Montant ---
    const invoiceDate = new Date(extractedData.Date);
    if (isNaN(invoiceDate.getTime())) {
      return res
        .status(400)
        .json({ success: false, message: 'Date extraite invalide.' });
    }
    const montantNum = parseFloat(extractedData.Montant);
    if (isNaN(montantNum)) {
      return res
        .status(400)
        .json({ success: false, message: 'Montant extrait invalide.' });
    }

    // --- 1.7 Normalisation du statut de paiement ---
    const validStatuts = ['payé', 'non payé', 'partiellement payé'];
    const statut = validStatuts.includes(extractedData.statut)
      ? extractedData.statut
      : 'non payé';
    // --- 1.8 Réponse : on renvoie simplement les données extraites et le nom de fichier ---
    return res.status(200).json({
      success: true,
      data: extractedData,
      filename: destName,
      extractor: extractor
    });
  } catch (error) {
    console.error('[upload] Erreur interne :', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 2) Enregistrer une facture en base depuis un JSON
 * Accepte un payload JSON validé (contenant Ref, Date, Montant, etc.),
 * Vérifie l’unicité de la référence,
 * Convertit la date et le montant,
 * Sauvegarde le document Mongoose en base MongoDB.
 */

const registerVehicleInvoice = async (req, res) => {
  try {
    // On récupère les données soit dans req.body.data, soit directement dans req.body
    const data = req.body.data || req.body;

    // Vérifie la présence de la référence
    if (!data.Ref) {
      return res.status(400).json({ message: 'Champs manquants : Ref.' });
    }
    // Vérifie l’unicité de la référence
    if (await Invoice.findOne({ Ref: data.Ref })) {
      return res
        .status(409)
        .json({ message: 'Une facture avec cette référence existe déjà.' });
    }
    // --- Conversion de la date en objet JS Date ---
    let invoiceDate;
    if (typeof data.Date === 'string' && data.Date.includes('/')) {
      // format JJ/MM/AAAA
      const [d, m, y] = data.Date.split('/').map((n) => parseInt(n, 10));
      invoiceDate = new Date(y, m - 1, d);
    } else {
      invoiceDate = new Date(data.Date);
    }
    if (isNaN(invoiceDate.getTime())) {
      return res.status(400).json({ message: 'Date invalide.' });
    }
    // --- Nettoyage et conversion du Montant en nombre ---
    const cleaned = String(data.Montant || '')
      .replace(/\s+/g, '')
      .replace(',', '.');
    const montantNum = parseFloat(cleaned);
    if (isNaN(montantNum)) {
      return res.status(400).json({ message: 'Montant invalide.' });
    }
    // Prépare l’objet final à sauvegarder
    const parsedData = {
      Ref: data.Ref,
      Date: invoiceDate,
      Immatriculation: data.Immatriculation || '',
      Type: data.Type || '',
      Montant: montantNum,
      Category: data.Category || '',
      statut: ['payé', 'non payé', 'partiellement payé'].includes(data.statut)
        ? data.statut
        : 'non payé'
    };
    // Sauvegarde en base MongoDB
    const newInvoice = new Invoice(parsedData);
    await newInvoice.save();

    return res.status(201).json({
      message: 'Facture enregistrée avec succès.',
      invoice: parsedData
    });
  } catch (error) {
    console.error("Erreur lors de l'enregistrement :", error);
    return res
      .status(500)
      .json({ message: error.message || "Erreur lors de l'enregistrement." });
  }
};


/**
 * 3) Récupérer la liste de toutes les factures
 */
const getVehicleInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find();
    res.status(200).json(invoices);
  } catch (error) {
    console.error('Erreur récupération factures :', error);
    res
      .status(500)
      .json({ message: 'Erreur lors de la récupération des factures.' });
  }
};

/**
 * 4) Fournir l’URL du PDF associé à une facture
 */
//Pour un ID de facture donné, construit l’URL publique du PDF correspondant,
// Gère les cas où le fichier a un nom différent (fallback).
const getInvoicePdf = async (req, res, next) => {
  try {
    // Recherche du document MongoDB par son _id
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice)
      return res.status(404).json({ message: 'Facture non trouvée.' });
    
    // Construit le nom de fichier sécurisé à partir de la Ref
    const safeRef = invoice.Ref.trim().replace(/[\\/:"*?<>|]+/g, '_');
    let filename = `${safeRef}.pdf`;
    let fullPath = path.join(VEHICLE_INVOICES_DIR, filename);
    
    // Si le PDF n’existe pas sous ce nom, on cherche un fallback par inclusion de la Ref
    if (!fs.existsSync(fullPath)) {
      const allFiles = fs.readdirSync(VEHICLE_INVOICES_DIR);
      const fallback = allFiles.find((f) =>
        f.toLowerCase().includes(invoice.Ref.toLowerCase())
      );
      if (!fallback)
        return res.status(404).json({ message: 'PDF introuvable.' });
      filename = fallback;
      fullPath = path.join(VEHICLE_INVOICES_DIR, filename);
    }

    // Génère l’URL publique vers le PDF (hypothèse : dossier statique monté sur /uploads)
    const url = `${req.protocol}://${req.get('host')}/uploads/vehicleInvoices/${filename}`;
    res.status(200).json({ pdf: url });
  } catch (err) {
    next(err);
  }
};

/**
 * 5) Statistiques par catégorie
 */
const getInvoiceStats = async (req, res) => {
  try {
    // Agrégation MongoDB : total et nombre de factures par Category
    const stats = await Invoice.aggregate([
      {
        $group: {
          _id: '$Category',
          totalMontant: { $sum: '$Montant' },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);
    res.status(200).json(stats);
  } catch (error) {
    console.error('Erreur stats :', error);
    res
      .status(500)
      .json({ message: 'Erreur lors de la récupération des statistiques.' });
  }
};

module.exports = {
  handleInvoiceUpload,
  registerVehicleInvoice,
  getVehicleInvoices,
  getInvoicePdf,
  getInvoiceStats
};
