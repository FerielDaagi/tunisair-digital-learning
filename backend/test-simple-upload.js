const express = require('express');
const multer = require('multer');
const path = require('path');

const app = express();
const PORT = 5003;

// Configuration multer simple
const storage = multer.memoryStorage(); // Utiliser memory storage pour simplifier

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

// Middleware de logging
app.use((req, res, next) => {
  console.log('📥 Requête reçue:', req.method, req.url);
  console.log('📋 Content-Type:', req.headers['content-type']);
  next();
});

// Route de test simple
app.post('/test', upload.single('file'), (req, res) => {
  console.log('📊 req.body:', req.body);
  console.log('📊 req.file:', req.file ? {
    fieldname: req.file.fieldname,
    originalname: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size
  } : 'Aucun fichier');
  
  res.json({
    success: true,
    body: req.body,
    file: req.file ? {
      fieldname: req.file.fieldname,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    } : null
  });
});

app.listen(PORT, () => {
  console.log(`🧪 Serveur de test simple démarré sur le port ${PORT}`);
  console.log(`🔗 Test: POST http://localhost:${PORT}/test`);
});
