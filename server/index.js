const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const fs = require('fs');

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

function getRoom(roomId) {
  return rooms[roomId];
}

function getSafeRoomData(room) {
  if (!room) return null;
  return {
    id: room.id,
    players: room.players.map(p => ({ id: p.id, name: p.name, score: p.score })), // hide hands from others
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
  });

  socket.on('submit_card', ({ roomId, cardIndices }) => { // cardIndices is array of indexes from hand
    const room = rooms[roomId];
    if (!room || room.state !== 'playing') return;

    const czarId = room.players[room.czarIndex]?.id;
    if (czarId === socket.id) return; // Czar can't submit

    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;

    // Check if already submitted
    if (room.submissions.some(s => s.playerId === socket.id)) return;

    // Check if correct number of cards
    if (cardIndices.length !== room.currentBlackCard.pick) return;

    // Extract cards
    const submittedCards = cardIndices.map(index => player.hand[index]);
    
    // Remove from hand (iterate backwards to avoid index shifting issues)
    const sortedIndices = [...cardIndices].sort((a,b) => b - a);
    for (const index of sortedIndices) {
      player.hand.splice(index, 1);
    }

    room.submissions.push({ playerId: socket.id, cards: submittedCards });

    // Check if all players have submitted
    if (room.submissions.length === room.players.length - 1) {
      room.state = 'czar_picking';
    }

    sendRoomUpdate(roomId);
  });

  socket.on('pick_winner', ({ roomId, submission }) => {
    const room = rooms[roomId];
    if (!room || room.state !== 'czar_picking') return;

    const czarId = room.players[room.czarIndex]?.id;
    if (czarId !== socket.id) return; // Only czar can pick

    // Find the winner
    const winnerPlayer = room.players.find(p => p.id === submission.playerId);
    if (winnerPlayer) {
      winnerPlayer.score += 1;
    }

    // Reset for next round
    room.submissions = [];
    room.czarIndex = (room.czarIndex + 1) % room.players.length;
    room.currentBlackCard = room.blackCardsDeck.pop();
    
    // Check if we need to reshuffle
    if (room.blackCardsDeck.length === 0) {
      room.blackCardsDeck = shuffle([...allBlackCards]);
    }
    if (room.whiteCardsDeck.length < room.players.length * 10) {
      room.whiteCardsDeck = shuffle([...allWhiteCards]); // Simple reshuffle all
    }

    dealCards(room);
    room.state = 'playing';

    // Broadcast winner
    io.to(roomId).emit('round_winner', { winnerName: winnerPlayer ? winnerPlayer.name : 'Unknown', winningCards: submission.cards });

    setTimeout(() => {
       sendRoomUpdate(roomId);
    }, 3000); // Wait 3 seconds before showing new round
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    // Clean up rooms where player was present
    for (const roomId in rooms) {
      const room = rooms[roomId];
      const pIndex = room.players.findIndex(p => p.id === socket.id);
      if (pIndex !== -1) {
        room.players.splice(pIndex, 1);
        if (room.players.length === 0) {
          delete rooms[roomId]; // delete empty room
        } else {
          // Adjust czar index if necessary
          if (room.czarIndex >= room.players.length) {
            room.czarIndex = 0;
          }
          sendRoomUpdate(roomId);
        }
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
