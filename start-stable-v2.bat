@echo off
echo 🚀 Démarrage ultra-stable du serveur E-Learning...
echo.

cd /d "%~dp0\backend"

echo 📁 Répertoire de travail: %CD%
echo.

echo 🧹 Nettoyage des processus Node.js existants...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 3 /nobreak >nul

echo.
echo 🔄 Démarrage du serveur stable...
echo.

node start-stable-v2.js

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Erreur lors du démarrage du serveur
    echo 💡 Vérifiez les logs pour plus d'informations
    pause
    exit /b 1
)

echo.
echo ✅ Serveur arrêté proprement
pause
