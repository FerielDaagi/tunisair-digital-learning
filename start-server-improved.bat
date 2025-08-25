@echo off
chcp 65001 >nul
title E-Learning Server Manager

echo.
echo ========================================
echo    E-LEARNING SERVER MANAGER
echo ========================================
echo.

:: Vérifier si Node.js est installé
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js n'est pas installé ou n'est pas dans le PATH
    echo 💡 Veuillez installer Node.js depuis https://nodejs.org/
    pause
    exit /b 1
)

:: Vérifier si npm est installé
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm n'est pas installé
    pause
    exit /b 1
)

:: Aller dans le dossier backend
cd /d "%~dp0backend"
if errorlevel 1 (
    echo ❌ Impossible d'accéder au dossier backend
    pause
    exit /b 1
)

:: Vérifier si package.json existe
if not exist "package.json" (
    echo ❌ package.json introuvable dans le dossier backend
    pause
    exit /b 1
)

:: Installer les dépendances si nécessaire
if not exist "node_modules" (
    echo 📦 Installation des dépendances...
    npm install
    if errorlevel 1 (
        echo ❌ Erreur lors de l'installation des dépendances
        pause
        exit /b 1
    )
)

:: Vérifier si le fichier .env existe
if not exist ".env" (
    echo ⚠️  Fichier .env introuvable
    echo 💡 Création d'un fichier .env par défaut...
    (
        echo MONGODB_URI=mongodb+srv://ferieldaagi:ferieldaagi@cluster0.kr9ge9o.mongodb.net/elearning?retryWrites=true^&w=majority^&appName=Cluster0
        echo JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
        echo PORT=5000
        echo FRONTEND_URL=http://localhost:3000
    ) > .env
    echo ✅ Fichier .env créé
)

:: Arrêter les processus Node.js existants
echo 🛑 Arrêt des processus Node.js existants...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

:: Vérifier si le port 5000 est libre
echo 🔍 Vérification du port 5000...
netstat -ano | findstr :5000 >nul
if not errorlevel 1 (
    echo ⚠️  Le port 5000 est déjà utilisé
    echo 💡 Tentative de libération du port...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000') do (
        taskkill /F /PID %%a >nul 2>&1
    )
    timeout /t 3 /nobreak >nul
)

:: Démarrer le serveur avec le gestionnaire amélioré
echo 🚀 Démarrage du serveur avec gestionnaire amélioré...
echo.
echo 📊 Monitoring activé:
echo    - Redémarrage automatique en cas d'erreur
echo    - Gestion des connexions
echo    - Monitoring de santé
echo    - Logs détaillés
echo.

node start-server.js

:: En cas d'arrêt inattendu
echo.
echo ❌ Le serveur s'est arrêté de manière inattendue
echo 💡 Vérifiez les logs ci-dessus pour plus d'informations
echo.
pause

