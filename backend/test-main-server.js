const express = require('express');
const multer = require('multer');
const path = require('path');

const app = express();
const PORT = 5004;

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  next();
});

// Configuration multer identique au serveur principal
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, 'test-uploads');
    require('fs').mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 200 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    console.log('🔍 Multer - File received:', {
      fieldname: file.fieldname,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    });
    cb(null, true);
  }
});

// Middleware urlencoded comme dans le serveur principal
app.use(express.urlencoded({ extended: true, limit: '200mb' }));

// Route de test identique au serveur principal
app.post('/test-lessons', upload.fields([
  { name: 'attachments', maxCount: 10 },
  { name: 'videoFile', maxCount: 1 }
]), (req, res) => {
  console.log('🔍 Test - req.body:', req.body);
  console.log('🔍 Test - req.files:', req.files);
  
  res.json({
    success: true,
    message: 'Test réussi',
    body: req.body,
    files: req.files
  });
});

app.listen(PORT, () => {
  console.log(`🧪 Serveur de test principal démarré sur le port ${PORT}`);
  console.log(`🔗 Test: POST http://localhost:${PORT}/test-lessons`);
});
