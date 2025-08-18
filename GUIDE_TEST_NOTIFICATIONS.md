# 🔔 Guide de Test - Système de Notifications Admin

## 📋 Vue d'ensemble

Ce guide vous explique comment tester le système de notifications en temps réel entre utilisateurs et administrateurs.

## 🚀 Installation et Démarrage

### 1. Installation des dépendances

```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

### 2. Configuration de la base de données

Assurez-vous que votre fichier `.env` dans le dossier `backend` contient :

```env
MONGODB_URI=mongodb://localhost:27017/e_learning
JWT_SECRET=votre_secret_jwt_ici
PORT=5000
```

### 3. Démarrage des serveurs

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm start
```

## 🧪 Tests Automatiques

### Test via script Node.js

```bash
# Depuis la racine du projet
node test-notifications.js
```

Ce script va :
- Tester la connexion au serveur
- Se connecter en tant qu'admin et utilisateur
- Envoyer des notifications
- Vérifier les statistiques
- Tester le marquage comme lu

## 🌐 Tests Manuels en Temps Réel

### Étape 1 : Préparation

1. **Ouvrez deux onglets de navigateur** (ou deux navigateurs différents)
2. **Assurez-vous que le serveur backend et frontend sont démarrés**

### Étape 2 : Connexion Admin

**Onglet 1 - Admin :**
1. Allez sur `http://localhost:3000/login`
2. Connectez-vous avec un compte admin :
   - Email : `admin@test.com`
   - Mot de passe : `admin123`
3. Une fois connecté, allez sur `http://localhost:3000/admin/notifications`
4. Vous devriez voir le "Centre de Notifications Admin"

### Étape 3 : Connexion Utilisateur

**Onglet 2 - Utilisateur :**
1. Allez sur `http://localhost:3000/login`
2. Connectez-vous avec un compte utilisateur :
   - Email : `user@test.com`
   - Mot de passe : `user123`
3. Une fois connecté, allez sur `http://localhost:3000/test-notifications`
4. Vous devriez voir la page "Test de Notifications Admin"

### Étape 4 : Test des Notifications

**Depuis l'onglet Utilisateur :**

1. **Test Rapide :**
   - Cliquez sur "Envoyer un test rapide"
   - Vous devriez voir un message de succès

2. **Test Personnalisé :**
   - Remplissez le formulaire avec :
     - Titre : "Test personnalisé"
     - Message : "Ceci est un test personnalisé"
     - Type : "warning"
     - Catégorie : "user_action"
   - Cliquez sur "Envoyer la notification"

**Depuis l'onglet Admin :**

1. **Vérification en temps réel :**
   - Les notifications devraient apparaître instantanément
   - Vérifiez les statistiques en haut de la page
   - Testez le bouton "Marquer lu" sur une notification
   - Testez le bouton "Supprimer" sur une notification

2. **Test d'envoi depuis l'admin :**
   - Dans la section "Envoyer une Notification"
   - Sélectionnez un utilisateur dans la liste
   - Remplissez le formulaire
   - Cliquez sur "Envoyer la notification"

### Étape 5 : Test des WebSockets

1. **Vérifiez la console du navigateur** (F12)
2. Vous devriez voir des messages comme :
   ```
   🔌 WebSocket connecté
   🔔 Nouvelle notification admin reçue: {...}
   ```

3. **Test de déconnexion/reconnexion :**
   - Fermez l'onglet admin
   - Rouvrez-le et reconnectez-vous
   - Vérifiez que les notifications sont toujours là

## 🔍 Vérifications à Effectuer

### ✅ Fonctionnalités à Tester

- [ ] **Connexion WebSocket** : Messages dans la console
- [ ] **Envoi de notifications** : Depuis utilisateur vers admin
- [ ] **Réception en temps réel** : Notifications apparaissent instantanément
- [ ] **Marquage comme lu** : Bouton "Marquer lu" fonctionne
- [ ] **Suppression** : Bouton "Supprimer" fonctionne
- [ ] **Statistiques** : Compteurs se mettent à jour
- [ ] **Envoi depuis admin** : Admin peut envoyer à des utilisateurs
- [ ] **Persistance** : Notifications restent après reconnexion

### 📊 Statistiques à Vérifier

Dans le centre admin, vérifiez que :
- **Total** : Nombre total de notifications
- **Non lues** : Notifications non marquées comme lues
- **Admin** : Notifications envoyées aux admins
- **Utilisateurs** : Notifications envoyées aux utilisateurs

## 🐛 Dépannage

### Problèmes Courants

1. **WebSocket ne se connecte pas :**
   - Vérifiez que le serveur backend est démarré
   - Vérifiez les logs dans la console du navigateur
   - Assurez-vous que le token d'authentification est valide

2. **Notifications n'apparaissent pas :**
   - Vérifiez que l'admin est bien connecté
   - Vérifiez les logs du serveur backend
   - Assurez-vous que la base de données est accessible

3. **Erreurs de base de données :**
   - Vérifiez la connexion MongoDB
   - Vérifiez les variables d'environnement
   - Redémarrez le serveur backend

### Logs à Surveiller

**Backend (Terminal 1) :**
```
🔌 Utilisateur connecté: John Doe (admin)
🔔 Admin 123456 connecté - Socket enregistré
🔔 Notification admin envoyée: Test - 1 admins connectés
```

**Frontend (Console navigateur) :**
```
🔌 WebSocket connecté
🔔 Nouvelle notification admin reçue: {...}
```

## 📱 Test sur Mobile

Pour tester sur mobile :
1. Trouvez l'IP de votre ordinateur : `ipconfig` (Windows) ou `ifconfig` (Mac/Linux)
2. Modifiez l'URL dans le navigateur mobile : `http://VOTRE_IP:3000`
3. Assurez-vous que le mobile et l'ordinateur sont sur le même réseau

## 🎯 Scénarios de Test Avancés

### Test de Charge
1. Ouvrez plusieurs onglets avec différents utilisateurs
2. Envoyez des notifications simultanément
3. Vérifiez que toutes les notifications sont reçues

### Test de Déconnexion
1. Fermez brutalement l'onglet admin
2. Rouvrez et reconnectez-vous
3. Vérifiez que les notifications sont toujours présentes

### Test de Reconnexion
1. Déconnectez-vous de l'admin
2. Reconnectez-vous
3. Vérifiez que les WebSockets se reconnectent automatiquement

## 📝 Notes Importantes

- Les notifications sont stockées en base de données MongoDB
- Les WebSockets permettent la communication en temps réel
- Le système fonctionne même si un admin n'est pas connecté (notifications stockées)
- Les notifications apparaissent dès qu'un admin se connecte
- Le système gère automatiquement les déconnexions/reconnexions

## 🎉 Félicitations !

Si tous les tests passent, votre système de notifications est opérationnel ! 🚀
