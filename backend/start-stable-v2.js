const { spawn } = require('child_process');
const { findAvailablePort, killNodeProcesses } = require('./port-checker');
const path = require('path');
const fs = require('fs');

class UltraStableServerManager {
  constructor() {
    this.serverProcess = null;
    this.isShuttingDown = false;
    this.port = null;
    this.restartCount = 0;
    this.maxRestarts = 3; // Limiter les redémarrages
    this.lastRestartTime = 0;
    this.minRestartInterval = 30000; // 30 secondes minimum entre redémarrages
  }

  async start() {
    try {
      console.log('🚀 Démarrage ultra-stable du serveur E-Learning...');
      
      // Nettoyer les processus Node.js existants
      await this.cleanupProcesses();
      
      // Attendre un peu pour que les ports se libèrent
      console.log('⏳ Attente de libération des ports...');
      await this.sleep(5000);
      
      // Trouver un port disponible
      this.port = await findAvailablePort(5000, 5);
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

  async cleanupProcesses() {
    console.log('🧹 Nettoyage des processus existants...');
    try {
      await killNodeProcesses();
      console.log('✅ Nettoyage terminé');
    } catch (error) {
      console.error('❌ Erreur lors du nettoyage:', error);
    }
    await this.sleep(2000);
  }

  async spawnServer() {
    if (this.isShuttingDown) return;

    const now = Date.now();
    if (now - this.lastRestartTime < this.minRestartInterval) {
      console.log('⏳ Attente avant redémarrage...');
      await this.sleep(this.minRestartInterval - (now - this.lastRestartTime));
    }

    console.log(`🔄 Démarrage du serveur sur le port ${this.port}...`);
    
    // Définir le port dans les variables d'environnement
    const env = {
      ...process.env,
      PORT: this.port.toString(),
      NODE_ENV: process.env.NODE_ENV || 'development',
      // Activer le garbage collection manuel
      NODE_OPTIONS: '--expose-gc --max-old-space-size=512'
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

    // Attendre que le serveur démarre
    await this.waitForServerStart();
  }

  async waitForServerStart() {
    const maxWaitTime = 30000; // 30 secondes max
    const checkInterval = 1000; // Vérifier toutes les secondes
    let waited = 0;

    while (waited < maxWaitTime && !this.isShuttingDown) {
      try {
        const response = await this.checkServerHealth();
        if (response) {
          console.log('✅ Serveur démarré avec succès');
          return;
        }
      } catch (error) {
        // Serveur pas encore prêt
      }
      
      await this.sleep(checkInterval);
      waited += checkInterval;
    }

    if (waited >= maxWaitTime) {
      throw new Error('Timeout: Le serveur n\'a pas démarré dans les temps');
    }
  }

  async checkServerHealth() {
    const http = require('http');
    
    return new Promise((resolve) => {
      const req = http.request({
        hostname: 'localhost',
        port: this.port,
        path: '/api/health',
        method: 'GET',
        timeout: 5000
      }, (res) => {
        resolve(res.statusCode === 200);
      });

      req.on('error', () => resolve(false));
      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });

      req.end();
    });
  }

  handleServerError() {
    console.error('❌ Erreur du serveur détectée');
    if (!this.isShuttingDown) {
      this.restartServer();
    }
  }

  handleServerExit(code, signal) {
    if (code === 0) {
      console.log('✅ Serveur arrêté proprement');
      process.exit(0);
    } else {
      console.error(`❌ Serveur arrêté avec erreur (code: ${code})`);
      this.restartServer();
    }
  }

  async restartServer() {
    if (this.isShuttingDown) return;

    this.restartCount++;
    this.lastRestartTime = Date.now();

    if (this.restartCount > this.maxRestarts) {
      console.error(`❌ Nombre maximum de redémarrages atteint (${this.maxRestarts})`);
      console.error('💡 Vérifiez les logs pour identifier le problème');
      process.exit(1);
    }

    console.log(`🔄 Redémarrage du serveur (${this.restartCount}/${this.maxRestarts})...`);
    
    // Arrêter le serveur actuel
    if (this.serverProcess) {
      this.serverProcess.kill('SIGTERM');
      await this.sleep(2000);
    }

    // Nettoyer et redémarrer
    await this.cleanupProcesses();
    await this.spawnServer();
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
      // Ne pas faire planter le gestionnaire
      console.log('🔄 Le gestionnaire continue de fonctionner...');
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Promesse rejetée non gérée:', reason);
      // Ne pas faire planter le gestionnaire
      console.log('🔄 Le gestionnaire continue de fonctionner...');
    });
  }

  async shutdown() {
    this.isShuttingDown = true;
    console.log('🛑 Arrêt du gestionnaire de serveur...');
    
    if (this.serverProcess) {
      console.log('📤 Envoi du signal d\'arrêt au serveur...');
      this.serverProcess.kill('SIGTERM');
      
      // Attendre 15 secondes maximum avant de forcer l'arrêt
      setTimeout(() => {
        if (this.serverProcess) {
          console.log('⚠️ Arrêt forcé du serveur...');
          this.serverProcess.kill('SIGKILL');
        }
        process.exit(0);
      }, 15000);
    } else {
      process.exit(0);
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Démarrage du gestionnaire ultra-stable
const manager = new UltraStableServerManager();
manager.start();

// Export pour utilisation externe
module.exports = manager;
