const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: path.join(__dirname, '.env') });
console.log('🔍 Debug - MONGODB_URI:', process.env.MONGODB_URI);
console.log('🔍 Debug - JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'NOT SET');
console.log('🔍 Debug - PORT:', process.env.PORT);
console.log('🔍 Debug - FRONTEND_URL:', process.env.FRONTEND_URL);

// 🆕 AJOUTE CETTE LIGNE - Importer la connexion MongoDB
const connectDB = require('./config/database');

const authRoutes = require('./routes/auth');
const courseRoutes = require('./routes/courses');
const moduleRoutes = require('./routes/modules');
const userRoutes = require('./routes/user');
const dashboardRoutes = require('./routes/dashboard');
const notificationRoutes = require('./routes/notifications');
const adminRoutes = require('./routes/admin');
const categoryRoutes = require('./routes/categories');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

const PORT = process.env.PORT || 5000;

// Security middleware (allow cross-origin images for uploads)
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginEmbedderPolicy: false,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

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

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🆕 NOUVEAU - Servir les fichiers statiques (avatars uploadés)
app.use('/uploads', (req, res, next) => {
  // Ensure images are loadable from the frontend origin
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, 'uploads')));

// Logging middleware
app.use(morgan('combined'));

// 🆕 CHARGER LES ROUTES IMMÉDIATEMENT (avant MongoDB)
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/categories', categoryRoutes);

console.log('✅ Routes chargées avec succès !');

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
      next(new Error('Token invalide'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Utilisateur connecté: ${socket.user.name} (${socket.user.role})`);

    // Enregistrer le socket selon le rôle
    if (socket.user.role === 'admin') {
      notificationService.registerAdminSocket(socket.user.id, socket);
    } else {
      notificationService.registerUserSocket(socket.user.id, socket);
    }

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

  // Health check endpoint (après initialisation du service)
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'OK',
      message: 'E-Learning API is running',
      timestamp: new Date().toISOString(),
      websocket: {
        connectedAdmins: notificationService.adminSockets.size,
        connectedUsers: notificationService.userSockets.size
      }
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

// Start server IMMÉDIATEMENT (ne pas attendre MongoDB)
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📚 E-Learning API is starting...`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔌 WebSocket server is running`);
  console.log(`⏳ En attente de la connexion MongoDB...`);
});

module.exports = app;