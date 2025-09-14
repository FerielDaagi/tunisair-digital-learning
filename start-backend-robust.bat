@echo off
echo ========================================
echo    E-LEARNING BACKEND - DEMARRAGE ROBUSTE
echo ========================================
echo.

cd /d "%~dp0\backend"

echo 🔍 Vérification de l'environnement...
node --version
if %errorlevel% neq 0 (
    echo ❌ Node.js n'est pas installé ou non trouvé
    pause
    exit /b 1
)

echo.
echo 🚀 Démarrage du serveur avec gestion d'erreurs...
echo 💡 Le serveur redémarrera automatiquement en cas de crash
echo 💡 Appuyez sur Ctrl+C pour arrêter
echo.

node start-server-robust.js

echo.
echo 🛑 Serveur arrêté
pause
