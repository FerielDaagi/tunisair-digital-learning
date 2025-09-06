const fs = require('fs');
const path = require('path');

console.log('🔧 CORRECTION - Configuration Upload');
console.log('====================================');

// Lire le fichier server.js
const serverPath = path.join(__dirname, 'server.js');
let serverContent = fs.readFileSync(serverPath, 'utf8');

console.log('📖 Fichier server.js lu');

// Vérifier la configuration actuelle
if (serverContent.includes("app.use('/api/lessons', express.urlencoded({ extended: true }));")) {
  console.log('✅ Middleware urlencoded déjà présent pour /api/lessons');
} else {
  console.log('❌ Middleware urlencoded manquant pour /api/lessons');
}

// Vérifier si express.json() interfère
if (serverContent.includes("app.use(express.json());")) {
  console.log('⚠️  express.json() global détecté - peut interférer avec multer');
} else {
  console.log('✅ Pas de express.json() global');
}

// Créer une configuration optimale
const optimalConfig = `
// Configuration optimale pour l'upload de fichiers
app.use('/api/lessons', (req, res, next) => {
  console.log('🔍 Lessons middleware - Content-Type:', req.headers['content-type']);
  console.log('🔍 Lessons middleware - Method:', req.method);
  next();
});

// Middleware spécifique pour les routes lessons (FormData)
app.use('/api/lessons', express.urlencoded({ extended: true, limit: '200mb' }));
`;

console.log('\n📋 Configuration recommandée:');
console.log(optimalConfig);

// Vérifier le middleware multer dans les routes
const routesPath = path.join(__dirname, 'routes', 'lessons.js');
let routesContent = fs.readFileSync(routesPath, 'utf8');

if (routesContent.includes('lessonUpload.fields')) {
  console.log('✅ Middleware multer configuré dans les routes');
} else {
  console.log('❌ Middleware multer manquant dans les routes');
}

console.log('\n🔧 Actions recommandées:');
console.log('1. Vérifier que le middleware multer est bien appliqué');
console.log('2. S\'assurer que express.urlencoded est appliqué AVANT multer');
console.log('3. Tester avec le serveur de diagnostic');
console.log('4. Vérifier les logs du serveur lors de l\'upload');

console.log('\n🚀 Pour tester:');
console.log('1. node diagnose-upload.js (port 5002)');
console.log('2. Ouvrir test-upload.html dans le navigateur');
console.log('3. Exécuter test-curl.bat');
