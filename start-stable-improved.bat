@echo off
echo ========================================
echo    E-LEARNING SERVER - DEMARRAGE STABLE
echo ========================================
echo.

echo 🧹 Nettoyage des processus Node.js existants...
taskkill /F /IM node.exe >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Processus Node.js nettoyés
) else (
    echo ℹ️ Aucun processus Node.js à nettoyer
)

echo.
echo ⏳ Attente de libération des ports...
timeout /t 3 /nobreak >nul

echo.
echo 🚀 Démarrage du serveur stable...
cd backend
node start-stable.js

echo.
echo 🛑 Serveur arrêté
pause
