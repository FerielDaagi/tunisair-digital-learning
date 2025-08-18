@echo off
echo ========================================
echo   SYSTEME DE NOTIFICATIONS - TEST
echo ========================================
echo.

echo [1/4] Installation des dependances backend...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo ERREUR: Installation backend echouee
    pause
    exit /b 1
)

echo.
echo [2/4] Installation des dependances frontend...
cd ..\frontend
call npm install
if %errorlevel% neq 0 (
    echo ERREUR: Installation frontend echouee
    pause
    exit /b 1
)

echo.
echo [3/4] Demarrage du serveur backend...
cd ..\backend
start "Backend Server" cmd /k "npm run dev"

echo.
echo [4/4] Demarrage du serveur frontend...
cd ..\frontend
start "Frontend Server" cmd /k "npm start"

echo.
echo ========================================
echo   DEMARRAGE TERMINE !
echo ========================================
echo.
echo Instructions:
echo 1. Attendez que les serveurs soient demarres
echo 2. Ouvrez http://localhost:3000 dans votre navigateur
echo 3. Suivez le guide de test: GUIDE_TEST_NOTIFICATIONS.md
echo.
echo Pour tester automatiquement:
echo node test-notifications.js
echo.
pause
