# CardGames

A real-time multiplayer party card game in the style of Cards Against Humanity, playable in the browser. Create a room, share the invite link, and play with up to 10 friends, or fill the table with computer players that pick and judge cards on their own.

> Contains adult humour. Players must accept an 18+ notice before entering the lobby.

## Features

- **Private rooms:** each game gets a 6-character room code and a one-click invite link that pre-fills the code
- **Up to 10 players** per room, with live updates for every player through Socket.IO
- **Full round flow:** a rotating Card Czar, hands topped up to 10 white cards, fill-in-the-blank prompts that ask for one or two answers, and a scoreboard
- **Offline bots:** add computer players with their own personas (such as *Deadpan Dave* and *Chaos Gremlin*). They score answers with simple humour heuristics, so no API key or network service is needed, and a bot can also be the Czar
- **Editable deck:** all prompts and answers live in one JSON file

## Tech stack

| Part | Built with |
| ---- | ---------- |
| Client | React 19, TypeScript, Vite, Tailwind CSS, Zustand, Socket.IO client |
| Server | Node.js, Express, Socket.IO |

## Getting started

Requires Node.js 18 or newer. The game has two parts, and both must be running.

### Quick start (Windows)

Double-click `start-game.bat`. It installs dependencies and opens the server and client in separate windows.

### Manual start

1. Start the server (port `3001`):

   ```bash
   cd server
   npm install
   npm start
   ```

2. In a second terminal, start the client from the project root:

   ```bash
   npm install
   npm run dev
   ```

3. Open `http://localhost:5173`.

## How to play

1. Accept the 18+ notice and enter your name.
2. Click **Create New Game**, then share the room code or the **Copy Invite Link** button. Friends can open the link or type the code in the lobby.
3. Optionally add bots to fill out the table.
4. The host clicks **START GAME**.
5. Each round, the Card Czar reveals a black prompt card. Everyone else plays white cards from their hand to complete it.
6. The Czar picks the funniest answer, and its player scores a point. The Czar role then moves to the next player.

## Customising the cards

Edit `server/cards.json`:

- `blackCards`: objects with `text` (use `_______` for each blank) and `pick` (how many white cards to play, usually 1 or 2)
- `whiteCards`: an array of answer strings

Restart the server after editing.

## Deploying

The client can be published to GitHub Pages with `npm run deploy`. Host the server anywhere that supports WebSockets, and set `VITE_BACKEND_URL` to its address when building the client (it defaults to `http://localhost:3001`).

## Project structure

```text
src/
  components/     Lobby, game board, cards, boot screen, 18+ notice
  store/          Zustand store and Socket.IO connection
server/
  index.js        Rooms, dealing, rounds, scoring and Socket.IO events
  bot.js          Computer players: personas, card choice and judging
  cards.json      The deck
start-game.bat    Starts server and client on Windows
```
