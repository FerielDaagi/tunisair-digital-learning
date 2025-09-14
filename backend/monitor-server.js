#!/usr/bin/env node

const http = require('http');
const fs = require('fs');
const path = require('path');

class ServerMonitor {
  constructor(port = 5000) {
    this.port = port;
    this.isMonitoring = false;
    this.stats = {
      startTime: Date.now(),
      totalChecks: 0,
      successfulChecks: 0,
      failedChecks: 0,
      lastError: null,
      averageResponseTime: 0,
      memoryUsage: [],
      connectionCounts: []
    };
  }

  async start() {
    console.log('🔍 Démarrage du monitoring du serveur...');
    this.isMonitoring = true;
    
    // Vérification immédiate
    await this.checkServer();
    
    // Vérifications périodiques toutes les 10 secondes
    this.interval = setInterval(async () => {
      await this.checkServer();
    }, 10000);

    // Rapport toutes les 2 minutes
    this.reportInterval = setInterval(() => {
      this.generateReport();
    }, 120000);

    // Gestion de l'arrêt
    process.on('SIGINT', () => {
      console.log('\n🛑 Arrêt du monitoring...');
      this.stop();
    });
  }

  async checkServer() {
    const startTime = Date.now();
    
    try {
      const health = await this.getHealth();
      const responseTime = Date.now() - startTime;
      
      this.stats.totalChecks++;
      this.stats.successfulChecks++;
      this.stats.averageResponseTime = 
        (this.stats.averageResponseTime * (this.stats.totalChecks - 1) + responseTime) / this.stats.totalChecks;
      
      // Enregistrer les données
      this.stats.memoryUsage.push({
        timestamp: Date.now(),
        heapUsed: health.memory.heapUsed,
        heapTotal: health.memory.heapTotal,
        external: health.memory.external
      });
      
      this.stats.connectionCounts.push({
        timestamp: Date.now(),
        connections: health.connections,
        maxConnections: health.maxConnections
      });
      
      // Garder seulement les 100 dernières entrées
      if (this.stats.memoryUsage.length > 100) {
        this.stats.memoryUsage = this.stats.memoryUsage.slice(-100);
      }
      if (this.stats.connectionCounts.length > 100) {
        this.stats.connectionCounts = this.stats.connectionCounts.slice(-100);
      }
      
      const uptime = Math.floor((Date.now() - this.stats.startTime) / 1000);
      const hours = Math.floor(uptime / 3600);
      const minutes = Math.floor((uptime % 3600) / 60);
      
      console.log(`✅ [${new Date().toLocaleTimeString()}] Serveur OK - Uptime: ${hours}h${minutes}m | Connexions: ${health.connections}/${health.maxConnections} | Mémoire: ${Math.round(health.memory.heapUsed / 1024 / 1024)}MB | Temps: ${responseTime}ms`);
      
      // Alerte si problème
      if (health.connections > health.maxConnections * 0.8) {
        console.warn(`⚠️ ALERTE: Trop de connexions (${health.connections}/${health.maxConnections})`);
      }
      
      if (health.memory.heapUsed > 500 * 1024 * 1024) { // 500MB
        console.warn(`⚠️ ALERTE: Utilisation mémoire élevée (${Math.round(health.memory.heapUsed / 1024 / 1024)}MB)`);
      }
      
    } catch (error) {
      this.stats.totalChecks++;
      this.stats.failedChecks++;
      this.stats.lastError = {
        message: error.message,
        timestamp: Date.now()
      };
      
      console.error(`❌ [${new Date().toLocaleTimeString()}] Erreur serveur: ${error.message}`);
      
      // Si trop d'erreurs consécutives
      if (this.stats.failedChecks >= 3) {
        console.error('🚨 ALERTE: Trop d\'erreurs consécutives!');
        this.generateReport();
      }
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
      
      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Timeout'));
      });
      
      req.end();
    });
  }

  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.stats.startTime,
      stats: {
        ...this.stats,
        successRate: this.stats.totalChecks > 0 ? (this.stats.successfulChecks / this.stats.totalChecks * 100).toFixed(2) : 0,
        averageResponseTime: Math.round(this.stats.averageResponseTime)
      },
      recentMemory: this.stats.memoryUsage.slice(-10),
      recentConnections: this.stats.connectionCounts.slice(-10)
    };
    
    const reportPath = path.join(__dirname, 'monitoring-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`📊 Rapport généré: ${reportPath}`);
    console.log(`📈 Taux de succès: ${report.stats.successRate}%`);
    console.log(`⏱️ Temps de réponse moyen: ${report.stats.averageResponseTime}ms`);
    
    return report;
  }

  stop() {
    this.isMonitoring = false;
    if (this.interval) {
      clearInterval(this.interval);
    }
    if (this.reportInterval) {
      clearInterval(this.reportInterval);
    }
    this.generateReport();
    process.exit(0);
  }
}

// Démarrer le monitoring
if (require.main === module) {
  const monitor = new ServerMonitor(5000);
  monitor.start();
}

module.exports = ServerMonitor;
