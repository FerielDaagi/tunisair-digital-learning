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
    // Récupérer le modèle Course
    const Course = require('./models/Course');
    
    // Récupérer tous les cours
    const courses = await Course.find({});
    console.log(`📚 ${courses.length} cours trouvés`);
    
    // Vérifier la structure de chaque cours
    for (const course of courses) {
      const courseObj = course.toObject();
      console.log(`\n🔍 Cours "${courseObj.title}":`);
      console.log('  - ID:', courseObj._id);
      console.log('  - Clés disponibles:', Object.keys(courseObj));
      console.log('  - A le champ modules:', 'modules' in courseObj);
      
      if ('modules' in courseObj) {
        console.log('  - Valeur modules:', courseObj.modules);
        console.log('  - Type modules:', typeof courseObj.modules);
        console.log('  - Est un tableau:', Array.isArray(courseObj.modules));
        if (Array.isArray(courseObj.modules)) {
          console.log('  - Nombre de modules:', courseObj.modules.length);
        }
      } else {
        console.log('  - ❌ Champ modules MANQUANT');
      }
    }
    
    // Ajouter le champ modules s'il manque
    const coursesWithoutModules = await Course.find({ modules: { $exists: false } });
    console.log(`\n⚠️ ${coursesWithoutModules.length} cours sans champ modules`);
    
    if (coursesWithoutModules.length > 0) {
      console.log('\n🔄 Ajout du champ modules aux cours...');
      
      for (const course of coursesWithoutModules) {
        // Initialiser avec un tableau vide
        course.modules = [];
        await course.save();
        console.log(`  ✅ Cours "${course.title}" mis à jour`);
      }
      
      console.log('\n🎉 Migration terminée !');
    } else {
      console.log('\n✅ Tous les cours ont déjà le champ modules');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔌 Connexion MongoDB fermée');
  }
});
