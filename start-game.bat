@echo off
echo Starting Cards Against Humanity...

echo Starting Backend Server...
start "CAH Backend" cmd /c "cd server && npm install && node index.js"

echo Starting Frontend Server...
start "CAH Frontend" cmd /c "npm install && npm run dev"

echo Both servers are starting in separate terminal windows!
echo It may take a few seconds to install any missing dependencies and start.
echo You can play the game by opening your browser to: http://localhost:5173/
echo.
pause
