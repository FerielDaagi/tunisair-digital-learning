const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure destination directory exists
function ensureDirectoryExists(directoryPath) {
  try {
    fs.mkdirSync(directoryPath, { recursive: true });
  } catch (error) {
    // Silently ignore if directory already exists or cannot be created
  }
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Decide subfolder based on field name or mimetype
    let subfolder = 'attachments';
    if (file.fieldname === 'videoFile' || (file.mimetype || '').startsWith('video/')) {
      subfolder = 'videos';
    }

    const finalDir = path.join('uploads', 'lessons', subfolder);
    ensureDirectoryExists(finalDir);
    cb(null, finalDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const safeBase = (file.originalname || 'file').replace(/[^a-zA-Z0-9_.-]/g, '_');
    const ext = path.extname(safeBase) || '';
    const base = path.basename(safeBase, ext);
    cb(null, `${base}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 200 * 1024 * 1024, // 200MB per file
    files: 10 // Maximum 10 files
  },
  fileFilter: (req, file, cb) => {
    console.log('🔍 Multer fileFilter called for:', file.fieldname, file.originalname, 'mimetype:', file.mimetype);
    // Accepter tous les fichiers
    cb(null, true);
  }
});

// Middleware de gestion d'erreurs multer
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    console.error('❌ Multer Error:', error);
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'Fichier trop volumineux. Taille maximale: 200MB'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Trop de fichiers. Maximum: 10 fichiers'
      });
    }
    return res.status(400).json({
      success: false,
      message: 'Erreur lors de l\'upload du fichier: ' + error.message
    });
  }
  next(error);
};

module.exports = { upload, handleMulterError };


