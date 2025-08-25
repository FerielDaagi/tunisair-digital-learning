const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class ServerManager {
  constructor() {
    this.serverProcess = null;
    this.restartCount = 0;
    this.maxRestarts = 5;
    this.restartDelay = 5000; // 5 secondes
    this.isShuttingDown = false;
  }

  start() {
    console.log('🚀 Démarrage du serveur E-Learning...');
    console.log('📁 Répertoire:', process.cwd());
    
    // Vérifier que le fichier server.js existe
    const serverPath = path.join(__dirname, 'server.js');
    if (!fs.existsSync(serverPath)) {
      console.error('❌ Fichier server.js introuvable');
      process.exit(1);
    }

    this.spawnServer();
    this.setupEventHandlers();
  }

  spawnServer() {
    if (this.isShuttingDown) return;

    console.log(`🔄 Démarrage du serveur (tentative ${this.restartCount + 1}/${this.maxRestarts + 1})`);
    
    this.serverProcess = spawn('node', ['server.js'], {
      stdio: 'inherit',
      cwd: __dirname,
      env: {
        ...process.env,
        NODE_ENV: process.env.NODE_ENV || 'development'
      }
    });

    this.serverProcess.on('error', (error) => {
      console.error('❌ Erreur lors du démarrage du serveur:', error.message);
      this.handleServerError();
    });

    this.serverProcess.on('exit', (code, signal) => {
      console.log(`📤 Serveur arrêté avec le code: ${code}, signal: ${signal}`);
      
      if (!this.isShuttingDown) {
        this.handleServerExit(code, signal);
      }
    });
  }

  handleServerError() {
    if (this.restartCount < this.maxRestarts) {
      this.restartCount++;
      console.log(`⏳ Redémarrage dans ${this.restartDelay / 1000} secondes...`);
      setTimeout(() => this.spawnServer(), this.restartDelay);
    } else {
      console.error('❌ Nombre maximum de redémarrages atteint');
      process.exit(1);
    }
  }

  handleServerExit(code, signal) {
    if (code === 0) {
      console.log('✅ Serveur arrêté proprement');
      process.exit(0);
    } else {
      console.error(`❌ Serveur arrêté avec erreur (code: ${code})`);
      this.handleServerError();
    }
  }

  setupEventHandlers() {
    // Gestion des signaux d'arrêt
    process.on('SIGINT', () => {
      console.log('\n🛑 Arrêt demandé (SIGINT)...');
      this.shutdown();
    });

    process.on('SIGTERM', () => {
      console.log('\n🛑 Arrêt demandé (SIGTERM)...');
      this.shutdown();
    });

    // Gestion des erreurs non capturées
    process.on('uncaughtException', (error) => {
      console.error('❌ Erreur non capturée:', error);
      this.shutdown();
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Promesse rejetée non gérée:', reason);
      this.shutdown();
    });
  }

  shutdown() {
    this.isShuttingDown = true;
    console.log('🛑 Arrêt du gestionnaire de serveur...');
    
    if (this.serverProcess) {
      console.log('📤 Envoi du signal d\'arrêt au serveur...');
      this.serverProcess.kill('SIGTERM');
      
      // Attendre 10 secondes maximum avant de forcer l'arrêt
      setTimeout(() => {
        if (this.serverProcess) {
          console.log('⚠️ Arrêt forcé du serveur...');
          this.serverProcess.kill('SIGKILL');
        }
        process.exit(0);
      }, 10000);
    } else {
      process.exit(0);
    }
  }

  // Méthode pour redémarrer manuellement
  restart() {
    console.log('🔄 Redémarrage manuel demandé...');
    if (this.serverProcess) {
      this.serverProcess.kill('SIGTERM');
    }
  }
}

// Démarrage du gestionnaire
const manager = new ServerManager();
manager.start();

// Export pour utilisation externe
module.exports = manager;

