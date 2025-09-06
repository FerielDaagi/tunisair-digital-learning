@echo off
echo 🧪 Test d'upload avec curl
echo =========================

echo.
echo 📋 Test 1: Upload simple avec fichier
echo.

REM Créer un fichier de test
echo "Contenu de test" > test-file.txt

REM Test avec le serveur de diagnostic
curl -X POST ^
  -F "title=Test Lesson" ^
  -F "description=Description de test" ^
  -F "type=file" ^
  -F "content=Contenu de test" ^
  -F "attachments=@test-file.txt" ^
  http://localhost:5000/api/lessons/module/test-module-id

echo.
echo.
echo 📋 Test 2: Upload avec urlencoded
echo.

curl -X POST ^
  -F "title=Test Lesson" ^
  -F "description=Description de test" ^
  -F "type=file" ^
  -F "content=Contenu de test" ^
  -F "attachments=@test-file.txt" ^
  http://localhost:5000/api/lessons/module/test-module-id

echo.
echo.
echo 📋 Test 3: Upload avec json + urlencoded
echo.

curl -X POST ^
  -F "title=Test Lesson" ^
  -F "description=Description de test" ^
  -F "type=file" ^
  -F "content=Contenu de test" ^
  -F "attachments=@test-file.txt" ^
  http://localhost:5000/api/lessons/module/test-module-id

echo.
echo.
echo 🧹 Nettoyage
del test-file.txt

echo.
echo ✅ Tests terminés!
pause
