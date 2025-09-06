const express = require('express');
const multer = require('multer');
const path = require('path');

console.log('🔍 DIAGNOSTIC - Configuration Multer');
console.log('=====================================');

// Test 1: Vérifier la configuration multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log('📁 Destination appelée pour:', file.fieldname, file.originalname);
    cb(null, 'test-uploads');
  },
  filename: (req, file, cb) => {
    console.log('📝 Filename appelé pour:', file.fieldname, file.originalname);
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 200 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    console.log('🔍 FileFilter appelé pour:', {
      fieldname: file.fieldname,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    });
    cb(null, true);
  }
});

console.log('✅ Configuration multer créée');

// Test 2: Vérifier les middlewares
const app = express();

// Middleware de logging
app.use((req, res, next) => {
  console.log('📥 Requête reçue:', req.method, req.url);
  console.log('📋 Headers:', req.headers['content-type']);
  next();
});

// Test avec différents middlewares
console.log('\n🧪 TEST 1: Sans middleware de parsing');
app.post('/test1', upload.fields([{ name: 'attachments', maxCount: 10 }]), (req, res) => {
  console.log('📊 Test 1 - req.body:', req.body);
  console.log('📊 Test 1 - req.files:', req.files);
  res.json({ test: 1, body: req.body, files: req.files });
});

console.log('🧪 TEST 2: Avec express.urlencoded');
app.use('/test2', express.urlencoded({ extended: true }));
app.post('/test2', upload.fields([{ name: 'attachments', maxCount: 10 }]), (req, res) => {
  console.log('📊 Test 2 - req.body:', req.body);
  console.log('📊 Test 2 - req.files:', req.files);
  res.json({ test: 2, body: req.body, files: req.files });
});

console.log('🧪 TEST 3: Avec express.json ET urlencoded');
app.use('/test3', express.json());
app.use('/test3', express.urlencoded({ extended: true }));
app.post('/test3', upload.fields([{ name: 'attachments', maxCount: 10 }]), (req, res) => {
  console.log('📊 Test 3 - req.body:', req.body);
  console.log('📊 Test 3 - req.files:', req.files);
  res.json({ test: 3, body: req.body, files: req.files });
});

// Route de diagnostic
app.get('/diagnose', (req, res) => {
  res.json({
    message: 'Serveur de diagnostic actif',
    tests: [
      'POST /test1 - Sans middleware de parsing',
      'POST /test2 - Avec express.urlencoded',
      'POST /test3 - Avec express.json + urlencoded'
    ]
  });
});

const PORT = 5002;
app.listen(PORT, () => {
  console.log(`\n🚀 Serveur de diagnostic démarré sur le port ${PORT}`);
  console.log(`🔗 Diagnostic: http://localhost:${PORT}/diagnose`);
  console.log(`\n📋 Tests disponibles:`);
  console.log(`   POST http://localhost:${PORT}/test1`);
  console.log(`   POST http://localhost:${PORT}/test2`);
  console.log(`   POST http://localhost:${PORT}/test3`);
  console.log(`\n💡 Utilisez Postman ou curl pour tester ces endpoints`);
});
