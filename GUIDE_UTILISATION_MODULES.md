# 🎓 Guide d'utilisation - Création et gestion des modules

## 📋 Comment créer un module

### 1. **Accéder à la gestion des modules**
- Connectez-vous en tant que tuteur
- Allez dans "Mes cours" ou naviguez vers un cours existant
- Cliquez sur "Gérer les modules" pour le cours choisi

### 2. **Créer un nouveau module**
- Sur la page de gestion des modules, cliquez sur le bouton **"Ajouter un module"**
- Vous serez redirigé vers le formulaire de création de module
- Remplissez les informations suivantes :
  - **Titre du module** (obligatoire)
  - **Description** (obligatoire)
  - **Ordre** (numéro de séquence dans le cours)
  - **Durée estimée** (ex: "2 heures", "45 minutes")
  - **Objectifs d'apprentissage** (liste des compétences à acquérir)
  - **Ressources** (documents, vidéos, liens)

### 3. **Sauvegarder le module**
- Cliquez sur **"Créer le module"**
- Le module sera créé et vous retournerez à la liste des modules

## 🔧 Gestion des modules existants

### **Actions disponibles :**
- **Modifier** : Cliquez sur le bouton "Modifier" pour éditer un module
- **Supprimer** : Cliquez sur le bouton "Supprimer" (avec confirmation)
- **Gérer les leçons** : Cliquez sur "Leçons" pour ajouter/modifier les leçons du module

## 📚 Ajout de leçons aux modules

### 1. **Accéder à la gestion des leçons**
- Cliquez sur le bouton **"Leçons"** d'un module
- Vous serez redirigé vers la page de gestion des leçons

### 2. **Créer une nouvelle leçon**
- Cliquez sur **"Ajouter une leçon"**
- Remplissez le formulaire :
  - **Titre de la leçon**
  - **Description**
  - **Contenu** (texte riche, HTML supporté)
  - **Durée**
  - **Type** (texte, vidéo, quiz, devoir, interactif)
  - **Niveau de difficulté** (facile, moyen, difficile)
  - **Tags** (mots-clés pour la recherche)
  - **Gratuit/Payant** (définir si la leçon est accessible gratuitement)

### 3. **Organiser les leçons**
- Utilisez les boutons ↑↓ pour réorganiser l'ordre des leçons
- Chaque leçon a un numéro d'ordre qui détermine la séquence d'apprentissage

## 🎯 Structure recommandée d'un cours

### **Module 1 : Introduction**
- Leçon 1 : Bienvenue et objectifs
- Leçon 2 : Présentation de l'instructeur
- Leçon 3 : Prérequis et matériel nécessaire

### **Module 2 : Concepts de base**
- Leçon 1 : Théorie fondamentale
- Leçon 2 : Exemples pratiques
- Leçon 3 : Quiz de vérification

### **Module 3 : Applications pratiques**
- Leçon 1 : Exercices guidés
- Leçon 2 : Projets pratiques
- Leçon 3 : Cas d'usage réels

### **Module 4 : Évaluation**
- Leçon 1 : Quiz final
- Leçon 2 : Projet de certification
- Leçon 3 : Demande de diplôme

## 💡 Conseils pour créer un bon cours

1. **Commencez simple** : Créez d'abord la structure avec des modules de base
2. **Ajoutez progressivement** : Enrichissez avec des leçons détaillées
3. **Variez les types** : Mélangez texte, vidéo, quiz et exercices pratiques
4. **Testez l'expérience** : Vérifiez que la navigation est intuitive
5. **Publiez progressivement** : Commencez en mode brouillon, puis publiez module par module

## 🚀 Démarrage rapide

1. **Créez votre premier cours** dans "Mes cours"
2. **Ajoutez 3-4 modules** avec des titres clairs
3. **Créez 2-3 leçons** par module pour commencer
4. **Testez la navigation** en tant qu'étudiant
5. **Publiez le cours** quand vous êtes satisfait

## 🔍 Résolution de problèmes

### **Le bouton "Ajouter un module" ne fonctionne pas ?**
- Vérifiez que vous êtes connecté en tant que tuteur
- Assurez-vous que le serveur backend est démarré (port 5000)
- Vérifiez la console du navigateur pour les erreurs

### **Impossible de sauvegarder un module ?**
- Vérifiez que tous les champs obligatoires sont remplis
- Assurez-vous que l'ordre du module est unique dans le cours
- Vérifiez la connexion à la base de données

### **Les leçons ne s'affichent pas ?**
- Vérifiez que les leçons sont bien liées au module
- Assurez-vous que l'API fonctionne correctement
- Vérifiez les permissions d'accès

---

## 📞 Support

Si vous rencontrez des problèmes :
1. Vérifiez la console du navigateur (F12)
2. Vérifiez les logs du serveur backend
3. Assurez-vous que MongoDB est connecté
4. Vérifiez que tous les services sont démarrés

**Bon apprentissage ! 🎓✨**

