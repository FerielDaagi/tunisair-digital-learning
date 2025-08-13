# Tunisair Academy

Une plateforme d'apprentissage en ligne moderne construite avec React.js frontend et Node.js backend pour un projet de stage de 6 semaines.

## 🚀 Fonctionnalités

### Fonctionnalités principales
- **Authentification utilisateur** : Connexion/Inscription avec tokens JWT
- **Gestion des cours** : Parcourir, visualiser et s'inscrire aux cours
- **Tableau de bord** : Progression d'apprentissage, statistiques et activité récente
- **Design responsive** : Interface adaptée aux mobiles
- **UI moderne** : Design propre et professionnel avec thème Tunisair

### Fonctionnalités utilisateur avancées
- **Gestion des avatars** : Télécharger, mettre à jour et gérer les photos de profil
- **Historique des avatars** : Visualiser et restaurer les avatars précédents
- **Gestion de compte** : Suppression complète de compte avec nettoyage des données
- **Système de rôles** : Système de promotion d'apprenti à tuteur
- **UI professionnelle** : Modales de confirmation personnalisées remplaçant les alertes du navigateur
- **Navigation améliorée** : Affichage d'avatar dans la navbar avec informations utilisateur

### Gestion de profil
- **Téléchargement d'avatar** : Support pour JPG, PNG, GIF, WebP (max 5MB)
- **Historique des avatars** : Sauvegarde automatique des avatars précédents
- **Restauration d'avatar** : Restaurer n'importe quel avatar précédent depuis l'historique
- **Suppression d'avatar** : Supprimer des avatars spécifiques de l'historique
- **Informations de profil** : Mettre à jour nom, bio, téléphone, date de naissance

### Sécurité du compte
- **Suppression sécurisée** : Suppression complète de compte avec nettoyage des fichiers
- **Système de confirmation** : Modales de confirmation professionnelles
- **Protection des données** : Nettoyage automatique des fichiers et données utilisateur

## 🛠️ Stack technologique

### Frontend
- React.js 18
- React Router pour la navigation
- Axios pour les appels API
- CSS3 avec style personnalisé
- Context API pour la gestion d'état
- Gestion des téléchargements de fichiers avec FormData

### Backend
- Node.js
- Express.js
- JWT pour l'authentification
- bcryptjs pour le hachage des mots de passe
- Multer pour les téléchargements de fichiers
- MongoDB avec Mongoose
- CORS activé
- Helmet pour la sécurité
- Opérations sur le système de fichiers (fs, path)

## 📁 Structure du projet

```
e-learning/
├── frontend/                 # Frontend React
│   ├── public/
│   ├── src/
│   │   ├── components/      # Composants réutilisables
│   │   │   └── common/
│   │   │       ├── Navbar.js    # Navbar améliorée avec avatar
│   │   │       └── ProtectedRoute.js
│   │   ├── contexts/        # Contextes React
│   │   │   └── AuthContext.js
│   │   ├── pages/          # Composants de page
│   │   │   ├── auth/
│   │   │   │   ├── Login.js
│   │   │   │   └── Signup.js
│   │   │   ├── courses/
│   │   │   │   ├── Courses.js
│   │   │   │   └── CourseDetail.js
│   │   │   ├── dashboard/
│   │   │   │   └── Dashboard.js
│   │   │   └── user/
│   │   │       └── Profile.js   # Gestion de profil améliorée
│   │   ├── services/       # Services API
│   │   │   └── api.js      # Intégration API complète
│   │   └── App.js
│   └── package.json
├── backend/                 # Backend Node.js
│   ├── config/
│   │   └── database.js
│   ├── controllers/        # Contrôleurs de route
│   │   ├── authController.js   # Amélioré avec suppression de compte
│   │   ├── userController.js   # Gestion des avatars et tuteurs
│   │   ├── courseController.js
│   │   └── dashboardController.js
│   ├── middleware/         # Middleware personnalisé
│   │   ├── auth.js
│   │   └── errorHandler.js
│   ├── models/
│   │   └── User.js
│   ├── routes/            # Routes API
│   │   ├── auth.js        # Routes d'auth améliorées
│   │   ├── user.js        # Gestion utilisateur complète
│   │   ├── courses.js
│   │   └── dashboard.js
│   ├── uploads/           # Stockage de fichiers
│   │   └── avatars/       # Stockage des avatars utilisateur
│   ├── server.js          # Fichier serveur principal
│   └── package.json
└── README.md
```

## 🚀 Pour commencer

### Prérequis
- Node.js (v14 ou supérieur)
- npm ou yarn
- MongoDB (local ou cloud)

### Installation

1. **Cloner le repository**
   ```bash
   git clone <repository-url>
   cd e-learning
   ```

2. **Installer les dépendances Frontend**
   ```bash
   cd frontend
   npm install
   ```

3. **Installer les dépendances Backend**
   ```bash
   cd ../backend
   npm install
   ```

4. **Configurer les variables d'environnement**
   
   Créer un fichier `.env` dans le répertoire backend :
   ```env
   NODE_ENV=development
   PORT=5000
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   FRONTEND_URL=http://localhost:3000
   MONGODB_URI=mongodb://localhost:27017/e-learning
   ```

### Exécuter l'application

1. **Démarrer le serveur Backend**
   ```bash
   cd backend
   npm run dev
   ```
   Le backend fonctionnera sur `http://localhost:5000`

2. **Démarrer le serveur de développement Frontend**
   ```bash
   cd frontend
   npm start
   ```
   Le frontend fonctionnera sur `http://localhost:3000`

## 📚 Endpoints API

### Authentification
- `POST /api/auth/login` - Connexion utilisateur
- `POST /api/auth/register` - Inscription utilisateur
- `POST /api/auth/logout` - Déconnexion utilisateur
- `GET /api/auth/me` - Obtenir l'utilisateur actuel
- `DELETE /api/auth/delete` - Supprimer le compte utilisateur (avec nettoyage des fichiers)

### Gestion des utilisateurs
- `GET /api/user/profile` - Obtenir le profil utilisateur
- `PUT /api/user/profile` - Mettre à jour le profil utilisateur
- `PUT /api/user/avatar` - Télécharger/mettre à jour l'avatar utilisateur
- `GET /api/user/avatar/history` - Obtenir l'historique des avatars
- `POST /api/user/avatar/restore` - Restaurer un avatar précédent
- `DELETE /api/user/avatar/history` - Supprimer un avatar de l'historique
- `POST /api/user/become-tutor` - Promouvoir l'utilisateur au rôle de tuteur
- `GET /api/user/progress` - Obtenir la progression d'apprentissage
- `POST /api/user/progress` - Mettre à jour la progression des leçons

### Cours
- `GET /api/courses` - Obtenir tous les cours
- `GET /api/courses/:id` - Obtenir un cours par ID
- `GET /api/courses/enrolled` - Obtenir les cours inscrits
- `POST /api/courses/:id/enroll` - S'inscrire à un cours

### Tableau de bord
- `GET /api/dashboard/stats` - Obtenir les statistiques du tableau de bord
- `GET /api/dashboard/recent-activity` - Obtenir l'activité récente
- `GET /api/dashboard/learning-progress` - Obtenir la progression d'apprentissage
- `GET /api/dashboard/achievements` - Obtenir les réalisations utilisateur

## 🎨 Fonctionnalités de design

### Améliorations UI/UX
- **Intégration des avatars** : Avatars utilisateur affichés dans la navigation
- **Modales professionnelles** : Dialogues de confirmation personnalisés
- **Navigation améliorée** : Avatar et nom d'utilisateur dans la navbar
- **Design responsive** : Approche mobile-first
- **Animations fluides** : Effets de survol et transitions

### Palette de couleurs & Typographie
- **Couleurs principales** : Rouge Tunisair (#E30613) et bleu sombre (#002E5D)
- **Couleurs d'accent** : Blanc (#FFFFFF), Gris clair (#F5F5F5), Gris foncé (#333333)
- **Couleurs de statut** : Vert pastel (#4CAF50), Orange clair (#FF9800)
- **Typographie** : Polices modernes et propres avec hiérarchie appropriée
- **Mise en page** : Système de grille responsive avec flexbox

## 🔧 Fonctionnalités de développement

### Développement Frontend
- **Architecture des composants** : Composants modulaires et réutilisables
- **Gestion d'état** : Context API pour l'état global
- **Gestion des fichiers** : FormData pour les téléchargements d'avatars
- **Gestion des erreurs** : Gestion d'erreur complète
- **États de chargement** : Retour utilisateur pendant les opérations

### Développement Backend
- **Architecture MVC** : Séparation claire des préoccupations
- **Gestion des fichiers** : Multer pour les téléchargements
- **Intégration de base de données** : MongoDB avec Mongoose
- **Sécurité** : Authentification JWT, hachage des mots de passe
- **Gestion des erreurs** : Middleware d'erreur complet

### Gestion des fichiers
- **Stockage des avatars** : Structure de fichiers organisée dans uploads/avatars/
- **Validation des fichiers** : Validation du type et de la taille
- **Nettoyage automatique** : Suppression des fichiers lors de la suppression de compte
- **Gestion de l'historique** : Suivi des avatars précédents

## 📱 Design responsive

L'application est entièrement responsive et optimisée pour :
- **Desktop** : Expérience complète
- **Tablette** : Interface adaptée au tactile
- **Mobile** : Navigation et interactions optimisées

## 🔒 Fonctionnalités de sécurité

### Authentification & Autorisation
- Authentification par token JWT
- Hachage des mots de passe avec bcryptjs
- Contrôle d'accès basé sur les rôles (Apprenti/Tuteur)
- Expiration et renouvellement des tokens

### Protection des données
- Configuration CORS
- En-têtes de sécurité Helmet
- Limitation de débit
- Validation et assainissement des entrées
- Gestion sécurisée des téléchargements de fichiers

### Sécurité du compte
- Suppression complète de compte
- Nettoyage des fichiers lors de la suppression de compte
- Exigences de confirmation pour les actions destructives
- Gestion des sessions

## 🚀 Déploiement

### Déploiement Frontend
1. Construire la version de production :
   ```bash
   cd frontend
   npm run build
   ```
2. Déployer le dossier `build` vers votre service d'hébergement

### Déploiement Backend
1. Définir les variables d'environnement de production
2. Assurer la connexion MongoDB
3. Configurer le stockage de fichiers pour les avatars
4. Déployer vers votre service d'hébergement Node.js

### Considérations de stockage de fichiers
- Configurer le stockage de fichiers persistant pour les avatars
- Mettre en place des systèmes de sauvegarde appropriés
- S'assurer que les processus de nettoyage de fichiers fonctionnent en production

## 🆕 Mises à jour récentes

### Fonctionnalités Version 2.0
- **Système de gestion des avatars** : Téléchargement, historique et restauration complets d'avatars
- **Suppression de compte** : Suppression sécurisée de compte avec nettoyage des données
- **Promotion de tuteur** : Système basé sur les rôles pour l'avancement utilisateur
- **UI améliorée** : Modales professionnelles et navigation améliorée
- **Gestion des fichiers** : Stockage organisé des avatars et nettoyage
- **Améliorations de sécurité** : Authentification et protection des données améliorées

### Améliorations techniques
- **Backend** : Contrôleurs améliorés avec gestion des fichiers
- **Frontend** : Expérience utilisateur améliorée avec les avatars
- **API** : Endpoints RESTful complets pour toutes les fonctionnalités
- **Base de données** : Modèle utilisateur amélioré avec suivi des avatars

## 🤝 Contribution

1. Fork le repository
2. Créer une branche de fonctionnalité
3. Faire vos modifications
4. Tester minutieusement
5. Soumettre une pull request

## 📄 Licence

Ce projet est créé à des fins éducatives dans le cadre d'un stage de 6 semaines.

## 🎯 Améliorations futures

- **Fonctionnalités en temps réel** : Chat en direct, notifications
- **Analyses avancées** : Suivi de la progression d'apprentissage
- **Gestion de contenu** : Outils de création de cours
- **Fonctionnalités sociales** : Interactions utilisateur et forums
- **Application mobile** : Application mobile native

 