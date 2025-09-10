@echo off
echo 🚀 Démarrage du serveur E-Learning avec monitoring...
echo.

REM Vérifier si Node.js est installé
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js n'est pas installé ou pas dans le PATH
    pause
    exit /b 1
)

REM Vérifier si npm est installé
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm n'est pas installé ou pas dans le PATH
    pause
    exit /b 1
)

REM Aller dans le dossier backend
cd /d "%~dp0"

REM Vérifier si package.json existe
if not exist package.json (
    echo ❌ package.json non trouvé dans le dossier backend
    pause
    exit /b 1
)

REM Installer les dépendances si nécessaire
if not exist node_modules (
    echo 📦 Installation des dépendances...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ Erreur lors de l'installation des dépendances
        pause
        exit /b 1
    )
)

REM Nettoyer les processus Node.js existants
echo 🧹 Nettoyage des processus Node.js existants...
taskkill /F /IM node.exe >nul 2>&1

REM Attendre un peu
timeout /t 2 /nobreak >nul

REM Démarrer le serveur avec monitoring
echo 🚀 Démarrage du serveur avec monitoring...
echo 📊 Le serveur redémarrera automatiquement en cas de problème
echo 🛑 Appuyez sur Ctrl+C pour arrêter
echo.

node server-monitor.js

pause
