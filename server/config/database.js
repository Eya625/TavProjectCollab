// database.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URL; // Récupérer l'URI depuis les variables d'environnement
    if (!uri) {
      throw new Error('MONGO_URL is not defined in .env');
    }

    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('MongoDB connecté avec succès');
  } catch (err) {
    console.error('Erreur de connexion à MongoDB:', err);
    process.exit(1); // Terminer le processus en cas d'erreur de connexion
  }
};

module.exports = connectDB;
