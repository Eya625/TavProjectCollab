const { spawn } = require('child_process');
const path = require('path');

function runPython(scriptRelPath, pdfFilePath) {
  return new Promise((resolve, reject) => {
    const script = path.resolve(__dirname, scriptRelPath);
    const py = spawn('python', ['-u', script, pdfFilePath]);

    let out = '', err = '';
    py.stdout.on('data', data => { out += data.toString(); });
    py.stderr.on('data', data => { err += data.toString(); });

    py.on('close', code => {
      if (code !== 0) {
        return reject(new Error(`Python exited ${code}\n${err}`));
      }
      try {
        const parsed = JSON.parse(out.trim());
        resolve(parsed);
      } catch (e) {
        reject(new Error(`Invalid JSON from Python: ${e.message}\n${out}`));
      }
    });
  });
}

async function extractInvoiceData(pdfPath) {
  // On pointe uniquement vers extractor_master.py
  const scriptPath = '../services/extractor/extractor_master.py';
  return await runPython(scriptPath, pdfPath);
}

module.exports = { extractInvoiceData };
