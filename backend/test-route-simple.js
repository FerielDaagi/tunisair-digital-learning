const express = require('express');
const cors = require('cors');

// Créer un serveur de test simple
const app = express();
app.use(cors());
app.use(express.json());

// Route de test pour vérifier que le problème vient de l'ordre des routes
app.get('/api/courses/:id/students', (req, res) => {
  console.log('🔍 Route /students appelée avec ID:', req.params.id);
  res.json({
    success: true,
    message: 'Route /students fonctionne',
    courseId: req.params.id,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/courses/:id', (req, res) => {
  console.log('🔍 Route /:id appelée avec ID:', req.params.id);
  res.json({
    success: true,
    message: 'Route /:id fonctionne',
    courseId: req.params.id,
    timestamp: new Date().toISOString()
  });
});

const PORT = 5001; // Port différent pour éviter les conflits

app.listen(PORT, () => {
  console.log(`🧪 Serveur de test démarré sur le port ${PORT}`);
  console.log('🔗 Testez: http://localhost:5001/api/courses/68b9afad4a2b08c19620cc4e/students');
  console.log('🔗 Testez: http://localhost:5001/api/courses/68b9afad4a2b08c19620cc4e');
});
