const mongoose = require('mongoose');
const User = require('./models/User');

// Connexion à la base de données
mongoose.connect('mongodb://localhost:27017/e_learning', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ Connecté à MongoDB');
  checkUsers();
})
.catch(err => {
  console.error('❌ Erreur connexion MongoDB:', err);
});

async function checkUsers() {
  try {
    console.log('\n🔍 Vérification des utilisateurs...\n');
    
    const users = await User.find({}).select('name email role createdAt');
    
    if (users.length === 0) {
      console.log('❌ Aucun utilisateur trouvé dans la base de données');
      console.log('💡 Créez d\'abord un utilisateur tuteur via l\'interface frontend');
    } else {
      console.log(`✅ ${users.length} utilisateur(s) trouvé(s):\n`);
      
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name} (${user.email})`);
        console.log(`   Rôle: ${user.role}`);
        console.log(`   Créé le: ${user.createdAt.toLocaleDateString()}`);
        console.log('');
      });
      
      // Vérifier s'il y a des tuteurs
      const tutors = users.filter(u => u.role === 'tuteur');
      if (tutors.length === 0) {
        console.log('⚠️ Aucun tuteur trouvé. Vous devez créer un compte tuteur.');
      } else {
        console.log(`✅ ${tutors.length} tuteur(s) disponible(s)`);
        console.log('💡 Utilisez l\'un de ces comptes pour tester la création de module');
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔌 Connexion MongoDB fermée');
  }
}
