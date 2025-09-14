const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

async function createTestTutor() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/e_learning');
    console.log('✅ Connecté à MongoDB');

    // Vérifier si l'utilisateur existe déjà
    let user = await User.findOne({ email: 'tutor@test.com' });
    
    if (user) {
      console.log('✅ Utilisateur tuteur existe déjà:', user.email);
      console.log('ID:', user._id);
      console.log('Rôle:', user.role);
    } else {
      // Créer un nouvel utilisateur tuteur
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      user = new User({
        firstName: 'Test',
        lastName: 'Tutor',
        email: 'tutor@test.com',
        password: hashedPassword,
        role: 'tuteur',
        isActive: true,
        profile: {
          bio: 'Tuteur de test',
          avatar: null
        }
      });
      
      await user.save();
      console.log('✅ Utilisateur tuteur créé:', user.email);
      console.log('ID:', user._id);
    }

    // Créer aussi un utilisateur admin
    let admin = await User.findOne({ email: 'admin@test.com' });
    
    if (admin) {
      console.log('✅ Utilisateur admin existe déjà:', admin.email);
    } else {
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      admin = new User({
        firstName: 'Test',
        lastName: 'Admin',
        email: 'admin@test.com',
        password: hashedPassword,
        role: 'admin',
        isActive: true,
        profile: {
          bio: 'Admin de test',
          avatar: null
        }
      });
      
      await admin.save();
      console.log('✅ Utilisateur admin créé:', admin.email);
    }

    console.log('\n📋 Comptes de test créés:');
    console.log('Tuteur: tutor@test.com / password123');
    console.log('Admin: admin@test.com / password123');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Déconnecté de MongoDB');
  }
}

createTestTutor();
