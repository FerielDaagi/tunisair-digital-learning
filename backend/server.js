const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
// Configuration par défaut si .env n'existe pas
if (fs.existsSync(path.join(__dirname, '.env'))) {
  require('dotenv').config({ path: path.join(__dirname, '.env') });
} else {
  console.log('⚠️ Fichier .env non trouvé, utilisation des valeurs par défaut');
  process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/e_learning';
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'default_jwt_secret_change_in_production';
  process.env.PORT = process.env.PORT || '5000';
  process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
}

// Configuration de test si MongoDB n'est pas disponible
if (process.env.NODE_ENV === 'test' || process.argv.includes('--test')) {
  console.log('🧪 Mode test activé - utilisation de MongoDB en mémoire');
  process.env.MONGODB_URI = 'mongodb://localhost:27017/e_learning_test';
}

console.log('🔍 Debug - MONGODB_URI:', process.env.MONGODB_URI);
console.log('🔍 Debug - JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'NOT SET');
console.log('🔍 Debug - PORT:', process.env.PORT);
console.log('🔍 Debug - FRONTEND_URL:', process.env.FRONTEND_URL);

// 🆕 AJOUTE CETTE LIGNE - Importer la connexion MongoDB
const connectDB = require('./config/database');

// 🆕 NOUVEAU - Charger tous les modèles Mongoose
require('./models/User');
require('./models/Course');
require('./models/Module');
require('./models/Lesson');
require('./models/Category');
require('./models/Notification');
require('./models/Enrollment');
require('./models/Progress');

const authRoutes = require('./routes/auth');
const courseRoutes = require('./routes/courses');
const moduleRoutes = require('./routes/modules');
const lessonRoutes = require('./routes/lessons');
const userRoutes = require('./routes/user');
const dashboardRoutes = require('./routes/dashboard');
const notificationRoutes = require('./routes/notifications');
const adminRoutes = require('./routes/admin');
const categoryRoutes = require('./routes/categories');
const enrollmentRoutes = require('./routes/enrollment');
const progressRoutes = require('./routes/progress');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// 🆕 NOUVEAU - Créer le serveur HTTP AVANT Socket.io
const server = http.createServer(app);

// 🆕 NOUVEAU - Configuration Socket.io AVEC le serveur HTTP
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: 60000, // 1 minute
  pingInterval: 25000, // 25 secondes
  transports: ['websocket', 'polling'],
  allowEIO3: true
});

// Security middleware (allow cross-origin images for uploads)
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginEmbedderPolicy: false,
}));

// 🆕 NOUVEAU - Rate limiting amélioré
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Appliquer le rate limiting aux routes API
app.use('/api/', limiter);

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
  optionsSuccessStatus: 200
}));

// Preflight pour toutes les routes
app.options('*', cors());

// Body parsing middleware - seulement pour les routes qui n'utilisent pas multer
app.use('/api/auth', express.json());
app.use('/api/auth', express.urlencoded({ extended: true }));
app.use('/api/users', express.json());
app.use('/api/users', express.urlencoded({ extended: true }));
app.use('/api/courses', express.json());
app.use('/api/courses', express.urlencoded({ extended: true }));
app.use('/api/modules', express.json());
app.use('/api/modules', express.urlencoded({ extended: true }));
app.use('/api/dashboard', express.json());
app.use('/api/dashboard', express.urlencoded({ extended: true }));
app.use('/api/notifications', express.json());
app.use('/api/notifications', express.urlencoded({ extended: true }));
app.use('/api/admin', express.json());
app.use('/api/admin', express.urlencoded({ extended: true }));
app.use('/api/categories', express.json());
app.use('/api/categories', express.urlencoded({ extended: true }));
app.use('/api/enrollment', express.json());
app.use('/api/enrollment', express.urlencoded({ extended: true }));
app.use('/api/progress', express.json());
app.use('/api/progress', express.urlencoded({ extended: true }));

// Middleware spécifique pour les routes lessons
app.use('/api/lessons', (req, res, next) => {
  console.log('🔍 Lessons middleware - Content-Type:', req.headers['content-type']);
  console.log('🔍 Lessons middleware - Method:', req.method);
  next();
});

// Configuration JSON pour les routes lessons (pour les requêtes non-FormData)
app.use('/api/lessons', express.json({ limit: '10mb' }));

// 🆕 NOUVEAU - Servir les fichiers statiques (avatars uploadés)
app.use('/uploads', (req, res, next) => {
  // Ensure images are loadable from the frontend origin
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'http://localhost:3000');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight requests for images
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
}, express.static(path.join(__dirname, 'uploads')));

// Logging middleware
app.use(morgan('combined'));

// 🆕 CHARGER LES ROUTES IMMÉDIATEMENT (avant MongoDB)
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/enrollment', enrollmentRoutes);
app.use('/api/progress', progressRoutes);

console.log('✅ Routes chargées avec succès !');

// 🆕 NOUVEAU - Configuration avancée du serveur
server.keepAliveTimeout = 300000; // 5 minutes
server.headersTimeout = 305000; // 5 minutes + 5 secondes
server.maxConnections = 200; // Augmenter le nombre max de connexions

// 🆕 NOUVEAU - Gestion améliorée des connexions
let activeConnections = 0;
const maxActiveConnections = 200; // Augmenter significativement la limite

// Gestion unique des connexions HTTP
server.on('connection', (socket) => {
  activeConnections = Math.max(0, activeConnections + 1);

  // Log seulement si beaucoup de connexions
  if (activeConnections > maxActiveConnections * 0.7) {
    console.log(`⚠️ Connexions actives: ${activeConnections}/${maxActiveConnections}`);
  }

  // Gestion des erreurs de socket
  socket.on('error', (error) => {
    activeConnections = Math.max(0, activeConnections - 1);
    // Ignorer les erreurs de déconnexion normale
    if (error.code !== 'ECONNRESET' && error.code !== 'EPIPE' && error.code !== 'ECONNABORTED') {
      console.error(`❌ Erreur socket: ${error.message} (code: ${error.code})`);
    }
  });

  // Gestion de la fermeture
  socket.on('close', () => {
    activeConnections = Math.max(0, activeConnections - 1);
  });

  // Timeout pour les connexions inactives (5 minutes)
  socket.setTimeout(300000, () => {
    console.log('⏰ Timeout connexion inactive, fermeture...');
    socket.destroy();
  });
});

// Limitation plus souple des connexions
server.on('connection', (socket) => {
  if (activeConnections > maxActiveConnections) {
    console.warn(`🚫 Trop de connexions (${activeConnections}/${maxActiveConnections}) - Refus`);
    socket.destroy();
  }
});

// 🆕 NOUVEAU - Monitoring de santé avancé
let healthCheckCount = 0;
let lastHealthCheck = Date.now();

app.get('/api/health', (req, res) => {
  healthCheckCount++;
  lastHealthCheck = Date.now();
  
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    connections: activeConnections,
    maxConnections: maxActiveConnections,
    healthChecks: healthCheckCount,
    lastCheck: new Date(lastHealthCheck).toISOString()
  };
  
  res.json(health);
});

// 🆕 NOUVEAU - Route spécifique pour les images avec CORS
app.get('/uploads/thumbnails/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'uploads', 'thumbnails', filename);
  
  // Set CORS headers for images
  res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'http://localhost:3000');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
  
  // Serve the image file
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error('❌ Erreur envoi image:', err);
      res.status(404).send('Image non trouvée');
    }
  });
});

// 🆕 NOUVEAU - Route de diagnostic
app.get('/api/debug', (req, res) => {
  const debug = {
    nodeVersion: process.version,
    platform: process.platform,
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    uptime: process.uptime(),
    connections: activeConnections,
    maxConnections: maxActiveConnections,
    healthChecks: healthCheckCount,
    lastHealthCheck: new Date(lastHealthCheck).toISOString()
  };
  
  res.json(debug);
});

// 🆕 AJOUTE CETTE LIGNE - Connexion à MongoDB
connectDB().then(() => {
  console.log('✅ MongoDB connecté, initialisation des services...');
  
  // 🆕 NOUVEAU - Service de notifications
  const NotificationService = require('./services/notificationService');
  const notificationService = new NotificationService(io);
  app.set('notificationService', notificationService);
  
  console.log('✅ Services initialisés !');
  
  // 🆕 NOUVEAU - Gestion des connexions WebSocket (après initialisation du service)
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Token d\'authentification requis'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const User = require('./models/User');
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return next(new Error('Utilisateur non trouvé'));
      }

      socket.user = user;
      next();
    } catch (error) {
      console.error('❌ Erreur authentification WebSocket:', error);
      // Ne pas faire échouer la connexion pour les erreurs d'auth
      socket.user = { id: 'anonymous', role: 'user', name: 'Anonymous' };
      next();
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Utilisateur connecté: ${socket.user.name} (${socket.user.role})`);

    // Enregistrer le socket selon le rôle
    console.log(`🔌 Debug: Enregistrement socket pour ${socket.user.id} (${socket.user.role})`);
    if (socket.user.role === 'admin') {
      notificationService.registerAdminSocket(socket.user.id, socket);
    } else {
      notificationService.registerUserSocket(socket.user.id, socket);
    }
    console.log(`🔌 Debug: Socket enregistré. Admins: ${notificationService.adminSockets.size}, Users: ${notificationService.userSockets.size}`);

    // Événements de gestion des notifications
    socket.on('markAsRead', async (data) => {
      try {
        await notificationService.markAsRead(data.notificationId, socket.user.id);
        socket.emit('notificationRead', { notificationId: data.notificationId });
      } catch (error) {
        socket.emit('error', { message: 'Erreur lors du marquage comme lu' });
      }
    });

    socket.on('deleteNotification', async (data) => {
      try {
        await notificationService.deleteNotification(data.notificationId, socket.user.id);
        socket.emit('notificationDeleted', { notificationId: data.notificationId });
      } catch (error) {
        socket.emit('error', { message: 'Erreur lors de la suppression' });
      }
    });

    // Test de notification (pour les admins)
    socket.on('testAdminNotification', async (data) => {
      if (socket.user.role === 'admin') {
        try {
          await notificationService.sendAdminNotification(
            socket.user.id,
            'Test Notification',
            'Ceci est un test de notification admin',
            'info',
            'system'
          );
          socket.emit('testResult', { success: true, message: 'Notification de test envoyée' });
        } catch (error) {
          socket.emit('testResult', { success: false, message: 'Erreur lors du test' });
        }
      }
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Utilisateur déconnecté: ${socket.user.name}`);
      notificationService.removeSocket(socket.user.id, socket.user.role === 'admin');
    });
  });

  // 🆕 NOUVEAU - Importer le nettoyeur de connexions
  const ConnectionCleaner = require('./connection-cleaner');

  // 🆕 NOUVEAU - Démarrer le nettoyeur de connexions
  const connectionCleaner = new ConnectionCleaner(server);
  connectionCleaner.start();

  // 🆕 NOUVEAU - Démarrer le serveur AVEC Socket.io
  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📚 E-Learning API is starting...`);
    console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🔌 WebSocket server is running`);
  });

  // 🆕 NOUVEAU - Gestion des erreurs du serveur
  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`❌ Port ${PORT} is already in use`);
      console.error(`💡 Try killing the process using: taskkill /F /IM node.exe`);
    } else {
      console.error('❌ Server error:', error);
    }
    // Ne pas faire crasher le serveur immédiatement
    console.log('🔄 Tentative de redémarrage du serveur...');
    setTimeout(() => {
      server.close(() => {
        process.exit(1);
      });
    }, 5000);
  });

  // 🆕 NOUVEAU - Gestion des erreurs non capturées
  process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    console.log('🔄 Redémarrage du serveur...');
    // Ne pas faire crasher immédiatement
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    // Ne pas faire crasher le serveur
  });

  // 🆕 NOUVEAU - Nettoyage de mémoire périodique
  setInterval(() => {
    if (global.gc) {
      global.gc();
      console.log('🧹 Nettoyage mémoire effectué');
    }
  }, 300000); // Toutes les 5 minutes

  // 🆕 NOUVEAU - Gestion propre de l'arrêt
  process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received, shutting down gracefully...');
    server.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('🛑 SIGINT received, shutting down gracefully...');
    server.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
    });
  });

  // 404 handler
  app.use('*', (req, res) => {
    res.status(404).json({ 
      error: 'Route not found',
      message: `Cannot ${req.method} ${req.originalUrl}`
    });
  });

  // Error handling middleware
  app.use(errorHandler);
  
  console.log('✅ Configuration terminée, serveur prêt !');
  
}).catch((error) => {
  console.error('❌ Erreur lors de la connexion MongoDB:', error);
  process.exit(1);
});

module.exports = app;