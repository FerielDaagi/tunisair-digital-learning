const Certificate = require('../models/Certificate');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const User = require('../models/User');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const pdf = require('html-pdf');

// Fonction utilitaire pour formater la durée (utilisée par HTML et PDF)
const formatDuration = (duration) => {
  if (!duration) return 'Non spécifiée';
  
  // Si c'est déjà une chaîne formatée, la retourner telle quelle
  if (typeof duration === 'string') {
    return duration;
  }
  
  // Si c'est un nombre (heures), le formater
  if (typeof duration === 'number') {
    const totalMinutes = Math.round(duration * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    if (h > 0 && m > 0) {
      return `${h}h ${m}min`;
    } else if (h > 0) {
      return `${h}h`;
    } else {
      return `${m}min`;
    }
  }
  
  return 'Non spécifiée';
};

// Générer un certificat HTML
const generateCertificateHTML = async (certificateData) => {
  try {
    console.log('🔄 Génération du certificat HTML...');
    
    // Vérifier que les données nécessaires sont présentes
    if (!certificateData || !certificateData.student || !certificateData.course) {
      throw new Error('Données de certificat incomplètes');
    }

    // Lire le template HTML
    const templatePath = path.join(__dirname, '../templates/certificate.html');
    let htmlTemplate = fs.readFileSync(templatePath, 'utf8');

    // Formater la date
    const formatDate = (date) => {
      return new Date(date).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    // Remplacer les variables dans le template
    const replacements = {
      '{{studentName}}': certificateData.student.name || 'N/A',
      '{{studentEmail}}': certificateData.student.email || 'N/A',
      '{{courseTitle}}': certificateData.course.title || 'N/A',
      '{{courseDuration}}': formatDuration(certificateData.course.duration),
      '{{courseCategory}}': certificateData.course.category || 'N/A',
      '{{completionPercentage}}': certificateData.completion?.percentage || certificateData.completionPercentage || 0,
      '{{grade}}': certificateData.completion?.grade || certificateData.grade || 'N/A',
      '{{completedLessons}}': certificateData.completion?.completedLessons || certificateData.completedLessons || 0,
      '{{totalLessons}}': certificateData.completion?.totalLessons || certificateData.totalLessons || 0,
      '{{certificateNumber}}': certificateData.certificateNumber || 'N/A',
      '{{issueDate}}': formatDate(certificateData.certificate?.issuedAt || certificateData.issuedAt || new Date())
    };

    // Appliquer les remplacements
    Object.keys(replacements).forEach(key => {
      htmlTemplate = htmlTemplate.replace(new RegExp(key, 'g'), replacements[key]);
    });

    console.log('✅ Certificat HTML généré avec succès');
    return htmlTemplate;

  } catch (error) {
    console.error('❌ Erreur lors de la génération HTML:', error);
    throw error;
  }
};

// Générer un certificat PDF en utilisant le template HTML
const generateCertificatePDF = async (certificateData) => {
  try {
    console.log('🔄 Génération du certificat PDF à partir du template HTML...');
    
    // Vérifier que les données nécessaires sont présentes
    if (!certificateData || !certificateData.student || !certificateData.course) {
      throw new Error('Données de certificat incomplètes');
    }

    // Générer le HTML avec les données dynamiques
    const htmlContent = await generateCertificateHTML(certificateData);
    
    // Configuration pour la conversion HTML vers PDF (format portrait)
    const options = {
      format: 'A4',
      orientation: 'portrait',
      border: {
        top: '0.3in',
        right: '0.3in',
        bottom: '0.3in',
        left: '0.3in'
      },
      renderDelay: 1000, // Attendre que le CSS soit chargé
      quality: '75',
      timeout: 30000
    };

    // Convertir HTML en PDF
    return new Promise((resolve, reject) => {
      pdf.create(htmlContent, options).toBuffer((err, buffer) => {
        if (err) {
          console.error('❌ Erreur lors de la conversion HTML vers PDF:', err);
          reject(err);
        } else {
          console.log('✅ PDF généré avec succès à partir du template HTML');
          resolve(buffer);
        }
      });
    });

  } catch (error) {
    console.error('❌ Erreur lors de la génération PDF:', error);
    throw error;
  }
};

// Créer un certificat automatiquement quand un cours est complété
const createCertificateOnCompletion = async (enrollmentId) => {
  try {
    const enrollment = await Enrollment.findById(enrollmentId)
      .populate('student')
      .populate('course');

    if (!enrollment || enrollment.status !== 'completed') {
      throw new Error('Enrollment not found or not completed');
    }

    // Vérifier si un certificat existe déjà
    const existingCertificate = await Certificate.findOne({
      student: enrollment.student._id,
      course: enrollment.course._id
    });

    if (existingCertificate) {
      return existingCertificate;
    }

    // Calculer les statistiques
    const totalLessons = enrollment.completedLessons.length;
    const completedLessons = enrollment.completedLessons.length;
    const completionPercentage = enrollment.progress;

    // Créer le certificat
    const certificate = new Certificate({
      student: enrollment.student._id,
      course: enrollment.course._id,
      enrollment: enrollment._id,
      certificateNumber: Certificate.generateCertificateNumber(),
      completedAt: enrollment.completedAt,
      completionPercentage: completionPercentage,
      totalLessons: totalLessons,
      completedLessons: completedLessons,
      timeSpent: 0 // À calculer si nécessaire
    });

    // Calculer la note
    certificate.grade = certificate.calculateGrade();

    await certificate.save();

    console.log(`✅ Certificat créé pour ${enrollment.student.name} - ${enrollment.course.title}`);
    return certificate;

  } catch (error) {
    console.error('Erreur lors de la création du certificat:', error);
    throw error;
  }
};

// Obtenir les certificats d'un étudiant
const getStudentCertificates = async (req, res) => {
  try {
    const studentId = req.user.id;

    const certificates = await Certificate.find({
      student: studentId,
      isValid: true
    })
    .populate('course', 'title description category level duration instructor')
    .sort({ issuedAt: -1 });

    const certificatesWithDetails = await Promise.all(
      certificates.map(async (cert) => {
        const details = await cert.getFullDetails();
        return details;
      })
    );

    res.json({
      success: true,
      data: {
        certificates: certificatesWithDetails,
        total: certificates.length
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des certificats:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

// Télécharger un certificat PDF
const downloadCertificate = async (req, res) => {
  try {
    const { certificateId } = req.params;
    const studentId = req.user.id;

    console.log('🔍 Tentative de téléchargement du certificat:', certificateId, 'pour l\'utilisateur:', studentId);

    // Vérifier que l'ID est valide
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(certificateId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de certificat invalide'
      });
    }

    const certificate = await Certificate.findOne({
      _id: certificateId,
      student: studentId,
      isValid: true
    });

    if (!certificate) {
      console.log('❌ Certificat non trouvé:', certificateId);
      return res.status(404).json({
        success: false,
        message: 'Certificat non trouvé ou invalide'
      });
    }

    console.log('✅ Certificat trouvé:', certificate.certificateNumber);

    // Obtenir les détails complets
    const certificateData = await certificate.getFullDetails();
    console.log('📄 Données du certificat:', certificateData);

    // Générer le PDF
    console.log('🔄 Génération du PDF...');
    const pdfBuffer = await generateCertificatePDF(certificateData);
    console.log('✅ PDF généré, taille:', pdfBuffer.length);

    // Configurer les headers pour le téléchargement
    const fileName = `Certificat_${certificateData.course.title.replace(/[^a-zA-Z0-9]/g, '_')}_${certificateData.certificateNumber}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.setHeader('Cache-Control', 'no-cache');

    console.log('📤 Envoi du PDF...');
    res.send(pdfBuffer);

  } catch (error) {
    console.error('❌ Erreur lors du téléchargement du certificat:', error);
    console.error('❌ Stack trace:', error.stack);
    
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération du certificat',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erreur interne'
    });
  }
};

// Vérifier un certificat par numéro
const verifyCertificate = async (req, res) => {
  try {
    const { certificateNumber } = req.params;

    const certificate = await Certificate.findOne({
      certificateNumber: certificateNumber,
      isValid: true
    })
    .populate('student', 'name firstName lastName email')
    .populate('course', 'title description instructor category level duration');

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificat non trouvé ou invalide'
      });
    }

    const certificateData = await certificate.getFullDetails();

    res.json({
      success: true,
      data: {
        certificate: certificateData,
        isValid: true
      }
    });

  } catch (error) {
    console.error('Erreur lors de la vérification du certificat:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

// Obtenir un certificat spécifique
const getCertificate = async (req, res) => {
  try {
    const { certificateId } = req.params;
    const studentId = req.user.id;

    const certificate = await Certificate.findOne({
      _id: certificateId,
      student: studentId
    });

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificat non trouvé'
      });
    }

    const certificateData = await certificate.getFullDetails();

    res.json({
      success: true,
      data: {
        certificate: certificateData
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération du certificat:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

// Afficher un certificat HTML
const viewCertificateHTML = async (req, res) => {
  try {
    const { certificateId } = req.params;
    const studentId = req.user.id;

    console.log('🔍 Affichage du certificat HTML:', certificateId, 'pour l\'utilisateur:', studentId);

    // Vérifier que l'ID est valide
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(certificateId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de certificat invalide'
      });
    }

    const certificate = await Certificate.findOne({
      _id: certificateId,
      student: studentId,
      isValid: true
    });

    if (!certificate) {
      console.log('❌ Certificat non trouvé:', certificateId);
      return res.status(404).json({
        success: false,
        message: 'Certificat non trouvé ou invalide'
      });
    }

    console.log('✅ Certificat trouvé:', certificate.certificateNumber);

    // Obtenir les détails complets
    const certificateData = await certificate.getFullDetails();
    console.log('📄 Données du certificat:', certificateData);

    // Générer le HTML
    console.log('🔄 Génération du HTML...');
    const htmlContent = await generateCertificateHTML(certificateData);
    console.log('✅ HTML généré');

    // Envoyer le HTML
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(htmlContent);

  } catch (error) {
    console.error('❌ Erreur lors de l\'affichage du certificat HTML:', error);
    console.error('❌ Stack trace:', error.stack);
    
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération du certificat HTML',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erreur interne'
    });
  }
};

// Vérifier un certificat par numéro (version publique)
const verifyCertificatePublic = async (req, res) => {
  try {
    const { certificateNumber } = req.params;

    const certificate = await Certificate.findOne({
      certificateNumber: certificateNumber,
      isValid: true
    })
    .populate('student', 'name firstName lastName email')
    .populate('course', 'title description instructor category level duration');

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificat non trouvé ou invalide'
      });
    }

    const certificateData = await certificate.getFullDetails();

    // Générer le HTML pour l'affichage public
    const htmlContent = await generateCertificateHTML(certificateData);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(htmlContent);

  } catch (error) {
    console.error('Erreur lors de la vérification publique du certificat:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

// Forcer la création d'un certificat pour un cours complété
const forceCreateCertificate = async (req, res) => {
  try {
    const { courseId } = req.params;
    const studentId = req.user.id;

    console.log('🔍 Tentative de création forcée de certificat pour le cours:', courseId);

    // Vérifier que l'étudiant est inscrit au cours
    const enrollment = await Enrollment.findOne({
      student: studentId,
      course: courseId
    }).populate('student').populate('course');

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Vous n\'êtes pas inscrit à ce cours'
      });
    }

    // Vérifier si un certificat existe déjà
    const existingCertificate = await Certificate.findOne({
      student: studentId,
      course: courseId
    });

    if (existingCertificate) {
      return res.json({
        success: true,
        message: 'Certificat déjà existant',
        data: {
          certificate: existingCertificate
        }
      });
    }

    // Calculer la progression réelle
    const Progress = require('../models/Progress');
    const progressRecords = await Progress.find({
      student: studentId,
      course: courseId
    });

    const totalLessons = progressRecords.length;
    const completedLessons = progressRecords.filter(p => p.status === 'completed').length;
    const completionPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    console.log(`📊 Progression calculée: ${completedLessons}/${totalLessons} (${completionPercentage}%)`);

    // Vérifier si le cours est suffisamment complété (au moins 80%)
    if (completionPercentage < 80) {
      return res.status(400).json({
        success: false,
        message: `Le cours doit être complété à au moins 80% pour obtenir un certificat. Progression actuelle: ${completionPercentage}%`
      });
    }

    // Mettre à jour l'enrollment si nécessaire
    if (enrollment.progress !== completionPercentage) {
      enrollment.progress = completionPercentage;
      if (completionPercentage >= 100) {
        enrollment.status = 'completed';
        enrollment.completedAt = new Date();
      }
      await enrollment.save();
    }

    // Créer le certificat
    const certificate = new Certificate({
      student: studentId,
      course: courseId,
      enrollment: enrollment._id,
      certificateNumber: Certificate.generateCertificateNumber(),
      completedAt: enrollment.completedAt || new Date(),
      completionPercentage: completionPercentage,
      totalLessons: totalLessons,
      completedLessons: completedLessons,
      timeSpent: 0
    });

    // Calculer la note
    certificate.grade = certificate.calculateGrade();

    await certificate.save();

    console.log(`✅ Certificat créé avec succès: ${certificate.certificateNumber}`);

    // Obtenir les détails complets du certificat créé
    const certificateDetails = await certificate.getFullDetails();

    res.json({
      success: true,
      message: 'Certificat créé avec succès',
      data: {
        certificate: certificateDetails
      }
    });

  } catch (error) {
    console.error('❌ Erreur lors de la création forcée du certificat:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du certificat',
      error: error.message
    });
  }
};

module.exports = {
  createCertificateOnCompletion,
  getStudentCertificates,
  downloadCertificate,
  verifyCertificate,
  getCertificate,
  generateCertificatePDF,
  generateCertificateHTML,
  viewCertificateHTML,
  verifyCertificatePublic,
  forceCreateCertificate
};
