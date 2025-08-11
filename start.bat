@echo off
echo Starting E-Learning Platform...
echo.

echo Installing backend dependencies...
cd backend
npm install
echo.

echo Installing frontend dependencies...
cd ../frontend
npm install
echo.

echo Starting backend server...
start "Backend Server" cmd /k "cd backend && npm run dev"

echo Starting frontend development server...
start "Frontend Server" cmd /k "cd frontend && npm start"

echo.
echo E-Learning Platform is starting up!
echo Backend will be available at: http://localhost:5000
echo Frontend will be available at: http://localhost:3000
echo.
echo Demo credentials:
echo Email: admin@example.com
echo Password: password123
echo.
pause 