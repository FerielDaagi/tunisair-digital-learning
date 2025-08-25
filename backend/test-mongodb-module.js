const mongoose = require('mongoose');
const Module = require('./models/Module');
const Course = require('./models/Course');

console.log('🧪 Test de connexion MongoDB et création de module...\n');

// Configuration MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/e_learning';

async function testMongoDBConnection() {
  try {
    console.log('🔍 Tentative de connexion à MongoDB...');
    console.log('   URI:', MONGODB_URI);
    
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ MongoDB connecté avec succès !');
    
    // Test de création de module
    await testModuleCreation();
    
  } catch (error) {
    console.error('❌ Erreur de connexion MongoDB:', error.message);
    
    if (error.name === 'MongoServerSelectionError') {
      console.log('\n💡 Solutions possibles:');
      console.log('1. Vérifiez que MongoDB est démarré');
      console.log('2. Vérifiez que le port 27017 est accessible');
      console.log('3. Vérifiez que la base "e_learning" existe');
    }
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('🔌 Connexion MongoDB fermée');
    }
  }
}

async function testModuleCreation() {
  try {
    console.log('\n📚 Test de création de module...');
    
    // Vérifier qu'il y a des cours
    const courses = await Course.find({}).limit(1);
    if (courses.length === 0) {
      console.log('❌ Aucun cours trouvé dans la base de données');
      console.log('💡 Créez d\'abord un cours via l\'interface frontend');
      return;
    }
    
    const course = courses[0];
    console.log(`✅ Cours trouvé: ${course.title} (ID: ${course._id})`);
    
    // Test de création de module
    const testModule = new Module({
      title: 'Module de test MongoDB',
      description: 'Description de test pour vérifier la connexion',
      order: 1,
      course: course._id,
      isPublished: false
    });
    
    console.log('📝 Tentative de sauvegarde du module...');
    const savedModule = await testModule.save();
    
    console.log('✅ Module créé avec succès !');
    console.log(`   ID: ${savedModule._id}`);
    console.log(`   Titre: ${savedModule.title}`);
    console.log(`   Cours: ${savedModule.course}`);
    
    // Nettoyer le module de test
    await Module.findByIdAndDelete(savedModule._id);
    console.log('🧹 Module de test supprimé');
    
  } catch (error) {
    console.error('❌ Erreur lors de la création du module:', error.message);
    
    if (error.name === 'ValidationError') {
      console.log('💡 Erreur de validation du schéma');
      console.log('   Détails:', error.errors);
    } else if (error.name === 'MongoError') {
      console.log('💡 Erreur MongoDB:', error.code);
    }
  }
}

// Démarrer le test
testMongoDBConnection();
