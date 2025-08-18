const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
let adminToken = '';
let userToken = '';

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
    logInfo(`WebSocket - Admins connectés: ${response.data.websocket?.connectedAdmins || 0}`);
    logInfo(`WebSocket - Utilisateurs connectés: ${response.data.websocket?.connectedUsers || 0}`);
    return true;
  } catch (error) {
    logError(`Erreur de connexion: ${error.message}`);
    return false;
  }
}

// Connexion admin
async function loginAdmin() {
  try {
    logInfo('Connexion admin...');
    const response = await axios.post('/auth/login', {
      email: 'admin@test.com',
      password: 'admin123'
    });
    
    adminToken = response.data.token;
    logSuccess(`Admin connecté: ${response.data.user.name}`);
    return true;
  } catch (error) {
    logError(`Erreur connexion admin: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// Connexion utilisateur
async function loginUser() {
  try {
    logInfo('Connexion utilisateur...');
    const response = await axios.post('/auth/login', {
      email: 'user@test.com',
      password: 'user123'
    });
    
    userToken = response.data.token;
    logSuccess(`Utilisateur connecté: ${response.data.user.name}`);
    return true;
  } catch (error) {
    logError(`Erreur connexion utilisateur: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// Test envoi notification admin
async function testSendAdminNotification() {
  try {
    logInfo('Test envoi notification admin...');
    
    const notification = {
      title: 'Test Notification',
      message: 'Ceci est un test de notification envoyé par un utilisateur',
      type: 'info',
      category: 'system'
    };

    const response = await axios.post('/notifications/admin', notification, {
      headers: { Authorization: `Bearer ${userToken}` }
    });

    logSuccess('Notification admin envoyée avec succès');
    logInfo(`ID: ${response.data.notification._id}`);
    logInfo(`Titre: ${response.data.notification.title}`);
    logInfo(`Message: ${response.data.notification.message}`);
    return response.data.notification;
  } catch (error) {
    logError(`Erreur envoi notification admin: ${error.response?.data?.message || error.message}`);
    return null;
  }
}

// Test récupération notifications admin
async function testGetAdminNotifications() {
  try {
    logInfo('Test récupération notifications admin...');
    
    const response = await axios.get('/notifications/admin', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    logSuccess(`Notifications admin récupérées: ${response.data.notifications.length}`);
    
    response.data.notifications.forEach((notif, index) => {
      logInfo(`Notification ${index + 1}:`);
      logInfo(`  - Titre: ${notif.title}`);
      logInfo(`  - Message: ${notif.message}`);
      logInfo(`  - Type: ${notif.type}`);
      logInfo(`  - De: ${notif.sender?.name}`);
      logInfo(`  - Lu: ${notif.isRead ? 'Oui' : 'Non'}`);
    });

    return response.data.notifications;
  } catch (error) {
    logError(`Erreur récupération notifications admin: ${error.response?.data?.message || error.message}`);
    return [];
  }
}

// Test statistiques
async function testGetStats() {
  try {
    logInfo('Test récupération statistiques...');
    
    const response = await axios.get('/notifications/stats', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    const stats = response.data.stats;
    logSuccess('Statistiques récupérées:');
    logInfo(`  - Total: ${stats.total}`);
    logInfo(`  - Non lues: ${stats.unread}`);
    logInfo(`  - Admin: ${stats.adminNotifications}`);
    logInfo(`  - Utilisateurs: ${stats.userNotifications}`);

    return stats;
  } catch (error) {
    logError(`Erreur récupération stats: ${error.response?.data?.message || error.message}`);
    return null;
  }
}

// Test marquage comme lu
async function testMarkAsRead(notificationId) {
  try {
    logInfo(`Test marquage comme lu pour notification ${notificationId}...`);
    
    const response = await axios.put(`/notifications/${notificationId}/read`, {}, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    logSuccess('Notification marquée comme lue');
    return response.data.notification;
  } catch (error) {
    logError(`Erreur marquage comme lu: ${error.response?.data?.message || error.message}`);
    return null;
  }
}

// Test envoi notification utilisateur
async function testSendUserNotification() {
  try {
    logInfo('Test envoi notification utilisateur...');
    
    // D'abord, récupérer la liste des utilisateurs
    const usersResponse = await axios.get('/user/list', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    const nonAdminUsers = usersResponse.data.users.filter(u => u.role !== 'admin');
    
    if (nonAdminUsers.length === 0) {
      logWarning('Aucun utilisateur non-admin trouvé pour le test');
      return null;
    }

    const targetUser = nonAdminUsers[0];
    logInfo(`Envoi à l'utilisateur: ${targetUser.name} (${targetUser.email})`);

    const notification = {
      title: 'Message de l\'admin',
      message: 'Ceci est un message de test de l\'administrateur',
      type: 'success',
      category: 'system'
    };

    const response = await axios.post(`/notifications/user/${targetUser._id}`, notification, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    logSuccess('Notification utilisateur envoyée avec succès');
    logInfo(`ID: ${response.data.notification._id}`);
    logInfo(`Destinataire: ${targetUser.name}`);
    return response.data.notification;
  } catch (error) {
    logError(`Erreur envoi notification utilisateur: ${error.response?.data?.message || error.message}`);
    return null;
  }
}

// Test principal
async function runTests() {
  log('🚀 Démarrage des tests de notifications', 'bold');
  log('=' * 50);

  // Test 1: Connexion au serveur
  if (!(await testConnection())) {
    logError('Impossible de se connecter au serveur. Arrêt des tests.');
    return;
  }

  // Test 2: Connexion admin
  if (!(await loginAdmin())) {
    logError('Impossible de connecter l\'admin. Arrêt des tests.');
    return;
  }

  // Test 3: Connexion utilisateur
  if (!(await loginUser())) {
    logError('Impossible de connecter l\'utilisateur. Arrêt des tests.');
    return;
  }

  // Test 4: Statistiques initiales
  await testGetStats();

  // Test 5: Envoi notification admin
  const adminNotification = await testSendAdminNotification();
  
  // Test 6: Récupération notifications admin
  const adminNotifications = await testGetAdminNotifications();

  // Test 7: Marquage comme lu
  if (adminNotifications.length > 0) {
    await testMarkAsRead(adminNotifications[0]._id);
  }

  // Test 8: Envoi notification utilisateur
  await testSendUserNotification();

  // Test 9: Statistiques finales
  await testGetStats();

  log('🎉 Tests terminés avec succès!', 'bold');
  log('=' * 50);
  logInfo('Pour tester les WebSockets en temps réel:');
  logInfo('1. Ouvrez l\'application dans un navigateur');
  logInfo('2. Connectez-vous en tant qu\'admin');
  logInfo('3. Allez dans le Centre de Notifications Admin');
  logInfo('4. Dans un autre onglet, connectez-vous en tant qu\'utilisateur');
  logInfo('5. Allez dans la page Test de Notifications');
  logInfo('6. Envoyez des notifications et observez les réceptions en temps réel');
}

// Gestion des erreurs
process.on('unhandledRejection', (error) => {
  logError(`Erreur non gérée: ${error.message}`);
  process.exit(1);
});

// Exécution des tests
if (require.main === module) {
  runTests().catch(error => {
    logError(`Erreur lors des tests: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  testConnection,
  loginAdmin,
  loginUser,
  testSendAdminNotification,
  testGetAdminNotifications,
  testGetStats,
  testMarkAsRead,
  testSendUserNotification
};
