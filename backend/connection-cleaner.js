const http = require('http');

class ConnectionCleaner {
  constructor(server) {
    this.server = server;
    this.cleanupInterval = null;
    this.stats = {
      totalConnections: 0,
      activeConnections: 0,
      cleanedConnections: 0,
      lastCleanup: null
    };
  }

  start() {
    console.log('🧹 Démarrage du nettoyeur de connexions...');
    
    // Nettoyage toutes les 30 secondes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 30000);
  }

  stop() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      console.log('🛑 Nettoyeur de connexions arrêté');
    }
  }

  cleanup() {
    try {
      // Forcer la fermeture des connexions inactives
      this.server.getConnections((err, connections) => {
        if (err) {
          console.error('❌ Erreur lors du nettoyage:', err.message);
          return;
        }

        this.stats.activeConnections = connections || 0;
        this.stats.lastCleanup = new Date().toISOString();
        
        // Log seulement si beaucoup de connexions
        if (connections > 15) {
          console.log(`🧹 Nettoyage: ${connections} connexions actives`);
        }
      });
    } catch (error) {
      console.error('❌ Erreur dans le nettoyeur:', error.message);
    }
  }

  getStats() {
    return {
      ...this.stats,
      uptime: process.uptime()
    };
  }
}

module.exports = ConnectionCleaner;
