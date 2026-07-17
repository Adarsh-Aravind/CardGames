# Cards Against Humanity - Web Edition

A multiplayer "Cards Against Humanity" style party game built with React, Vite, Tailwind CSS, Node.js, and Socket.io.

## Prerequisites

- Node.js (v18 or higher recommended)
- npm (Node Package Manager)

## How to Run Manually

This project consists of two parts: a backend server (`server/`) and a frontend client (root directory). You will need to run **both** for the game to work.

### 1. Start the Backend Server

The backend handles the real-time game state, card shuffling, and player syncing via Socket.io.

Open a terminal, navigate to the project root, and run:

```bash
cd server
npm install
node index.js
```
*You should see a message saying "Server listening on port 3001". Keep this terminal running.*

### 2. Start the Frontend Client

The frontend is a Vite + React application.

Open a **new, separate terminal** in the project root and run:

```bash
npm install
npm run dev
```

*This will start the Vite development server, usually at `http://localhost:5173/`.*

## How to Play

1. Open your browser and navigate to `http://localhost:5173/`.
2. **Accept the 18+ Warning** to proceed to the Lobby.
3. Enter your player name.
4. **To Create a Game**: Click "Create New Game". Note the 6-character Room Code at the top left, or click the "Copy Invite Link" button to send it to friends.
5. **To Join a Game**: Your friends can paste the invite link in their browser (which auto-fills the room code), or they can type the Room Code manually in the Lobby.
6. Once everyone is in, the host clicks **START GAME**.
7. The game will automatically assign a Card Czar, deal white cards, and keep score!

## Customizing Cards

You can add, edit, or remove cards by editing the `server/cards.json` file. 
- `blackCards`: Must have a `text` (use `_______` for fill-in-the-blanks) and a `pick` value (usually 1 or 2).
- `whiteCards`: A simple array of string answers.
