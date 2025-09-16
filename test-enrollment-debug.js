// Script de test pour déboguer le problème d'inscription automatique
// À exécuter dans la console du navigateur sur la page du cours

console.log('🔍 Debug de l\'état d\'inscription');

// 1. Vérifier le localStorage
const enrollments = JSON.parse(localStorage.getItem('enrollments') || '{}');
console.log('📦 localStorage enrollments:', enrollments);

// 2. Obtenir l'ID du cours depuis l'URL
const courseId = window.location.pathname.split('/').pop();
console.log('🆔 Course ID from URL:', courseId);

// 3. Vérifier l'état pour ce cours spécifique
const courseEnrollment = enrollments[courseId];
console.log('📋 État d\'inscription pour ce cours:', courseEnrollment);

// 4. Fonction pour nettoyer le localStorage
function clearEnrollmentData() {
    console.log('🗑️ Nettoyage du localStorage...');
    localStorage.removeItem('enrollments');
    console.log('✅ localStorage nettoyé');
    location.reload();
}

// 5. Fonction pour forcer une vérification
function forceEnrollmentCheck() {
    console.log('🔄 Force refresh de l\'état d\'inscription...');
    // Simuler un clic sur le bouton refresh si disponible
    const refreshBtn = document.querySelector('button[title*="Debug: Forcer la vérification"]');
    if (refreshBtn) {
        refreshBtn.click();
        console.log('✅ Bouton refresh cliqué');
    } else {
        console.log('❌ Bouton refresh non trouvé');
    }
}

// 6. Afficher les instructions
console.log(`
📋 Instructions de debug:
1. clearEnrollmentData() - Nettoyer le localStorage et recharger
2. forceEnrollmentCheck() - Forcer une vérification de l'inscription
3. Vérifiez les logs ci-dessus pour l'état actuel
`);

// 7. Vérifier si l'utilisateur est connecté
const userInfo = document.querySelector('[data-user]') || 
                 (window.user ? window.user : 'Non disponible');
console.log('👤 Utilisateur connecté:', userInfo);
