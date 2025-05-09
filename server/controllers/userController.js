// userController.js
const User = require('../models/User');
exports.getUserByEmail = async (req, res) => {
  try {
    const { email } = req.params; // Récupérer l'email depuis les paramètres de l'URL
    const user = await User.findOne({ email }); // Recherche l'utilisateur par email

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({
      fullname: user.fullname,
      dateOfBirth: user.dateOfBirth,
      email: user.email,
      address: user.address,
      profile: user.profile,
      phone: user.phone,
      profileImage: user.profileImage
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateUserByEmail = async (req, res) => {
  try {
    const { email } = req.params; // Récupère l'email depuis les paramètres de l'URL
    const updatedData = { ...req.body }; // Copie les nouvelles données

    // Vérifie si une nouvelle image a été téléchargée
    if (req.file) {
      updatedData.profileImage = `http://localhost:3000/uploads/${req.file.filename}`;
    }

    const updatedUser = await User.findOneAndUpdate(
      { email }, // Trouver l'utilisateur par email
      updatedData,
      { new: true, runValidators: true } // Retourne les nouvelles données après mise à jour + validation
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'utilisateur :", error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};
