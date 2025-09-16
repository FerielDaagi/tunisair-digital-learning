# Guide de Configuration - Vérification par Email

## Fonctionnalités ajoutées

✅ **Case de confirmation de mot de passe** dans le formulaire d'inscription
✅ **Système de vérification par email** avec code à 6 chiffres
✅ **Envoi d'emails automatiques** depuis daagiferiel92@gmail.com
✅ **Page de vérification dédiée** avec interface utilisateur moderne
✅ **Gestion des erreurs** et messages informatifs
✅ **Renvoi de code** avec limitation temporelle

## Configuration requise

### 1. Variables d'environnement

Créez un fichier `.env` dans le dossier `backend/` avec le contenu suivant :

```env
# Configuration de la base de données
MONGODB_URI=mongodb://localhost:27017/e_learning

# Configuration JWT
JWT_SECRET=your-super-secret-jwt-key-here

# Configuration du serveur
PORT=5000
NODE_ENV=development

# Configuration email
EMAIL_USER=daagiferiel92@gmail.com
EMAIL_PASS=your-app-password-here

# Configuration frontend
FRONTEND_URL=http://localhost:3000
```

### 2. Configuration Gmail

Pour que l'envoi d'emails fonctionne, vous devez :

1. **Activer l'authentification à 2 facteurs** sur votre compte Gmail
2. **Générer un mot de passe d'application** :
   - Allez dans les paramètres de votre compte Google
   - Sécurité → Authentification à 2 facteurs
   - Mots de passe des applications
   - Générez un mot de passe pour "Mail"
3. **Remplacer `your-app-password-here`** dans le fichier `.env` par le mot de passe généré

### 3. Installation des dépendances

Les dépendances ont été automatiquement installées :
- `nodemailer` pour l'envoi d'emails

## Fonctionnement du système

### 1. Processus d'inscription

1. L'utilisateur remplit le formulaire avec confirmation de mot de passe
2. Validation côté client des mots de passe
3. Création du compte avec `isActive: false` et `emailVerified: false`
4. Génération d'un code de vérification à 6 chiffres (valide 10 minutes)
5. Envoi automatique d'un email avec le code
6. Redirection vers la page de vérification

### 2. Page de vérification

- Interface moderne et responsive
- Saisie du code à 6 chiffres avec validation
- Bouton de renvoi de code (limité à 1 par minute)
- Gestion des erreurs et messages de succès
- Redirection automatique vers la connexion après vérification

### 3. Processus de connexion

- Vérification automatique du statut de vérification
- Redirection vers la page de vérification si le compte n'est pas activé
- Messages d'erreur appropriés

## Nouveaux endpoints API

### POST /api/auth/verify-email
Vérifie le code de vérification email
```json
{
  "email": "user@example.com",
  "verificationCode": "123456"
}
```

### POST /api/auth/resend-verification
Renvoie un nouveau code de vérification
```json
{
  "email": "user@example.com"
}
```

## Modifications apportées

### Backend
- **Modèle User** : Ajout des champs `emailVerified`, `verificationCode`, `verificationCodeExpires`
- **Service email** : Configuration nodemailer avec templates HTML
- **Contrôleur auth** : Nouvelles fonctions de vérification
- **Routes** : Nouveaux endpoints pour la vérification

### Frontend
- **Signup.js** : Ajout de la confirmation de mot de passe et redirection
- **EmailVerification.js** : Nouvelle page de vérification
- **Login.js** : Gestion des comptes non vérifiés
- **API** : Nouvelles fonctions pour la vérification

## Test du système

1. **Démarrer le backend** : `npm start` dans le dossier `backend/`
2. **Démarrer le frontend** : `npm start` dans le dossier `frontend/`
3. **Tester l'inscription** :
   - Aller sur `/signup`
   - Remplir le formulaire avec confirmation de mot de passe
   - Vérifier la redirection vers `/verify-email`
4. **Tester la vérification** :
   - Vérifier la réception de l'email
   - Saisir le code de vérification
   - Vérifier l'activation du compte
5. **Tester la connexion** :
   - Se connecter avec le compte vérifié
   - Vérifier l'accès au dashboard

## Dépannage

### Email non reçu
- Vérifier le dossier spam
- Vérifier la configuration Gmail
- Vérifier les logs du serveur

### Code de vérification expiré
- Utiliser le bouton "Renvoyer le code"
- Attendre 1 minute entre chaque renvoi

### Erreurs de configuration
- Vérifier le fichier `.env`
- Vérifier la connexion à la base de données
- Vérifier les logs du serveur

## Sécurité

- Les codes de vérification expirent après 10 minutes
- Limitation du renvoi de code (1 par minute)
- Validation côté serveur et client
- Nettoyage automatique des codes expirés
- Chiffrement des mots de passe avec bcrypt

## Personnalisation

### Templates d'email
Les templates sont dans `backend/services/emailService.js` et peuvent être personnalisés.

### Durée de validité
Modifier la valeur dans `authController.js` :
```javascript
const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
```

### Interface utilisateur
Les styles sont dans `frontend/src/pages/auth/EmailVerification.css` et peuvent être personnalisés.
