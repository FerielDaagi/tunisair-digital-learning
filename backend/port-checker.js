const net = require('net');

/**
 * Vérifie si un port est disponible
 * @param {number} port - Le port à vérifier
 * @returns {Promise<boolean>} - true si le port est disponible, false sinon
 */
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.listen(port, () => {
      server.once('close', () => {
        resolve(true);
      });
      server.close();
    });
    
    server.on('error', () => {
      resolve(false);
    });
  });
}

/**
 * Trouve un port disponible à partir d'un port de base
 * @param {number} basePort - Le port de base à tester
 * @param {number} maxAttempts - Nombre maximum de tentatives
 * @returns {Promise<number>} - Le premier port disponible trouvé
 */
async function findAvailablePort(basePort = 5000, maxAttempts = 10) {
  for (let i = 0; i < maxAttempts; i++) {
    const port = basePort + i;
    const available = await isPortAvailable(port);
    
    if (available) {
      console.log(`✅ Port ${port} disponible`);
      return port;
    } else {
      console.log(`❌ Port ${port} occupé`);
    }
  }
  
  throw new Error(`Aucun port disponible trouvé entre ${basePort} et ${basePort + maxAttempts - 1}`);
}

/**
 * Tue tous les processus Node.js qui pourraient bloquer les ports
 */
function killNodeProcesses() {
  const { exec } = require('child_process');
  
  return new Promise((resolve) => {
    console.log('🧹 Nettoyage des processus Node.js...');
    
    exec('taskkill /F /IM node.exe', (error, stdout, stderr) => {
      if (error) {
        // Ignorer l'erreur "not found" qui est normale quand aucun processus n'existe
        if (!error.message.includes('not found') && !error.message.includes('not running')) {
          console.error('❌ Erreur lors du nettoyage:', error.message);
        } else {
          console.log('✅ Aucun processus Node.js à nettoyer');
        }
      } else {
        console.log('✅ Processus Node.js nettoyés');
      }
      resolve();
    });
  });
}

module.exports = {
  isPortAvailable,
  findAvailablePort,
  killNodeProcesses
};
