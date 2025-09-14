const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Démarrage du serveur E-Learning en mode stable...');

// Configuration
const serverFile = path.join(__dirname, 'server.js');
const maxRestarts = 10;
let restartCount = 0;
let serverProcess = null;

function startServer() {
  console.log(`🔄 Tentative de démarrage ${restartCount + 1}/${maxRestarts}`);
  
  serverProcess = spawn('node', [serverFile], {
    stdio: 'inherit',
    cwd: __dirname
  });

  serverProcess.on('error', (error) => {
    console.error('❌ Erreur lors du démarrage du serveur:', error);
    restartServer();
  });

  serverProcess.on('exit', (code, signal) => {
    console.log(`🛑 Serveur arrêté avec le code ${code} et signal ${signal}`);
    
    if (code !== 0 && restartCount < maxRestarts) {
      console.log('🔄 Redémarrage automatique...');
      setTimeout(() => {
        restartServer();
      }, 2000);
    } else if (restartCount >= maxRestarts) {
      console.error('❌ Nombre maximum de redémarrages atteint');
      process.exit(1);
    }
  });
}

function restartServer() {
  restartCount++;
  if (serverProcess) {
    serverProcess.kill();
  }
  startServer();
}

// Gestion des signaux d'arrêt
process.on('SIGINT', () => {
  console.log('🛑 Arrêt du serveur...');
  if (serverProcess) {
    serverProcess.kill();
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('🛑 Arrêt du serveur...');
  if (serverProcess) {
    serverProcess.kill();
  }
  process.exit(0);
});

// Démarrer le serveur
startServer();
