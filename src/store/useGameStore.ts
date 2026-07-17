import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export type Player = {
  id: string;
  name: string;
  score: number;
};

export type BlackCard = {
  text: string;
  pick: number;
};

export type Room = {
  id: string;
  players: Player[];
  currentBlackCard: BlackCard | null;
  czarId: string;
  state: 'lobby' | 'playing' | 'czar_picking';
  submissions: any[];
  submissionCount: number;
};

type GameState = {
  socket: Socket | null;
  playerName: string;
  room: Room | null;
  hand: string[];
  is18PlusAccepted: boolean;
  isDarkMode: boolean;
  roundWinner: { winnerName: string; winningCards: string[] } | null;
  
  acceptWarning: () => void;
  toggleDarkMode: () => void;
  setPlayerName: (name: string) => void;
  initSocket: () => void;
  createRoom: (name: string) => Promise<string>;
  joinRoom: (roomId: string, name: string) => Promise<boolean>;
  startGame: () => void;
  submitCard: (cardIndices: number[]) => void;
  pickWinner: (submission: any) => void;
};

export const useGameStore = create<GameState>((set, get) => ({
  socket: null,
  playerName: '',
  room: null,
  hand: [],
  is18PlusAccepted: false,
  isDarkMode: false,
  roundWinner: null,

  acceptWarning: () => set({ is18PlusAccepted: true }),
  
  toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),

  setPlayerName: (name) => set({ playerName: name }),

  initSocket: () => {
    const socket = io(SOCKET_URL);
    
    socket.on('room_update', (roomData) => {
      set({ room: roomData });
    });

    socket.on('hand_update', (handData) => {
      set({ hand: handData });
    });

    socket.on('round_winner', (data) => {
      set({ roundWinner: data });
      setTimeout(() => set({ roundWinner: null }), 3000);
    });

    set({ socket });
  },

  createRoom: (name) => {
    return new Promise((resolve, reject) => {
      const { socket } = get();
      if (!socket) return reject('Socket not initialized');
      
      socket.emit('create_room', name, (response: any) => {
        if (response.success) resolve(response.roomId);
        else reject();
      });
    });
  },

  joinRoom: (roomId, name) => {
    return new Promise((resolve) => {
      const { socket } = get();
      if (!socket) return resolve(false);

      socket.emit('join_room', { roomId, playerName: name }, (response: any) => {
        resolve(response.success);
      });
    });
  },

  startGame: () => {
    const { socket, room } = get();
    if (socket && room) {
      socket.emit('start_game', room.id);
    }
  },

  submitCard: (cardIndices) => {
    const { socket, room } = get();
    if (socket && room) {
      socket.emit('submit_card', { roomId: room.id, cardIndices });
    }
  },

  pickWinner: (submission) => {
    const { socket, room } = get();
    if (socket && room) {
      socket.emit('pick_winner', { roomId: room.id, submission });
    }
  }
}));
