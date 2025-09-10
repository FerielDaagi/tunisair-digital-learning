const { spawn } = require('child_process');
const { findAvailablePort, killNodeProcesses } = require('./port-checker');
const path = require('path');

class StableServerManager {
  constructor() {
    this.serverProcess = null;
    this.isShuttingDown = false;
    this.port = null;
  }

  async start() {
    try {
      console.log('🚀 Démarrage stable du serveur E-Learning...');
      
      // Nettoyer les processus Node.js existants
      await killNodeProcesses();
      
      // Attendre un peu pour que les ports se libèrent
      console.log('⏳ Attente de libération des ports...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Trouver un port disponible
      this.port = await findAvailablePort(5000, 10);
      console.log(`✅ Port ${this.port} sélectionné`);
      
      // Démarrer le serveur avec le port trouvé
      await this.spawnServer();
      
      // Configurer les gestionnaires d'événements
      this.setupEventHandlers();
      
    } catch (error) {
      console.error('❌ Erreur lors du démarrage:', error);
      process.exit(1);
    }
  }

  async spawnServer() {
    if (this.isShuttingDown) return;

    console.log(`🔄 Démarrage du serveur sur le port ${this.port}...`);
    
    // Définir le port dans les variables d'environnement
    const env = {
      ...process.env,
      PORT: this.port.toString(),
      NODE_ENV: process.env.NODE_ENV || 'development'
    };
    
    this.serverProcess = spawn('node', ['server.js'], {
      stdio: 'inherit',
      cwd: __dirname,
      env: env
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
    console.error('❌ Erreur du serveur détectée');
    if (!this.isShuttingDown) {
      this.shutdown();
    }
  }

  handleServerExit(code, signal) {
    if (code === 0) {
      console.log('✅ Serveur arrêté proprement');
      process.exit(0);
    } else {
      console.error(`❌ Serveur arrêté avec erreur (code: ${code})`);
      console.error('💡 Vérifiez les logs pour identifier le problème');
      this.shutdown();
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
}

// Démarrage du gestionnaire stable
const manager = new StableServerManager();
manager.start();

// Export pour utilisation externe
module.exports = manager;
