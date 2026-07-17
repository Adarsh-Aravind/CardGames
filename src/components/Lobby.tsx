import { useState, useEffect } from 'react';
import { useGameStore } from '../store/useGameStore';
import { Users, Moon, Sun } from 'lucide-react';
import { Card } from './Card';

export function Lobby() {
  const { playerName, setPlayerName, createRoom, joinRoom, isDarkMode, toggleDarkMode } = useGameStore();
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomFromUrl = params.get('room');
    if (roomFromUrl) {
      setRoomCode(roomFromUrl.toUpperCase());
      setInviteCode(roomFromUrl.toUpperCase());
    }
  }, []);

  const handleCreate = async () => {
    if (!playerName) return setError('Please enter a name');
    setError('');
    setIsLoading(true);
    try {
      await createRoom(playerName);
    } catch (e) {
      setError('Failed to create room');
    }
    setIsLoading(false);
  };

  const handleJoin = async () => {
    if (!playerName) return setError('Please enter a name');
    if (!roomCode || roomCode.length !== 6) return setError('Please enter a valid 6-character room code');
    setError('');
    setIsLoading(true);
    try {
      const success = await joinRoom(roomCode.toUpperCase(), playerName);
      if (!success) setError('Room not found');
    } catch (e) {
      setError('Failed to join room');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 font-sans relative overflow-hidden">
      
      {/* Dark Mode Toggle */}
      <button 
        onClick={toggleDarkMode}
        className="absolute top-6 right-6 z-20 p-3 bg-white dark:bg-black text-black dark:text-white border-2 border-black dark:border-white rounded-full shadow-lg hover:scale-110 transition-transform"
      >
        {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
      </button>

      {/* Background Floating Elements */}
      <div className="absolute inset-0 pointer-events-none opacity-20 dark:opacity-30">
        <div className="absolute top-10 left-10 rotate-12 animate-float [animation-delay:-1s] scale-75 sm:scale-100">
          <Card type="black" text="What's my secret power?" />
        </div>
        <div className="absolute bottom-20 right-20 -rotate-12 animate-float scale-75 sm:scale-100">
          <Card type="white" text="A fart so powerful that it wakes the giants from their thousand-year slumber." />
        </div>
      </div>

      <div className="max-w-md w-full relative z-10 animate-fade-in-up">
        <div className="bg-black dark:bg-white text-white dark:text-black p-6 sm:p-8 mb-6 sm:mb-8 shadow-2xl rounded transform hover:scale-[1.02] transition-transform">
          <h1 className="text-3xl sm:text-4xl font-black mb-2 uppercase tracking-tighter leading-none">Cards<br/>Against<br/>Humanity</h1>
          <p className="font-bold opacity-80 mt-4 text-xs sm:text-sm">A party game for horrible people.</p>
        </div>

        <div className="bg-white dark:bg-neutral-800 text-black dark:text-white p-6 sm:p-8 rounded shadow-xl border-4 border-black dark:border-neutral-600 transition-colors">
          {inviteCode && (
            <div className="mb-6 p-4 bg-yellow-100 border-2 border-yellow-400 rounded-lg text-center animate-pulse">
              <p className="font-bold">You've been invited to join room <strong>{inviteCode}</strong>!</p>
              <p className="text-sm mt-1">Enter your name below to jump in.</p>
            </div>
          )}

          {error && <div className="mb-4 text-red-600 font-bold bg-red-100 p-2 rounded">{error}</div>}
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold uppercase tracking-wider mb-2">Your Name</label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="e.g. Nasty Nick"
                className="w-full border-2 border-black dark:border-neutral-500 bg-transparent p-3 font-bold text-lg rounded focus:ring-2 focus:ring-black dark:focus:ring-white outline-none transition-all placeholder:text-neutral-400"
                maxLength={20}
              />
            </div>

            <hr className="border-black/10 dark:border-white/10 border-2" />

            <div className="flex flex-col gap-4">
              <button
                onClick={handleCreate}
                disabled={isLoading}
                className="w-full bg-black dark:bg-white text-white dark:text-black font-bold py-4 rounded flex items-center justify-center gap-2 hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors uppercase tracking-wider"
              >
                <Users size={20} />
                Create New Game
              </button>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="CODE"
                  className="w-full sm:w-1/3 border-2 border-black dark:border-neutral-500 bg-transparent p-3 font-bold text-lg text-center rounded focus:ring-2 focus:ring-black dark:focus:ring-white outline-none uppercase placeholder:text-neutral-400"
                  maxLength={6}
                />
                <button
                  onClick={handleJoin}
                  disabled={isLoading}
                  className={`w-full sm:w-2/3 border-4 border-black dark:border-white bg-white dark:bg-black text-black dark:text-white font-bold py-3 rounded flex items-center justify-center gap-2 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors uppercase tracking-wider ${inviteCode ? 'animate-bounce' : ''}`}
                >
                  Join Game
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
