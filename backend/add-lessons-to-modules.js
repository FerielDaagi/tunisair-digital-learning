const mongoose = require('mongoose');
const Lesson = require('./models/Lesson');
const Module = require('./models/Module');
require('dotenv').config();

// Configuration MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/e_learning';

// ID du cours
const COURSE_ID = '68abbe763bbb581ccb822323';

// Leçons à ajouter par module
const lessonsByModule = {
  'Introduction au cours': [
    {
      title: 'Bienvenue dans le cours',
      description: 'Présentation générale et objectifs du cours',
      content: `
        <h2>Bienvenue dans ce cours passionnant !</h2>
        <p>Dans cette leçon d'introduction, vous découvrirez :</p>
        <ul>
          <li>Les objectifs du cours</li>
          <li>La structure du programme</li>
          <li>Comment naviguer dans l'interface</li>
          <li>Les prérequis nécessaires</li>
        </ul>
        <p>Prenez le temps de bien comprendre cette introduction avant de passer aux modules suivants.</p>
      `,
      duration: '15 minutes',
      order: 1,
      type: 'text',
      isFree: true,
      difficulty: 'facile',
      tags: ['introduction', 'bienvenue', 'objectifs']
    },
    {
      title: 'Présentation de l\'instructeur',
      description: 'Découvrez votre instructeur et son parcours',
      content: `
        <h2>Votre instructeur</h2>
        <p>Je suis ravi de vous accompagner dans ce parcours d'apprentissage.</p>
        <h3>Mon parcours :</h3>
        <ul>
          <li>Plus de 10 ans d'expérience dans le domaine</li>
          <li>Formateur certifié</li>
          <li>Passionné par l'enseignement</li>
        </ul>
        <p>N'hésitez pas à me poser des questions tout au long du cours !</p>
      `,
      duration: '10 minutes',
      order: 2,
      type: 'text',
      isFree: true,
      difficulty: 'facile',
      tags: ['instructeur', 'présentation', 'parcours']
    }
  ],
  'Fondamentaux': [
    {
      title: 'Concepts de base',
      description: 'Apprentissage des concepts fondamentaux',
      content: `
        <h2>Les concepts de base</h2>
        <p>Cette leçon couvre les concepts essentiels que vous devez maîtriser :</p>
        <h3>Points clés :</h3>
        <ul>
          <li>Définition des termes importants</li>
          <li>Principes fondamentaux</li>
          <li>Théories de base</li>
        </ul>
        <p>Prenez des notes et n'hésitez pas à revoir cette leçon si nécessaire.</p>
      `,
      duration: '45 minutes',
      order: 1,
      type: 'text',
      isFree: false,
      difficulty: 'moyen',
      tags: ['concepts', 'fondamentaux', 'théorie']
    },
    {
      title: 'Vidéo explicative',
      description: 'Vidéo détaillée des concepts fondamentaux',
      content: `
        <h2>Vidéo explicative</h2>
        <p>Regardez cette vidéo pour une explication détaillée des concepts.</p>
        <div class="video-container">
          <iframe src="https://example.com/video-fondamentaux" width="100%" height="400" frameborder="0"></iframe>
        </div>
        <p>Après avoir regardé la vidéo, testez vos connaissances avec le quiz suivant.</p>
      `,
      duration: '30 minutes',
      order: 2,
      type: 'video',
      videoUrl: 'https://example.com/video-fondamentaux',
      isFree: false,
      difficulty: 'moyen',
      tags: ['vidéo', 'explication', 'concepts']
    },
    {
      title: 'Quiz de vérification',
      description: 'Testez vos connaissances des concepts fondamentaux',
      content: `
        <h2>Quiz de vérification</h2>
        <p>Ce quiz vous permettra de vérifier votre compréhension des concepts abordés.</p>
        <h3>Instructions :</h3>
        <ul>
          <li>Lisez attentivement chaque question</li>
          <li>Choisissez la meilleure réponse</li>
          <li>Vous pouvez recommencer le quiz si nécessaire</li>
        </ul>
        <p>Bonne chance !</p>
      `,
      duration: '20 minutes',
      order: 3,
      type: 'quiz',
      isFree: false,
      difficulty: 'moyen',
      tags: ['quiz', 'vérification', 'concepts']
    }
  ],
  'Applications pratiques': [
    {
      title: 'Exercice pratique 1',
      description: 'Premier exercice d\'application des concepts',
      content: `
        <h2>Exercice pratique 1</h2>
        <p>Dans cet exercice, vous allez mettre en pratique les concepts appris :</p>
        <h3>Objectifs :</h3>
        <ul>
          <li>Appliquer les concepts théoriques</li>
          <li>Résoudre un problème concret</li>
          <li>Développer votre logique</li>
        </ul>
        <h3>Instructions :</h3>
        <p>Suivez les étapes indiquées et documentez votre démarche.</p>
      `,
      duration: '1 heure',
      order: 1,
      type: 'assignment',
      isFree: false,
      difficulty: 'moyen',
      tags: ['exercice', 'pratique', 'application']
    },
    {
      title: 'Projet final',
      description: 'Projet complet d\'application des connaissances',
      content: `
        <h2>Projet final</h2>
        <p>Ce projet final vous permettra de démontrer toutes vos compétences :</p>
        <h3>Objectifs du projet :</h3>
        <ul>
          <li>Intégrer tous les concepts appris</li>
          <li>Créer une solution complète</li>
          <li>Présenter votre travail</li>
        </ul>
        <h3>Critères d'évaluation :</h3>
        <ul>
          <li>Qualité technique : 40%</li>
          <li>Créativité : 30%</li>
          <li>Présentation : 30%</li>
        </ul>
      `,
      duration: '2 heures',
      order: 2,
      type: 'assignment',
      isFree: false,
      difficulty: 'difficile',
      tags: ['projet', 'final', 'évaluation']
    }
  ],
  'Évaluation et certification': [
    {
      title: 'Quiz final',
      description: 'Évaluation finale de vos connaissances',
      content: `
        <h2>Quiz final</h2>
        <p>Ce quiz final évalue l'ensemble de vos connaissances acquises :</p>
        <h3>Caractéristiques :</h3>
        <ul>
          <li>50 questions à choix multiples</li>
          <li>Durée : 1 heure</li>
          <li>Score minimum : 70% pour la certification</li>
          <li>Possibilité de repasser le quiz</li>
        </ul>
        <p>Préparez-vous bien et bonne chance !</p>
      `,
      duration: '1 heure',
      order: 1,
      type: 'quiz',
      isFree: false,
      difficulty: 'difficile',
      tags: ['quiz', 'final', 'évaluation', 'certification']
    },
    {
      title: 'Demande de certification',
      description: 'Processus pour obtenir votre certification',
      content: `
        <h2>Demande de certification</h2>
        <p>Félicitations ! Vous avez terminé le cours avec succès.</p>
        <h3>Pour obtenir votre certification :</h3>
        <ul>
          <li>Avoir complété tous les modules</li>
          <li>Avoir réussi le quiz final (score ≥ 70%)</li>
          <li>Remplir le formulaire de demande</li>
          <li>Payer les frais de certification (optionnel)</li>
        </ul>
        <p>Votre certification sera délivrée sous 5 jours ouvrables.</p>
      `,
      duration: '15 minutes',
      order: 2,
      type: 'text',
      isFree: true,
      difficulty: 'facile',
      tags: ['certification', 'diplôme', 'finalisation']
    }
  ]
};

async function addLessonsToModules() {
  try {
    console.log('🔌 Connexion à MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // Récupérer tous les modules du cours
    console.log(`\n🔍 Récupération des modules du cours ${COURSE_ID}...`);
    const modules = await Module.find({ course: COURSE_ID }).sort('order');
    
    if (modules.length === 0) {
      console.log('❌ Aucun module trouvé pour ce cours');
      return;
    }

    console.log(`✅ ${modules.length} modules trouvés`);

    let totalLessonsAdded = 0;

    // Ajouter les leçons pour chaque module
    for (const module of modules) {
      const moduleLessons = lessonsByModule[module.title];
      
      if (!moduleLessons) {
        console.log(`⚠️ Aucune leçon définie pour le module: ${module.title}`);
        continue;
      }

      console.log(`\n📚 Ajout des leçons au module: ${module.title}`);
      
      for (const lessonData of moduleLessons) {
        try {
          const newLesson = new Lesson({
            ...lessonData,
            course: COURSE_ID,
            module: module._id
          });

          await newLesson.save();
          
          // Ajouter la leçon au module
          await Module.findByIdAndUpdate(module._id, {
            $push: { lessons: newLesson._id }
          });

          console.log(`✅ Leçon ajoutée: ${lessonData.title}`);
          totalLessonsAdded++;
        } catch (error) {
          console.error(`❌ Erreur lors de l'ajout de la leçon "${lessonData.title}":`, error.message);
        }
      }
    }

    // Afficher le résumé
    console.log('\n📊 Résumé:');
    console.log(`- Cours: ${COURSE_ID}`);
    console.log(`- Modules traités: ${modules.length}`);
    console.log(`- Leçons ajoutées: ${totalLessonsAdded}`);

    console.log('\n🎉 Opération terminée avec succès !');

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

// Exécuter le script
addLessonsToModules();

