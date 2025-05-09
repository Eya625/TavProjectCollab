const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST, // "sandbox.smtp.mailtrap.io"
  port: process.env.SMTP_PORT, // 2525
  auth: {
    user: process.env.EMAIL_USER, // "f727651200fbc9"
    pass: process.env.EMAIL_PASS // "fb4017ab328c59"
  },
  secure: false
});

transporter.verify((error, success) => {
  if (error) {
    console.error('Erreur de connexion à Mailtrap:', error);
  } else {
    console.log('Connexion à Mailtrap réussie.');
  }
});

module.exports = transporter;
