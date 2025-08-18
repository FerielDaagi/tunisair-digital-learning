#!/bin/bash

echo "========================================"
echo "  SYSTEME DE NOTIFICATIONS - TEST"
echo "========================================"
echo

echo "[1/4] Installation des dependances backend..."
cd backend
npm install
if [ $? -ne 0 ]; then
    echo "ERREUR: Installation backend echouee"
    exit 1
fi

echo
echo "[2/4] Installation des dependances frontend..."
cd ../frontend
npm install
if [ $? -ne 0 ]; then
    echo "ERREUR: Installation frontend echouee"
    exit 1
fi

echo
echo "[3/4] Demarrage du serveur backend..."
cd ../backend
gnome-terminal --title="Backend Server" -- bash -c "npm run dev; exec bash" &
# Alternative pour macOS:
# osascript -e 'tell app "Terminal" to do script "cd '$(pwd)' && npm run dev"'

echo
echo "[4/4] Demarrage du serveur frontend..."
cd ../frontend
gnome-terminal --title="Frontend Server" -- bash -c "npm start; exec bash" &
# Alternative pour macOS:
# osascript -e 'tell app "Terminal" to do script "cd '$(pwd)' && npm start"'

echo
echo "========================================"
echo "  DEMARRAGE TERMINE !"
echo "========================================"
echo
echo "Instructions:"
echo "1. Attendez que les serveurs soient demarres"
echo "2. Ouvrez http://localhost:3000 dans votre navigateur"
echo "3. Suivez le guide de test: GUIDE_TEST_NOTIFICATIONS.md"
echo
echo "Pour tester automatiquement:"
echo "node test-notifications.js"
echo
