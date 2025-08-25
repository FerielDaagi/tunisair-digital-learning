const mongoose = require('mongoose');
const Module = require('./models/Module');
const Course = require('./models/Course');
require('dotenv').config();

// Configuration MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/e_learning';

// ID du cours
const COURSE_ID = '68abbe763bbb581ccb822323';

// Modules à ajouter
const modulesToAdd = [
  {
    title: 'Introduction au cours',
    description: 'Bienvenue dans ce cours ! Découvrez les objectifs et la structure du programme.',
    order: 1,
    estimatedDuration: '30 minutes',
    objectives: [
      'Comprendre les objectifs du cours',
      'Découvrir la structure du programme',
      'Se familiariser avec l\'interface'
    ],
    resources: [
      {
        title: 'Guide de démarrage',
        type: 'pdf',
        url: '/resources/guide-demarrage.pdf',
        description: 'Document d\'introduction au cours'
      }
    ]
  },
  {
    title: 'Fondamentaux',
    description: 'Apprenez les concepts de base essentiels pour la suite du cours.',
    order: 2,
    estimatedDuration: '2 heures',
    objectives: [
      'Maîtriser les concepts fondamentaux',
      'Comprendre les principes de base',
      'Acquérir les connaissances essentielles'
    ],
    resources: [
      {
        title: 'Vidéo d\'introduction',
        type: 'video',
        url: 'https://example.com/video-fondamentaux',
        description: 'Vidéo explicative des concepts de base'
      },
      {
        title: 'Exercices pratiques',
        type: 'document',
        url: '/resources/exercices-fondamentaux.pdf',
        description: 'Série d\'exercices pour pratiquer'
      }
    ]
  },
  {
    title: 'Applications pratiques',
    description: 'Mettez en pratique vos connaissances avec des exercices concrets.',
    order: 3,
    estimatedDuration: '3 heures',
    objectives: [
      'Appliquer les concepts appris',
      'Résoudre des problèmes pratiques',
      'Développer des compétences opérationnelles'
    ],
    resources: [
      {
        title: 'Projet pratique',
        type: 'document',
        url: '/resources/projet-pratique.pdf',
        description: 'Instructions pour le projet final'
      },
      {
        title: 'Exemples de solutions',
        type: 'link',
        url: 'https://example.com/solutions',
        description: 'Exemples de solutions commentées'
      }
    ]
  },
  {
    title: 'Évaluation et certification',
    description: 'Testez vos connaissances et obtenez votre certification.',
    order: 4,
    estimatedDuration: '1 heure',
    objectives: [
      'Évaluer vos connaissances',
      'Identifier les points d\'amélioration',
      'Obtenir votre certification'
    ],
    resources: [
      {
        title: 'Quiz d\'évaluation',
        type: 'document',
        url: '/resources/quiz-evaluation.pdf',
        description: 'Questionnaire d\'évaluation finale'
      },
      {
        title: 'Critères de certification',
        type: 'pdf',
        url: '/resources/criteres-certification.pdf',
        description: 'Conditions pour obtenir la certification'
      }
    ]
  }
];

async function addModulesToCourse() {
  try {
    console.log('🔌 Connexion à MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // Vérifier que le cours existe
    console.log(`\n🔍 Vérification du cours ${COURSE_ID}...`);
    const course = await Course.findById(COURSE_ID);
    if (!course) {
      console.log('❌ Cours introuvable');
      return;
    }
    console.log(`✅ Cours trouvé: ${course.title}`);

    // Vérifier les modules existants
    const existingModules = await Module.find({ course: COURSE_ID });
    console.log(`📚 Modules existants: ${existingModules.length}`);

    if (existingModules.length > 0) {
      console.log('⚠️ Le cours a déjà des modules. Voulez-vous continuer ? (y/n)');
      // En production, vous pourriez demander confirmation
    }

    // Ajouter les modules
    console.log('\n🚀 Ajout des modules...');
    const addedModules = [];

    for (const moduleData of modulesToAdd) {
      try {
        const newModule = new Module({
          ...moduleData,
          course: COURSE_ID,
          isPublished: false // Par défaut en brouillon
        });

        await newModule.save();
        addedModules.push(newModule);
        console.log(`✅ Module ajouté: ${moduleData.title}`);
      } catch (error) {
        console.error(`❌ Erreur lors de l'ajout du module "${moduleData.title}":`, error.message);
      }
    }

    // Mettre à jour le cours avec les nouveaux modules
    if (addedModules.length > 0) {
      const moduleIds = addedModules.map(m => m._id);
      await Course.findByIdAndUpdate(COURSE_ID, {
        $push: { modules: { $each: moduleIds } }
      });
      console.log(`\n🎯 Cours mis à jour avec ${addedModules.length} nouveaux modules`);
    }

    // Afficher le résumé
    console.log('\n📊 Résumé:');
    console.log(`- Cours: ${course.title}`);
    console.log(`- Modules ajoutés: ${addedModules.length}`);
    console.log(`- Total modules: ${existingModules.length + addedModules.length}`);

    console.log('\n🎉 Opération terminée avec succès !');

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

// Exécuter le script
addModulesToCourse();

