const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

class ServerMonitor {
  constructor() {
    this.serverProcess = null;
    this.restartCount = 0;
    this.maxRestarts = 5; // Réduire drastiquement le nombre de redémarrages
    this.restartDelay = 5000; // 5 secondes
    this.healthCheckInterval = 30000; // 30 secondes
    this.isShuttingDown = false;
    this.lastErrorTime = 0;
    this.consecutiveErrors = 0;
    this.maxConsecutiveErrors = 3;
  }

  start() {
    console.log('🚀 Démarrage du moniteur de serveur...');
    this.startServer();
    this.startHealthCheck();
    this.setupGracefulShutdown();
  }

  startServer() {
    if (this.isShuttingDown) return;

    console.log(`🔄 Démarrage du serveur (tentative ${this.restartCount + 1})...`);
    
    this.serverProcess = spawn('node', ['server.js'], {
      cwd: __dirname,
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'production' }
    });

    this.serverProcess.on('error', (error) => {
      console.error('❌ Erreur lors du démarrage du serveur:', error);
      this.handleServerExit(1);
    });

    this.serverProcess.on('exit', (code, signal) => {
      console.log(`🛑 Serveur arrêté (code: ${code}, signal: ${signal})`);
      this.handleServerExit(code);
    });

    // Rediriger les logs
    this.serverProcess.stdout?.on('data', (data) => {
      console.log(data.toString().trim());
    });

    this.serverProcess.stderr?.on('data', (data) => {
      console.error(data.toString().trim());
    });
  }

  handleServerExit(code) {
    if (this.isShuttingDown) return;

    if (code === 0) {
      console.log('✅ Serveur arrêté proprement');
      this.consecutiveErrors = 0; // Reset des erreurs consécutives
      return;
    }

    const now = Date.now();
    const timeSinceLastError = now - this.lastErrorTime;
    
    // Si c'est une erreur récente (moins de 10 secondes), compter comme erreur consécutive
    if (timeSinceLastError < 10000) {
      this.consecutiveErrors++;
    } else {
      this.consecutiveErrors = 1; // Reset si c'est une nouvelle erreur après un délai
    }
    
    this.lastErrorTime = now;
    this.restartCount++;
    
    // Vérifier les erreurs consécutives
    if (this.consecutiveErrors >= this.maxConsecutiveErrors) {
      console.error(`❌ Trop d'erreurs consécutives (${this.consecutiveErrors}), arrêt du moniteur`);
      console.error('💡 Vérifiez les logs pour identifier le problème');
      process.exit(1);
    }
    
    if (this.restartCount >= this.maxRestarts) {
      console.error(`❌ Nombre maximum de redémarrages atteint (${this.maxRestarts})`);
      console.error('💡 Vérifiez les logs pour identifier le problème');
      process.exit(1);
    }

    // Augmenter le délai progressivement
    const delay = this.restartDelay * Math.pow(1.5, this.restartCount - 1);
    console.log(`🔄 Redémarrage dans ${Math.round(delay / 1000)} secondes... (${this.restartCount}/${this.maxRestarts})`);
    console.log(`⚠️ Erreurs consécutives: ${this.consecutiveErrors}/${this.maxConsecutiveErrors}`);
    
    setTimeout(() => {
      if (!this.isShuttingDown) {
        this.startServer();
      }
    }, delay);
  }

  startHealthCheck() {
    setInterval(() => {
      if (this.isShuttingDown) return;

      this.checkServerHealth()
        .then((isHealthy) => {
          if (!isHealthy && !this.isShuttingDown) {
            // Vérifier plusieurs fois avant de redémarrer
            this.consecutiveHealthFailures = (this.consecutiveHealthFailures || 0) + 1;
            console.warn(`⚠️ Serveur non réactif (tentative ${this.consecutiveHealthFailures}/3)...`);
            
            if (this.consecutiveHealthFailures >= 3) {
              console.warn('⚠️ Serveur non réactif après 3 tentatives, redémarrage...');
              this.consecutiveHealthFailures = 0;
              this.restartServer();
            }
          } else {
            // Reset le compteur si le serveur répond
            this.consecutiveHealthFailures = 0;
          }
        })
        .catch((error) => {
          console.error('❌ Erreur lors de la vérification de santé:', error);
        });
    }, this.healthCheckInterval);
  }

  async checkServerHealth() {
    return new Promise((resolve) => {
      const req = http.request({
        hostname: 'localhost',
        port: process.env.PORT || 5000,
        path: '/api/health',
        method: 'GET',
        timeout: 5000
      }, (res) => {
        resolve(res.statusCode === 200);
      });

      req.on('error', () => {
        resolve(false);
      });

      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });

      req.end();
    });
  }

  restartServer() {
    if (this.serverProcess && !this.serverProcess.killed) {
      console.log('🔄 Redémarrage forcé du serveur...');
      this.serverProcess.kill('SIGTERM');
      
      setTimeout(() => {
        if (this.serverProcess && !this.serverProcess.killed) {
          this.serverProcess.kill('SIGKILL');
        }
        this.startServer();
      }, 2000);
    } else {
      this.startServer();
    }
  }

  setupGracefulShutdown() {
    const shutdown = (signal) => {
      console.log(`\n🛑 ${signal} reçu, arrêt du moniteur...`);
      this.isShuttingDown = true;
      
      if (this.serverProcess && !this.serverProcess.killed) {
        console.log('🔄 Arrêt du serveur...');
        this.serverProcess.kill('SIGTERM');
        
        setTimeout(() => {
          if (this.serverProcess && !this.serverProcess.killed) {
            console.log('🔨 Arrêt forcé du serveur...');
            this.serverProcess.kill('SIGKILL');
          }
          process.exit(0);
        }, 5000);
      } else {
        process.exit(0);
      }
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  }
}

// Démarrer le moniteur si ce fichier est exécuté directement
if (require.main === module) {
  const monitor = new ServerMonitor();
  monitor.start();
}

module.exports = ServerMonitor;
