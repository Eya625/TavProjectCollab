const fs = require('fs'); // module node file system  lec/ecr de fichiers
const pdfParse = require('pdf-parse'); // bib => conversion pdf to text
const CardModel = require('../models/OlaConsumption');
const defaultApsDetails = require('../data/defaultApsDetails.json'); // données par défaut

const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];

async function extractFromPdf(filePath) {
  const buffer = fs.readFileSync(filePath); // lecture
  const { text } = await pdfParse(buffer);   //conversion

 
  // on récupère la période au format "YYYY-MM"
  const m = text.match(/Période\s*:\s*du\s*\d{2}\/(\d{2})\/(\d{4})/i);
  if (!m) throw new Error('Période non détectée');
  const [, mm, yyyy] = m;
  const period = `${yyyy}-${mm}`;

  // on découpe chaque bloc “card num : …”
  const blocs = text.split(/card num\s*:\s*/i).slice(1);
    // pour chaque bloc on extrait :
    // num carte 
    // nom titulaire
    // total achat du mois
  const tableData = blocs.map((block) => {
    // séparation du bloc en lignes non vides
    const lines = block
      .split(/\r?\n/)
      .map((L) => L.trim())
      .filter(Boolean);

    const cardMatch = block.match(/^(\d{4,})/);
    const cardNumber = cardMatch ? cardMatch[1] : null;

    // nom multi-lignes : on capture tout ce qui suit "Nom sur la carte" même sur plusieurs retours à la ligne
    const nameRegex =
      /Nom sur la carte\s*[:\-]?\s*([A-ZÀ-Ÿ \-]+(?:\r?\n[A-ZÀ-Ÿ \-]+)*)/i;
    const matchName = block.match(nameRegex);
    const rawName = matchName
      ? matchName[1]
          .split(/\r?\n/) // on sépare chaque ligne
          .map((s) => s.trim()) // on enlève les espaces superflus
          .join(' ') // on re-colle en une seule chaîne
      : '';
    // === total de la carte ===
    // on cherche la ligne “Total de la carte…”, puis on regarde la ligne d’après (la ligne en bleu
    // qui contient les 3 valeurs : volume, chargement, achat). On prend la dernière valeur = achat.
    const idx = lines.findIndex((l) => /^Total de la carte/i.test(l));
    let nums = [];
    if (idx >= 0 && lines[idx + 1]) {
      nums = lines[idx + 1].match(/(\d+[.,]\d+)/g) || [];
    }
    const total = nums.length
      ? parseFloat(nums[nums.length - 1].replace(',', '.'))
      : 0;
    // renvoie un objet contenant les 3 champs
    return {
      cardNumber,
      employe: rawName,
      total
    };
  });
  //retourne la période et le tableau de données 
  return { period, tableData };
}


/* ______________________ Traitement + synchronisation en base mongo  _______________________ */
async function handlePdfUpload(filePath) {
  // 1 commencer l'extraction par la période de relevé(mois et année)
  const { period, tableData } = await extractFromPdf(filePath);
  // décomposition de la période afin d'obtenir l'année et le mois en chiffres.
  // puis la conversion de mois se fait : April / May
  const [yearStr, monthStr] = period.split('-');
  const year = parseInt(yearStr, 10);
  const monthIndex = parseInt(monthStr, 10) - 1;
  const monthName = monthNames[monthIndex];
  if (!monthName) throw new Error('Mois invalide extrait');

  // on cherche dans mongo le doc correspond à cette période
  // s'il n'existe pas encore , on crée un nv avec details 
  let doc = await CardModel.findOne({ year });
  if (!doc) {
    doc = new CardModel({ year, details: defaultApsDetails });
  }

  // on prépare un ensemble set pour retenir les numéros de carte
  const seen = new Set();
  //pour chaque ligne extraite du pdf
  for (const { cardNumber, employe, total } of tableData) {
    // on marque la carte comme "vue" dans ce lot
    seen.add(cardNumber);
    // cherche dans details
    const detail = doc.details.find((d) => d.card_number === cardNumber);
    if (detail) {
      // update du mois
      detail.consumptions.set(monthName, total);
      detail.employe = employe; // on peut aussi mettre à jour le nom
    } else {
      // nouveau détail : on prend un modèle par défaut 
      const template =
        defaultApsDetails.find((d) => d.card_number === cardNumber) || {};
      const newDetail = {
        id: template.id || cardNumber,
        employe: employe,
        card_number: cardNumber,
        dep_code: template.dep_code || '',
        location: template.location || '',
        monthly_limit: template.monthly_limit || 0,
        consumptions: new Map(
          Object.entries({
            January: 0,
            February: 0,
            March: 0,
            April: 0,
            May: 0,
            June: 0,
            July: 0,
            August: 0,
            September: 0,
            October: 0,
            November: 0,
            December: 0
          })
        )
      };
      // on fixe la consommation du mois extrait
      newDetail.consumptions.set(monthName, total);
      // on l'ajoute au doc
      doc.details.push(newDetail);
    }
  }

  // Supprimer les numéros qui n’apparaissent plus dans le PDF
  doc.details = doc.details.filter((d) => seen.has(d.card_number));
  // Recalcul du totalConsumption
  doc.totalConsumption = doc.details.reduce((sum, d) => {
    for (const v of d.consumptions.values()) sum += v;
    return sum;
  }, 0);

  // sauvegarde du document mis à jour
  await doc.save();
  return doc;
}

// exportation de deux fonctions 
module.exports = { extractFromPdf, handlePdfUpload };
