import { useState, useEffect } from 'react';
import { useGameStore } from '../store/useGameStore';
import { Users, Moon, Sun, Sparkles, LogIn, Info, X } from 'lucide-react';
import { Card } from './Card';

export function Lobby() {
  const { playerName, setPlayerName, createRoom, joinRoom, isDarkMode, toggleDarkMode, notice, dismissNotice } = useGameStore();
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
    } catch {
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
    } catch {
      setError('Failed to join room');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 font-sans relative overflow-hidden">
      <button
        onClick={toggleDarkMode}
        aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        className="absolute top-6 right-6 z-20 p-3 rounded-full panel text-navy dark:text-mint hover:scale-110 hover:rotate-12 transition-transform"
      >
        {isDarkMode ? <Sun size={22} /> : <Moon size={22} />}
      </button>

      {/* Ambient cards drifting behind the panel */}
      <div className="absolute inset-0 pointer-events-none opacity-30 dark:opacity-40" aria-hidden="true">
        <div className="absolute top-10 left-4 sm:left-16 rotate-12 animate-float [animation-delay:-1s] scale-75 sm:scale-100">
          <Card type="black" text="What's my secret power?" />
        </div>
        <div className="absolute bottom-16 right-4 sm:right-20 -rotate-12 animate-float scale-75 sm:scale-100">
          <Card type="white" text="A fart so powerful that it wakes the giants from their thousand-year slumber." />
        </div>
      </div>

      <div className="max-w-md w-full relative z-10 animate-fade-in-up">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <Sparkles className="text-jade animate-float" size={26} />
            <h1 className="text-5xl sm:text-6xl font-black tracking-tighter bg-gradient-to-r from-teal via-jade to-spring bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient-pan">
              Shuffle
            </h1>
          </div>
          <p className="font-bold text-sm text-navy/60 dark:text-mint/50">
            Card games with your people.
          </p>
          <div className="mt-4 inline-block rounded-full border-2 border-jade/40 bg-jade/10 px-4 py-1.5">
            <span className="text-xs font-black uppercase tracking-[0.15em] text-teal dark:text-spring">
              Now playing · Cards Against Humanity
            </span>
          </div>
        </div>

        <div className="panel p-6 sm:p-8">
          {notice && (
            <div className="mb-6 p-4 rounded-xl border-2 border-teal/40 bg-teal/10 flex items-start gap-3 animate-pop-in">
              <Info className="text-teal dark:text-jade flex-shrink-0 mt-0.5" size={20} />
              <p className="flex-1 text-sm font-bold text-navy dark:text-mint leading-relaxed">
                {notice}
              </p>
              <button
                onClick={dismissNotice}
                aria-label="Dismiss"
                className="p-1 rounded-lg text-navy/40 dark:text-mint/40 hover:text-navy dark:hover:text-mint transition-colors flex-shrink-0"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {inviteCode && (
            <div className="mb-6 p-4 rounded-xl border-2 border-spring/50 bg-spring/15 text-center animate-pop-in">
              <p className="font-black text-navy dark:text-mint">
                You've been invited to room <span className="text-teal dark:text-spring">{inviteCode}</span>
              </p>
              <p className="text-sm mt-1 font-medium text-navy/70 dark:text-mint/60">
                Enter your name below to jump in.
              </p>
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-xl border-2 border-red-400/50 bg-red-500/10 p-3 font-bold text-red-600 dark:text-red-300 animate-pop-in">
              {error}
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-xs font-black uppercase tracking-[0.15em] mb-2 text-navy/60 dark:text-mint/50">
                Your Name
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="e.g. Nasty Nick"
                className="field"
                maxLength={20}
              />
            </div>

            <div className="flex flex-col gap-4">
              <button
                onClick={handleCreate}
                disabled={isLoading}
                className="btn-primary w-full py-4 flex items-center justify-center gap-2"
              >
                <Users size={20} />
                Create New Game
              </button>

              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-navy/10 dark:bg-mint/10" />
                <span className="text-xs font-black uppercase tracking-widest text-navy/40 dark:text-mint/30">
                  or
                </span>
                <div className="h-px flex-1 bg-navy/10 dark:bg-mint/10" />
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="CODE"
                  className="field sm:w-1/3 text-center uppercase tracking-[0.2em]"
                  maxLength={6}
                />
                <button
                  onClick={handleJoin}
                  disabled={isLoading}
                  className={`btn-ghost w-full sm:w-2/3 py-3 flex items-center justify-center gap-2 ${
                    inviteCode ? 'animate-glow-pulse border-spring/60' : ''
                  }`}
                >
                  <LogIn size={18} />
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
