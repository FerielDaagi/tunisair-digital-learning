#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class RobustServer {
  constructor() {
    this.serverProcess = null;
    this.restartCount = 0;
    this.maxRestarts = 10;
    this.restartDelay = 5000; // 5 secondes
    this.isShuttingDown = false;
  }

  start() {
    console.log('🚀 Démarrage du serveur robuste...');
    this.startServer();
  }

  startServer() {
    if (this.isShuttingDown) return;

    console.log(`🔄 Tentative de démarrage #${this.restartCount + 1}`);
    
    // Options pour Node.js avec gestion mémoire
    const nodeOptions = [
      '--max-old-space-size=1024', // Limite mémoire à 1GB
      '--expose-gc', // Exposer le garbage collector
      '--optimize-for-size', // Optimiser pour la taille
      'server.js'
    ];

    this.serverProcess = spawn('node', nodeOptions, {
      cwd: __dirname,
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_ENV: 'production'
      }
    });

    this.serverProcess.on('error', (error) => {
      console.error('❌ Erreur processus serveur:', error);
      this.handleServerExit(1);
    });

    this.serverProcess.on('exit', (code, signal) => {
      console.log(`📊 Serveur arrêté - Code: ${code}, Signal: ${signal}`);
      this.handleServerExit(code);
    });

    // Gestion des signaux système
    process.on('SIGINT', () => {
      console.log('\n🛑 Arrêt demandé...');
      this.shutdown();
    });

    process.on('SIGTERM', () => {
      console.log('\n🛑 Arrêt demandé...');
      this.shutdown();
    });
  }

  handleServerExit(code) {
    if (this.isShuttingDown) return;

    if (code === 0) {
      console.log('✅ Serveur arrêté normalement');
      return;
    }

    this.restartCount++;
    console.log(`⚠️ Serveur arrêté inattenduement (${this.restartCount}/${this.maxRestarts})`);

    if (this.restartCount >= this.maxRestarts) {
      console.error('❌ Nombre maximum de redémarrages atteint');
      process.exit(1);
    }

    console.log(`⏰ Redémarrage dans ${this.restartDelay / 1000} secondes...`);
    setTimeout(() => {
      this.startServer();
    }, this.restartDelay);

    // Augmenter le délai progressivement
    this.restartDelay = Math.min(this.restartDelay * 1.5, 60000); // Max 1 minute
  }

  shutdown() {
    this.isShuttingDown = true;
    console.log('🛑 Arrêt du serveur...');
    
    if (this.serverProcess) {
      this.serverProcess.kill('SIGTERM');
      
      // Force kill après 10 secondes
      setTimeout(() => {
        if (this.serverProcess && !this.serverProcess.killed) {
          console.log('🔨 Arrêt forcé du serveur');
          this.serverProcess.kill('SIGKILL');
        }
        process.exit(0);
      }, 10000);
    } else {
      process.exit(0);
    }
  }
}

// Démarrer le serveur robuste
const robustServer = new RobustServer();
robustServer.start();
