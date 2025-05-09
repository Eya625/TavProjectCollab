// services/invoiceServices.js
const { spawn } = require('child_process');
const path = require('path');

/**
 * Helper : lance un script Python et renvoie le JSON qu’il écrit sur stdout.
 * Maintenant, on filtre les logs pour ne garder que la dernière ligne JSON.
 * @param {string} scriptRelPath — chemin relatif vers le script Python
 * @param {string} pdfFilePath
 */
function runPythonExtractor(scriptRelPath, pdfFilePath) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.resolve(__dirname, scriptRelPath);
    const pythonProcess = spawn('python', ['-u', scriptPath, pdfFilePath]);

    let stdout = '';
    let stderr = '';

    pythonProcess.stdout.on('data', chunk => {
      stdout += chunk.toString();
    });
    pythonProcess.stderr.on('data', chunk => {
      // on loggue les messages de progression, mais on ne les traite pas comme erreur
      stderr += chunk.toString();
      console.debug(`Python log (${scriptRelPath}):`, chunk.toString().trim());
    });
    pythonProcess.on('close', code => {
      if (code !== 0) {
        return reject(new Error(`Script Python a quitté avec le code ${code}`));
      }
      // On suppose que la dernière ligne de stdout est le JSON
      const lines = stdout.trim().split(/\r?\n/);
      const jsonLine = lines[lines.length - 1];
      try {
        const result = JSON.parse(jsonLine);
        resolve(result);
      } catch (e) {
        reject(new Error(`Impossible de parser le JSON renvoyé par ${scriptRelPath}: ${e.message}`));
      }
    });
  });
}

/**
 * Essaie d'abord l'extractor véhicule, puis l'extractor pneus en fallback.
 */
async function extractInvoiceData(pdfFilePath) {
  let data;
  try {
    data = await runPythonExtractor('../services/extractor/extractor.py', pdfFilePath);
    data.extractor = 'vehicle';
  } catch (err) {
    console.warn('Vehicle extractor a échoué :', err.message);
    data = { Ref: '', Date: '', Montant: '', Category: '', Immatriculation: '', Type: '' };
  }

  const needsFallback = !data.Immatriculation || !data.Type || data.Immatriculation === 'N/A';
  if (needsFallback) {
    try {
      const tyreData = await runPythonExtractor('../services/extractor/extractor2.py', pdfFilePath);
      tyreData.extractor = 'tyre';

      // On fusionne en priorité les champs valides de tyreData
      data = {
        Ref:             data.Ref || tyreData.Ref,
        Date:            data.Date || tyreData.Date,
        Montant:         data.Montant || tyreData.Montant,
        Category:        tyreData.Category || data.Category,
        Immatriculation: tyreData.Immatriculation || data.Immatriculation,
        Type:            tyreData.Type            || data.Type,
        extractor:       tyreData.extractor
      };
    } catch (err) {
      console.warn('Fallback tyre extractor a échoué :', err.message);
    }
  }

  return data;
}

module.exports = { extractInvoiceData };
