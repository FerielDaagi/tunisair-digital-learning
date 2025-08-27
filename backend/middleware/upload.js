const multer = require('multer');
const path = require('path');

// Configuration du stockage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log('🔍 Multer - Destination:', 'uploads/thumbnails/');
    cb(null, 'uploads/thumbnails/');
  },
  filename: (req, file, cb) => {
    // Générer un nom unique pour le fichier
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = 'thumbnail-' + uniqueSuffix + path.extname(file.originalname);
    console.log('🔍 Multer - Nom de fichier généré:', filename);
    cb(null, filename);
  }
});

// Filtre pour les types de fichiers
const fileFilter = (req, file, cb) => {
  console.log('🔍 Multer - Fichier reçu:', file.originalname, 'Type:', file.mimetype);
  
  // Vérifier le type MIME
  if (file.mimetype.startsWith('image/')) {
    console.log('✅ Multer - Fichier accepté');
    cb(null, true);
  } else {
    console.log('❌ Multer - Fichier rejeté (pas une image)');
    cb(new Error('Seuls les fichiers image sont autorisés'), false);
  }
};

// Configuration de multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  }
});

module.exports = upload;
