const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

class HealthMonitor {
  constructor(port = 5000) {
    this.port = port;
    this.healthChecks = [];
    this.connectionCount = 0;
    this.errorCount = 0;
    this.startTime = Date.now();
  }

  // Vérifier la santé du serveur
  checkHealth() {
    const options = {
      hostname: 'localhost',
      port: this.port,
      path: '/api/health',
      method: 'GET',
      timeout: 5000
    };

    return new Promise((resolve, reject) => {
      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            resolve({
              status: res.statusCode,
              response: response,
              timestamp: new Date().toISOString()
            });
          } catch (error) {
            resolve({
              status: res.statusCode,
              response: data,
              timestamp: new Date().toISOString()
            });
          }
        });
      });

      req.on('error', (error) => {
        reject({
          error: error.message,
          timestamp: new Date().toISOString()
        });
      });

      req.on('timeout', () => {
        req.destroy();
        reject({
          error: 'Timeout',
          timestamp: new Date().toISOString()
        });
      });

      req.end();
    });
  }

  // Monitorer en continu
  async startMonitoring(interval = 30000) { // 30 secondes
    console.log(`🔍 Démarrage du monitoring de santé sur le port ${this.port}`);
    console.log(`⏰ Intervalle de vérification: ${interval / 1000} secondes`);
    
    const monitor = async () => {
      try {
        const health = await this.checkHealth();
        this.healthChecks.push(health);
        
        const uptime = Date.now() - this.startTime;
        const hours = Math.floor(uptime / 3600000);
        const minutes = Math.floor((uptime % 3600000) / 60000);
        
        console.log(`✅ [${new Date().toLocaleTimeString()}] Serveur en ligne - Uptime: ${hours}h ${minutes}m`);
        
        // Garder seulement les 100 dernières vérifications
        if (this.healthChecks.length > 100) {
          this.healthChecks = this.healthChecks.slice(-100);
        }
        
      } catch (error) {
        this.errorCount++;
        console.error(`❌ [${new Date().toLocaleTimeString()}] Erreur de santé:`, error.error);
        
        // Si trop d'erreurs consécutives, alerter
        if (this.errorCount >= 3) {
          console.error(`🚨 ALERTE: ${this.errorCount} erreurs consécutives détectées!`);
          this.generateReport();
        }
      }
    };

    // Première vérification immédiate
    await monitor();
    
    // Vérifications périodiques
    setInterval(monitor, interval);
  }

  // Générer un rapport de diagnostic
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime,
      totalChecks: this.healthChecks.length,
      errorCount: this.errorCount,
      successRate: ((this.healthChecks.length - this.errorCount) / this.healthChecks.length * 100).toFixed(2),
      lastChecks: this.healthChecks.slice(-10),
      systemInfo: {
        nodeVersion: process.version,
        platform: process.platform,
        memory: process.memoryUsage(),
        cpu: process.cpuUsage()
      }
    };

    const reportPath = path.join(__dirname, 'health-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`📊 Rapport de diagnostic généré: ${reportPath}`);
    console.log(`📈 Taux de succès: ${report.successRate}%`);
    console.log(`💾 Utilisation mémoire: ${Math.round(report.systemInfo.memory.heapUsed / 1024 / 1024)}MB`);
    
    return report;
  }

  // Vérifier les connexions actives
  checkActiveConnections() {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'localhost',
        port: this.port,
        path: '/api/health',
        method: 'GET'
      };

      const req = http.request(options, (res) => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          timestamp: new Date().toISOString()
        });
      });

      req.on('error', reject);
      req.end();
    });
  }

  // Test de charge simple
  async loadTest(requests = 10, concurrency = 5) {
    console.log(`🚀 Test de charge: ${requests} requêtes avec ${concurrency} connexions simultanées`);
    
    const results = [];
    const startTime = Date.now();
    
    for (let i = 0; i < requests; i += concurrency) {
      const batch = [];
      for (let j = 0; j < concurrency && i + j < requests; j++) {
        batch.push(this.checkHealth());
      }
      
      const batchResults = await Promise.allSettled(batch);
      results.push(...batchResults);
      
      // Pause entre les batches
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    console.log(`📊 Résultats du test de charge:`);
    console.log(`   ✅ Succès: ${successful}`);
    console.log(`   ❌ Échecs: ${failed}`);
    console.log(`   ⏱️  Durée: ${duration}ms`);
    console.log(`   📈 RPS: ${(requests / (duration / 1000)).toFixed(2)}`);
    
    return {
      total: requests,
      successful,
      failed,
      duration,
      rps: requests / (duration / 1000)
    };
  }
}

// Utilisation du moniteur
if (require.main === module) {
  const monitor = new HealthMonitor(5000);
  
  // Démarrer le monitoring
  monitor.startMonitoring(30000); // Vérification toutes les 30 secondes
  
  // Test de charge toutes les 5 minutes
  setInterval(() => {
    monitor.loadTest(20, 5);
  }, 5 * 60 * 1000);
  
  // Générer un rapport toutes les 10 minutes
  setInterval(() => {
    monitor.generateReport();
  }, 10 * 60 * 1000);
  
  // Gestion propre de l'arrêt
  process.on('SIGINT', () => {
    console.log('\n🛑 Arrêt du monitoring...');
    monitor.generateReport();
    process.exit(0);
  });
}

module.exports = HealthMonitor;

