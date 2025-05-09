// UserRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const passwordController = require('../controllers/passwordController'); 
const multer = require('multer');
router.get('/profile/:email', userController.getUserByEmail);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Dossier où stocker les images
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname); // Nom unique pour chaque fichier
  }
});
const upload = multer({ storage });

/*                     Partie gestion des utilisateurs  */
// Mettre à jour les informations de l'utilisateur par email (y compris l'image de profil)
router.put(
  '/profile/:email',
  upload.single('profileImage'),
  userController.updateUserByEmail
);

// routes pour la réinitialisation de psw
router.post('/forgot-password', passwordController.sendResetPasswordEmail);

// route qui vérifie et valider le token avant de charger CreatePass.vue
router.get('/reset-password/:token', passwordController.verifyResetToken);
router.post('/reset-password', passwordController.resetPassword);

/*                     Partie gestion des véhicules      */

module.exports = router;
