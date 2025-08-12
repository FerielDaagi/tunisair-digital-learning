const User = require('../models/User'); // Your User model (mongoose schema assumed)

// Get the profile of the logged-in user
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id; // assuming authenticateToken sets req.user
    const user = await User.findById(userId).select('-password'); // exclude password
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Update the profile of the logged-in user
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });

    if (name) user.name = name;
    if (email) user.email = email;

    await user.save();

    res.json({ message: 'Profil mis à jour avec succès', user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Get lesson progress for the user
const getProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select('progress');
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });

    res.json(user.progress || {});
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Update lesson progress for the user
const updateLessonProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { lessonId, completed } = req.body; // example data

    if (!lessonId) return res.status(400).json({ message: 'lessonId est requis' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });

    if (!user.progress) user.progress = {};

    // Example: store completion status for lessons as key-value pairs
    user.progress[lessonId] = completed;

    await user.save();

    res.json({ message: 'Progression mise à jour', progress: user.progress });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getProgress,
  updateLessonProgress,
};
