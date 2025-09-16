# Guide de Débogage - Problème d'Inscription Automatique

## Problème
Quand vous accédez à un cours via `/courses/id`, il affiche "Annuler l'inscription" au lieu de "S'inscrire maintenant".

## Solutions de Débogage

### 1. Vérification Rapide
1. Ouvrez la console du navigateur (F12)
2. Allez sur la page du cours problématique
3. Regardez les logs qui commencent par 🔍, ✅, ou ❌

### 2. Boutons de Debug (Mode Développement)
Si vous êtes en mode développement, vous verrez deux boutons à côté du bouton d'inscription :
- **🔄 Refresh** : Force une vérification complète de l'inscription
- **🗑️ Clear** : Nettoie le localStorage et force une vérification

### 3. Script de Debug
1. Ouvrez la console du navigateur
2. Copiez et collez le contenu du fichier `test-enrollment-debug.js`
3. Exécutez les fonctions :
   - `clearEnrollmentData()` - Nettoie tout et recharge
   - `forceEnrollmentCheck()` - Force une vérification

### 4. Nettoyage Manuel du localStorage
```javascript
// Dans la console du navigateur
localStorage.removeItem('enrollments');
location.reload();
```

### 5. Vérification des Données
```javascript
// Vérifier le localStorage
console.log('Enrollments:', JSON.parse(localStorage.getItem('enrollments') || '{}'));

// Vérifier l'ID du cours
console.log('Course ID:', window.location.pathname.split('/').pop());
```

## Causes Possibles

1. **localStorage corrompu** : Le localStorage contient des données incorrectes
2. **Cache navigateur** : Le navigateur cache des données obsolètes
3. **Session précédente** : Une session précédente a laissé des données incorrectes
4. **Bug dans la logique** : Un problème dans la vérification d'inscription

## Solutions Permanentes

### Solution 1 : Validation du localStorage
Le code a été modifié pour valider automatiquement le localStorage contre l'API.

### Solution 2 : Force Refresh
Utilisez le bouton "🔄 Refresh" pour forcer une vérification complète.

### Solution 3 : Nettoyage Complet
Utilisez le bouton "🗑️ Clear" pour nettoyer complètement le localStorage.

## Prévention

1. **Toujours valider** : Le localStorage est maintenant validé contre l'API
2. **Logs détaillés** : Les logs vous aideront à identifier les problèmes
3. **Boutons de debug** : Utilisez les boutons de debug en cas de problème

## Test de la Solution

1. Allez sur un cours où vous n'êtes pas inscrit
2. Vérifiez que le bouton affiche "S'inscrire maintenant"
3. Cliquez sur "S'inscrire maintenant"
4. Vérifiez que le bouton change en "Annuler l'inscription"
5. Cliquez sur "Annuler l'inscription"
6. Vérifiez que le bouton redevient "S'inscrire maintenant"

Si le problème persiste, utilisez les outils de debug ci-dessus.
