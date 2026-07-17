const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const { createBot, chooseCards, judgeSubmissions, thinkingDelay } = require('./bot');

const MAX_PLAYERS = 10;
const MAX_BOTS = 4;
const ROUND_REVEAL_MS = 3000;

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Load Cards
const cardsData = JSON.parse(fs.readFileSync('./cards.json', 'utf-8'));
let allBlackCards = cardsData.blackCards;
let allWhiteCards = cardsData.whiteCards;

// In-memory data store
const rooms = {}; 
/*
room format: {
  id: string,
  players: [ { id, name, score, hand: [] } ],
  blackCardsDeck: [],
  whiteCardsDeck: [],
  currentBlackCard: null,
  czarIndex: 0,
  state: 'lobby' | 'playing' | 'czar_picking',
  submissions: [ { playerId, cards: [] } ]
}
*/

function shuffle(array) {
  let currentIndex = array.length,  randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
}

function getSafeRoomData(room) {
  if (!room) return null;
  return {
    id: room.id,
    // hide hands from others
    players: room.players.map(p => ({
      id: p.id,
      name: p.name,
      score: p.score,
      isBot: !!p.isBot,
      blurb: p.blurb || null,
    })),
    currentBlackCard: room.currentBlackCard,
    czarId: room.players[room.czarIndex]?.id,
    state: room.state,
    submissions: room.state === 'czar_picking' 
      ? shuffle([...room.submissions]) // anonymize and shuffle
      : [],
    submissionCount: room.submissions.length
  };
}

function sendRoomUpdate(roomId) {
  const room = rooms[roomId];
  if (!room) return;
  const safeData = getSafeRoomData(room);
  
  // Send state to everyone
  io.to(roomId).emit('room_update', safeData);

  // Send private hands
  room.players.forEach(p => {
    io.to(p.id).emit('hand_update', p.hand);
  });
}

function dealCards(room) {
  room.players.forEach(p => {
    while (p.hand.length < 10 && room.whiteCardsDeck.length > 0) {
      p.hand.push(room.whiteCardsDeck.pop());
    }
  });
}

// Shared by the socket handler and the bots, so a bot plays by exactly the same
// rules a human does. Returns true if the submission was accepted.
function applySubmission(room, playerId, cardIndices) {
  if (!room || room.state !== 'playing' || !room.currentBlackCard) return false;

  const czarId = room.players[room.czarIndex]?.id;
  if (czarId === playerId) return false; // Czar can't submit

  const player = room.players.find(p => p.id === playerId);
  if (!player) return false;
  if (room.submissions.some(s => s.playerId === playerId)) return false;
  if (!Array.isArray(cardIndices) || cardIndices.length !== room.currentBlackCard.pick) return false;

  const unique = new Set(cardIndices);
  if (unique.size !== cardIndices.length) return false;
  if (cardIndices.some(i => !Number.isInteger(i) || i < 0 || i >= player.hand.length)) return false;

  const submittedCards = cardIndices.map(index => player.hand[index]);

  // Remove from hand (iterate backwards to avoid index shifting issues)
  const sortedIndices = [...cardIndices].sort((a, b) => b - a);
  for (const index of sortedIndices) {
    player.hand.splice(index, 1);
  }

  room.submissions.push({ playerId, cards: submittedCards });

  // Everyone except the Czar has played
  if (room.submissions.length === room.players.length - 1) {
    room.state = 'czar_picking';
  }
  return true;
}

function applyPickWinner(roomId, submission) {
  const room = rooms[roomId];
  if (!room || room.state !== 'czar_picking') return;

  const winnerPlayer = room.players.find(p => p.id === submission.playerId);
  if (winnerPlayer) {
    winnerPlayer.score += 1;
  }

  // Reset for next round
  room.submissions = [];
  room.czarIndex = (room.czarIndex + 1) % room.players.length;
  room.currentBlackCard = room.blackCardsDeck.pop();

  if (room.blackCardsDeck.length === 0) {
    room.blackCardsDeck = shuffle([...allBlackCards]);
  }
  if (room.whiteCardsDeck.length < room.players.length * 10) {
    room.whiteCardsDeck = shuffle([...allWhiteCards]);
  }

  dealCards(room);
  room.state = 'playing';

  io.to(roomId).emit('round_winner', {
    winnerName: winnerPlayer ? winnerPlayer.name : 'Unknown',
    winningCards: submission.cards,
  });

  // Hold the winner banner before revealing the next round.
  setTimeout(() => {
    sendRoomUpdate(roomId);
    scheduleBotTurns(roomId);
  }, ROUND_REVEAL_MS);
}

/**
 * Give every bot in the room a chance to act on the current state. Safe to call
 * repeatedly: `pendingAction` stops a bot being scheduled twice, and every
 * timeout re-reads the room before acting in case things moved on while it
 * was "thinking".
 */
function scheduleBotTurns(roomId) {
  const room = rooms[roomId];
  if (!room) return;

  const czarId = room.players[room.czarIndex]?.id;

  if (room.state === 'playing') {
    room.players.forEach(bot => {
      if (!bot.isBot || bot.id === czarId || bot.pendingAction) return;
      if (room.submissions.some(s => s.playerId === bot.id)) return;

      bot.pendingAction = true;
      setTimeout(() => {
        bot.pendingAction = false;
        const current = rooms[roomId];
        if (!current || current.state !== 'playing') return;
        if (!current.players.includes(bot)) return; // removed while thinking
        if (current.players[current.czarIndex]?.id === bot.id) return;

        const indices = chooseCards(bot, current.currentBlackCard, bot.hand);
        if (!indices.length) return;
        if (!applySubmission(current, bot.id, indices)) return;

        sendRoomUpdate(roomId);
        scheduleBotTurns(roomId); // state may now be czar_picking
      }, thinkingDelay());
    });
  }

  if (room.state === 'czar_picking') {
    const czar = room.players[room.czarIndex];
    if (!czar || !czar.isBot || czar.pendingAction) return;

    czar.pendingAction = true;
    setTimeout(() => {
      czar.pendingAction = false;
      const current = rooms[roomId];
      if (!current || current.state !== 'czar_picking') return;
      if (current.players[current.czarIndex]?.id !== czar.id) return;

      const choice = judgeSubmissions(czar, current.currentBlackCard, current.submissions);
      if (choice) applyPickWinner(roomId, choice);
    }, thinkingDelay(2400, 5200));
  }
}

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('create_room', (playerName, callback) => {
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    rooms[roomId] = {
      id: roomId,
      players: [{ id: socket.id, name: playerName, score: 0, hand: [] }],
      blackCardsDeck: shuffle([...allBlackCards]),
      whiteCardsDeck: shuffle([...allWhiteCards]),
      currentBlackCard: null,
      czarIndex: 0,
      state: 'lobby',
      submissions: []
    };
    
    socket.join(roomId);
    callback({ success: true, roomId });
    sendRoomUpdate(roomId);
  });

  socket.on('join_room', ({ roomId, playerName }, callback) => {
    const room = rooms[roomId];
    if (!room) {
      return callback({ success: false, message: 'Room not found' });
    }
    if (room.state !== 'lobby') {
       // If playing, they could still join but it's simpler to just let them in and deal cards
    }

    room.players.push({ id: socket.id, name: playerName, score: 0, hand: [] });
    if (room.state !== 'lobby') {
      dealCards(room); // deal immediately if joining late
    }

    socket.join(roomId);
    callback({ success: true, roomId });
    sendRoomUpdate(roomId);
  });

  socket.on('start_game', (roomId) => {
    const room = rooms[roomId];
    if (!room || room.players[0].id !== socket.id) return; // Only creator can start

    if (room.players.length < 2) return; // Need at least 2 players

    room.state = 'playing';
    room.czarIndex = 0;
    room.currentBlackCard = room.blackCardsDeck.pop();
    dealCards(room);

    sendRoomUpdate(roomId);
    scheduleBotTurns(roomId);
  });

  socket.on('add_bot', ({ roomId }, callback) => {
    const room = rooms[roomId];
    if (!room) return callback?.({ success: false, message: 'Room not found' });
    if (room.players[0]?.id !== socket.id) {
      return callback?.({ success: false, message: 'Only the host can add a computer' });
    }
    if (room.players.filter(p => p.isBot).length >= MAX_BOTS) {
      return callback?.({ success: false, message: 'Bot limit reached' });
    }
    if (room.players.length >= MAX_PLAYERS) {
      return callback?.({ success: false, message: 'Room is full' });
    }

    const bot = createBot(room.players.map(p => p.name));
    room.players.push(bot);
    if (room.state !== 'lobby') dealCards(room);

    callback?.({ success: true, name: bot.name });
    sendRoomUpdate(roomId);
    scheduleBotTurns(roomId);
  });

  socket.on('remove_bot', ({ roomId, botId }, callback) => {
    const room = rooms[roomId];
    if (!room) return callback?.({ success: false, message: 'Room not found' });
    if (room.players[0]?.id !== socket.id) {
      return callback?.({ success: false, message: 'Only the host can remove a computer' });
    }

    const index = room.players.findIndex(p => p.id === botId && p.isBot);
    if (index === -1) return callback?.({ success: false, message: 'Computer not found' });

    room.players.splice(index, 1);
    room.submissions = room.submissions.filter(s => s.playerId !== botId);
    if (room.czarIndex >= room.players.length) room.czarIndex = 0;

    callback?.({ success: true });
    sendRoomUpdate(roomId);
    scheduleBotTurns(roomId);
  });

  socket.on('submit_card', ({ roomId, cardIndices }) => { // cardIndices is array of indexes from hand
    const room = rooms[roomId];
    if (!applySubmission(room, socket.id, cardIndices)) return;

    sendRoomUpdate(roomId);
    scheduleBotTurns(roomId); // a bot Czar may now need to judge
  });

  socket.on('pick_winner', ({ roomId, submission }) => {
    const room = rooms[roomId];
    if (!room || room.state !== 'czar_picking') return;
    if (room.players[room.czarIndex]?.id !== socket.id) return; // Only czar can pick

    applyPickWinner(roomId, submission);
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    // Clean up rooms where player was present
    for (const roomId in rooms) {
      const room = rooms[roomId];
      const pIndex = room.players.findIndex(p => p.id === socket.id);
      if (pIndex !== -1) {
        room.players.splice(pIndex, 1);
        room.submissions = room.submissions.filter(s => s.playerId !== socket.id);

        // Bots alone can't hold a room open — without this, any room that ever
        // had a bot added would leak for the lifetime of the process.
        const humansLeft = room.players.some(p => !p.isBot);
        if (!humansLeft) {
          delete rooms[roomId];
          continue;
        }

        // Adjust czar index if necessary
        if (room.czarIndex >= room.players.length) {
          room.czarIndex = 0;
        }

        // The leaver may have been the last player everyone was waiting on.
        if (
          room.state === 'playing' &&
          room.currentBlackCard &&
          room.players.length > 1 &&
          room.submissions.length === room.players.length - 1
        ) {
          room.state = 'czar_picking';
        }

        sendRoomUpdate(roomId);
        scheduleBotTurns(roomId);
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
