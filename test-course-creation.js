const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
let tutorToken = '';

// Configuration axios
axios.defaults.baseURL = BASE_URL;

// Couleurs pour la console
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

const logSuccess = (message) => log(`✅ ${message}`, 'green');
const logError = (message) => log(`❌ ${message}`, 'red');
const logWarning = (message) => log(`⚠️ ${message}`, 'yellow');
const logInfo = (message) => log(`ℹ️ ${message}`, 'blue');

// Test de connexion
async function testConnection() {
  try {
    logInfo('Test de connexion au serveur...');
    const response = await axios.get('/health');
    logSuccess(`Serveur connecté: ${response.data.message}`);
    return true;
  } catch (error) {
    logError(`Erreur de connexion: ${error.message}`);
    return false;
  }
}

// Créer un compte tuteur de test
async function createTutorAccount() {
  try {
    logInfo('Création d\'un compte tuteur de test...');
    
    const tutorData = {
      name: 'Tuteur Test',
      email: 'tuteur@test.com',
      password: 'tuteur123',
      role: 'tuteur',
      profile: {
        bio: 'Tuteur de test pour les cours',
        phone: '1234567890',
        dateOfBirth: '1990-01-01',
        address: {
          street: '123 Test St',
          city: 'Test City',
          country: 'Test Country',
          zipCode: '12345'
        }
      }
    };

    const response = await axios.post('/auth/register', tutorData);
    logSuccess(`Compte tuteur créé: ${response.data.message}`);
    return response.data.token;
  } catch (error) {
    if (error.response?.status === 409) {
      logWarning('Le compte tuteur existe déjà, tentative de connexion...');
      return await loginTutor();
    } else {
      logError(`Erreur création compte tuteur: ${error.response?.data?.message || error.message}`);
      return null;
    }
  }
}

// Connexion tuteur
async function loginTutor() {
  try {
    logInfo('Connexion tuteur...');
    const response = await axios.post('/auth/login', {
      email: 'tuteur@test.com',
      password: 'tuteur123'
    });
    
    tutorToken = response.data.token;
    logSuccess(`Tuteur connecté: ${response.data.user.name}`);
    return response.data.token;
  } catch (error) {
    logError(`Erreur connexion tuteur: ${error.response?.data?.message || error.message}`);
    return null;
  }
}

// Test création de cours
async function testCreateCourse() {
  try {
    logInfo('Test création de cours...');
    
    const courseData = {
      title: 'Cours de Test React',
      description: 'Un cours de test pour React',
      longDescription: 'Description détaillée du cours de test React avec tous les détails nécessaires',
      category: 'frontend',
      level: 'débutant',
      duration: '2 heures 30 minutes',
      requirements: ['Connaissance de base en HTML', 'Connaissance de base en CSS'],
      outcomes: ['Créer des composants React', 'Gérer l\'état des composants'],
      tags: ['React', 'JavaScript', 'Frontend'],
      language: 'français'
    };

    const response = await axios.post('/courses', courseData, {
      headers: { Authorization: `Bearer ${tutorToken}` }
    });

    logSuccess('Cours créé avec succès');
    logInfo(`ID: ${response.data.data._id}`);
    logInfo(`Titre: ${response.data.data.title}`);
    logInfo(`Statut: ${response.data.data.status}`);
    
    return response.data.data._id;
  } catch (error) {
    logError(`Erreur création cours: ${error.response?.data?.message || error.message}`);
    if (error.response?.data?.errors) {
      logError('Erreurs de validation:');
      error.response.data.errors.forEach(err => {
        logError(`  - ${err.path}: ${err.message}`);
      });
    }
    return null;
  }
}

// Test publication de cours
async function testPublishCourse(courseId) {
  try {
    logInfo(`Test publication du cours ${courseId}...`);
    
    const response = await axios.patch(`/courses/${courseId}/publish`, {}, {
      headers: { Authorization: `Bearer ${tutorToken}` }
    });

    logSuccess('Cours publié avec succès');
    logInfo(`Statut: ${response.data.data.status}`);
    logInfo(`Publié le: ${response.data.data.publishedAt}`);
    
    return true;
  } catch (error) {
    logError(`Erreur publication cours: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// Test récupération des cours du tuteur
async function testGetTutorCourses() {
  try {
    logInfo('Test récupération des cours du tuteur...');
    
    const response = await axios.get('/courses/tutor/my-courses', {
      headers: { Authorization: `Bearer ${tutorToken}` }
    });

    logSuccess('Cours du tuteur récupérés avec succès');
    logInfo(`Nombre de cours: ${response.data.data.length}`);
    
    response.data.data.forEach(course => {
      logInfo(`  - ${course.title} (${course.status})`);
    });
    
    return response.data.data;
  } catch (error) {
    logError(`Erreur récupération cours: ${error.response?.data?.message || error.message}`);
    return [];
  }
}

// Test principal
async function runTests() {
  console.log(`${colors.bold}🧪 Test de création et publication de cours${colors.reset}\n`);

  try {
    // Test 1: Connexion
    if (!(await testConnection())) {
      logError('Impossible de se connecter au serveur');
      return;
    }

    // Test 2: Création/connexion tuteur
    tutorToken = await createTutorAccount();
    if (!tutorToken) {
      logError('Impossible d\'obtenir un token tuteur');
      return;
    }

    // Test 3: Création de cours
    const courseId = await testCreateCourse();
    if (!courseId) {
      logError('Impossible de créer un cours');
      return;
    }

    // Test 4: Publication de cours
    const published = await testPublishCourse(courseId);
    if (!published) {
      logError('Impossible de publier le cours');
      return;
    }

    // Test 5: Récupération des cours
    await testGetTutorCourses();

    logSuccess('\n🎉 Tous les tests sont passés avec succès !');
    logInfo('\n📋 Résumé :');
    logInfo('- ✅ Serveur connecté');
    logInfo('- ✅ Compte tuteur créé/connecté');
    logInfo('- ✅ Cours créé avec succès');
    logInfo('- ✅ Cours publié avec succès');
    logInfo('- ✅ Cours récupérés avec succès');

  } catch (error) {
    logError(`❌ Erreur générale: ${error.message}`);
  }
}

// Lancer les tests
runTests();
