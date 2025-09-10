const mongoose = require('mongoose');

const checkMongoConnection = (req, res, next) => {
  // Vérifier si MongoDB est connecté
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      error: 'Service temporairement indisponible',
      message: 'Connexion à la base de données en cours...',
      retryAfter: 5
    });
  }
  
  next();
};

module.exports = checkMongoConnection;
