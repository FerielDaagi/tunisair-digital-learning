const http = require('http');
const fs = require('fs');
const path = require('path');

class ConnectionMonitor {
  constructor(port = 5000) {
    this.port = port;
    this.monitoring = false;
    this.stats = {
      startTime: Date.now(),
      totalRequests: 0,
      activeConnections: 0,
      peakConnections: 0,
      errors: 0,
      timeouts: 0
    };
  }

  start() {
    this.monitoring = true;
    console.log(`🔍 Démarrage du monitoring des connexions sur le port ${this.port}`);
    
    // Vérification toutes les 10 secondes
    this.interval = setInterval(() => {
      this.checkConnections();
    }, 10000);
  }

  stop() {
    this.monitoring = false;
    if (this.interval) {
      clearInterval(this.interval);
    }
    console.log('🛑 Monitoring arrêté');
  }

  async checkConnections() {
    try {
      const health = await this.getHealth();
      const debug = await this.getDebug();
      
      // Corriger les valeurs négatives
      const connections = Math.max(0, health.connections || 0);
      this.stats.activeConnections = connections;
      this.stats.totalRequests++;
      
      if (connections > this.stats.peakConnections) {
        this.stats.peakConnections = connections;
      }
      
      // Afficher les statistiques
      const uptime = Math.floor((Date.now() - this.stats.startTime) / 1000);
      const hours = Math.floor(uptime / 3600);
      const minutes = Math.floor((uptime % 3600) / 60);
      
      console.log(`📊 [${new Date().toLocaleTimeString()}] Connexions: ${connections}/${health.maxConnections} | Mémoire: ${Math.round(debug.memory.heapUsed / 1024 / 1024)}MB | Uptime: ${hours}h${minutes}m`);
      
      // Alerte si trop de connexions
      if (connections > health.maxConnections * 0.8) {
        console.warn(`⚠️ ALERTE: ${connections} connexions actives (${Math.round(connections / health.maxConnections * 100)}%)`);
      }
      
    } catch (error) {
      this.stats.errors++;
      console.error(`❌ Erreur monitoring: ${error.message}`);
    }
  }

  getHealth() {
    return new Promise((resolve, reject) => {
      const req = http.request({
        hostname: 'localhost',
        port: this.port,
        path: '/api/health',
        method: 'GET',
        timeout: 5000
      }, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            resolve(response);
          } catch (error) {
            reject(new Error('Réponse invalide du serveur'));
          }
        });
      });
      
      req.on('error', (error) => {
        this.stats.timeouts++;
        reject(error);
      });
      
      req.on('timeout', () => {
        this.stats.timeouts++;
        req.destroy();
        reject(new Error('Timeout'));
      });
      
      req.end();
    });
  }

  getDebug() {
    return new Promise((resolve, reject) => {
      const req = http.request({
        hostname: 'localhost',
        port: this.port,
        path: '/api/debug',
        method: 'GET',
        timeout: 5000
      }, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            resolve(response);
          } catch (error) {
            reject(new Error('Réponse debug invalide'));
          }
        });
      });
      
      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Timeout debug'));
      });
      req.end();
    });
  }

  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.stats.startTime,
      stats: this.stats,
      summary: {
        averageConnections: this.stats.totalRequests > 0 ? this.stats.peakConnections / this.stats.totalRequests : 0,
        errorRate: this.stats.totalRequests > 0 ? (this.stats.errors / this.stats.totalRequests * 100).toFixed(2) : 0,
        timeoutRate: this.stats.totalRequests > 0 ? (this.stats.timeouts / this.stats.totalRequests * 100).toFixed(2) : 0
      }
    };
    
    const reportPath = path.join(__dirname, 'connection-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`📊 Rapport de connexions généré: ${reportPath}`);
    return report;
  }
}

// Utilisation du moniteur
if (require.main === module) {
  const monitor = new ConnectionMonitor(5000);
  
  monitor.start();
  
  // Générer un rapport toutes les 5 minutes
  setInterval(() => {
    monitor.generateReport();
  }, 5 * 60 * 1000);
  
  // Gestion propre de l'arrêt
  process.on('SIGINT', () => {
    console.log('\n🛑 Arrêt du monitoring...');
    monitor.generateReport();
    monitor.stop();
    process.exit(0);
  });
}

module.exports = ConnectionMonitor;
