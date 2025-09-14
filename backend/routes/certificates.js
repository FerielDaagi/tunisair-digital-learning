const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  getStudentCertificates,
  downloadCertificate,
  verifyCertificate,
  getCertificate,
  forceCreateCertificate,
  viewCertificateHTML,
  verifyCertificatePublic
} = require('../controllers/certificateController');

// Route publique pour vérifier un certificat (sans authentification)
router.get('/verify/:certificateNumber', verifyCertificate);

// Route publique pour afficher un certificat HTML (sans authentification)
router.get('/public/:certificateNumber', verifyCertificatePublic);

// Routes protégées par authentification
router.use(auth);

// Obtenir tous les certificats de l'étudiant connecté
router.get('/', getStudentCertificates);

// Obtenir un certificat spécifique
router.get('/:certificateId', getCertificate);

// Afficher un certificat HTML (authentifié)
router.get('/:certificateId/html', viewCertificateHTML);

// Télécharger un certificat PDF
router.get('/:certificateId/download', downloadCertificate);

// Forcer la création d'un certificat pour un cours
router.post('/create/:courseId', forceCreateCertificate);

module.exports = router;
