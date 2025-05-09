// passwordController.js

const User = require('../models/User');
const transporter = require('../config/nodemailerConfig');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

exports.sendResetPasswordEmail = async (req, res) => {
  console.log('sendResetPasswordEmail fonction appelée');
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "L'email est requis" });
  }

  try {
    const user = await User.findOne({ email });
    //console.log("Utilisateur trouvé :", user);
    if (!user) {
      return res.status(404).json({ error: 'User not found or invalid email' });
    }

    const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' })}`;
    console.log('Reset link généré :', resetLink);

    const mailOptions = {
      from: process.env.EMAIL_FROM, // Utilisation de la variable d'environnement
      to: email,
      subject: 'Réinitialisation de votre mot de passe',
      text: `Cliquez sur ce lien pour réinitialiser votre mot de passe : ${resetLink}`,
      html: `<p>Cliquez sur ce lien pour réinitialiser votre mot de passe : <a href="${resetLink}">${resetLink}</a></p>`
    };

    await transporter.sendMail(mailOptions);
    console.log('Email envoyé avec succès !');
    res.status(200).json({ message: 'Email envoyé avec succès' });
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email :", error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res
      .status(400)
      .json({ error: 'Le token et le nouveau mot de passe sont requis' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }

    // Hachage du nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    // Envoi du mail de confirmation
    const confirmMailOptions = {
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: 'Mot de passe modifié avec succès',
      text: 'Votre mot de passe a été changé avec succès'
    };

    await transporter.sendMail(confirmMailOptions);

    // Envoi de la réponse en cas de succès
    res.status(200).json({ message: 'Mot de passe mis à jour avec succès.' });
  } catch (error) {
    console.error(
      'Erreur lors de la réinitialisation du mot de passe :',
      error
    );
    res.status(400).json({ error: 'Token invalide ou expiré' });
  }
};

// fonction qui valide le token avant d'afficher l'interface
exports.verifyResetToken = async (req, res) => {
  const { token } = req.params;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.status(200).json({ valid: true, userId: decoded.id });
  } catch (error) {
    res.status(400).json({ valid: false, error: 'Token invalide ou expiré' });
  }
};
