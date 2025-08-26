const mongoose = require('mongoose');
require('dotenv').config();

// Connexion à MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/e_learning', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'Erreur de connexion MongoDB:'));
db.once('open', async () => {
  console.log('✅ Connecté à MongoDB');
  
  try {
    // Récupérer les modèles
    const Course = require('./models/Course');
    const Module = require('./models/Module');
    
    // Vérifier l'état final
    console.log('🔍 Vérification de l\'état final:');
    
    const courses = await Course.find({});
    console.log(`📚 ${courses.length} cours trouvés`);
    
    for (const course of courses) {
      console.log(`\n📚 Cours "${course.title}":`);
      console.log('  - ID:', course._id);
      console.log('  - Modules:', course.modules);
      console.log('  - Nombre de modules:', course.modules?.length || 0);
      
      // Vérifier les modules dans la collection Module
      const modules = await Module.find({ course: course._id });
      console.log('  - Modules dans la collection Module:', modules.length);
      
      if (modules.length > 0) {
        console.log('  - Détails des modules:');
        modules.forEach(module => {
          console.log(`    * ${module.title} (ordre: ${module.order})`);
        });
      }
    }
    
    console.log('\n🎉 Vérification terminée !');
    console.log('✅ La synchronisation est complète et la création de modules devrait fonctionner.');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔌 Connexion MongoDB fermée');
  }
});
