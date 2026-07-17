import { useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { Card } from './Card';
import { Trophy, Crown, Check, Copy, CheckCircle2, Play, Bot, Plus, X, LogOut } from 'lucide-react';

export function GameBoard() {
  const { room, hand, socket, submitCard, pickWinner, roundWinner, addBot, removeBot, leaveRoom } = useGameStore();
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [copied, setCopied] = useState(false);
  const [addingBot, setAddingBot] = useState(false);
  const [botError, setBotError] = useState('');
  const [confirmingLeave, setConfirmingLeave] = useState(false);

  if (!room || !socket) return null;

  const isCzar = room.czarId === socket.id;
  const isHost = room.hostId === socket.id;
  const botCount = room.players.filter(p => p.isBot).length;

  const handleAddBot = async () => {
    setBotError('');
    setAddingBot(true);
    const result = await addBot();
    if (!result.success) setBotError(result.message || 'Could not add a computer');
    setAddingBot(false);
  };

  const isPlaying = room.state === 'playing';
  const isCzarPicking = room.state === 'czar_picking';

  const hasSubmitted = room.submissions.some((s: any) => s.playerId === socket.id);
  const canSubmit = isPlaying && !isCzar && !hasSubmitted && selectedCards.length === room.currentBlackCard?.pick;

  const handleCardClick = (index: number) => {
    if (!isPlaying || isCzar || hasSubmitted) return;

    if (selectedCards.includes(index)) {
      setSelectedCards(selectedCards.filter(i => i !== index));
    } else {
      if (selectedCards.length < (room.currentBlackCard?.pick || 1)) {
        setSelectedCards([...selectedCards, index]);
      } else {
        // Replace last selected if already at max
        setSelectedCards([...selectedCards.slice(0, -1), index]);
      }
    }
  };

  const handleSubmit = () => {
    if (canSubmit) {
      submitCard(selectedCards);
      setSelectedCards([]);
    }
  };

  const handleCopyLink = () => {
    const link = new URL(`${import.meta.env.BASE_URL}?room=${room.id}`, window.location.origin).href;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="min-h-screen p-4 sm:p-8 flex flex-col font-sans">
      {confirmingLeave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-sm animate-fade-in-up">
          <div className="panel p-6 max-w-sm w-full animate-pop-in">
            <h3 className="text-xl font-black text-navy dark:text-mint mb-2">
              {isHost ? 'End the game?' : 'Leave the game?'}
            </h3>
            <p className="text-sm font-medium text-navy/70 dark:text-mint/60 leading-relaxed mb-5">
              {isHost
                ? 'You are the host — leaving closes the room for everyone.'
                : 'You can rejoin with the room code as long as the game is still running.'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmingLeave(false)}
                className="btn-ghost flex-1 py-2.5"
              >
                Stay
              </button>
              <button
                onClick={leaveRoom}
                className="flex-1 py-2.5 rounded-xl font-black bg-red-500 text-white hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
              >
                <LogOut size={18} />
                {isHost ? 'End Game' : 'Leave'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-8 animate-fade-in-up">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center w-full md:w-auto">
          <div className="panel px-5 py-2.5 font-black tracking-wider flex-shrink-0 text-navy dark:text-mint">
            <span className="text-xs uppercase tracking-[0.2em] opacity-50">Room</span>
            <span className="text-xl ml-2 text-teal dark:text-spring">{room.id}</span>
          </div>
          <button
            onClick={handleCopyLink}
            className="btn-ghost px-4 py-2.5 flex items-center justify-center gap-2 w-full sm:w-auto flex-shrink-0 text-sm"
          >
            {copied ? <CheckCircle2 size={18} className="text-jade" /> : <Copy size={18} />}
            {copied ? 'Copied!' : 'Copy Invite Link'}
          </button>
          <button
            onClick={() => setConfirmingLeave(true)}
            className="btn-ghost px-4 py-2.5 flex items-center justify-center gap-2 w-full sm:w-auto flex-shrink-0 text-sm border-red-400/40 text-red-500 dark:text-red-400 hover:bg-red-500/10"
          >
            <LogOut size={18} />
            {isHost ? 'End Game' : 'Leave'}
          </button>
        </div>

        {/* Scoreboard */}
        <div className="panel p-3 sm:p-4 flex gap-4 sm:gap-6 w-full md:w-auto overflow-x-auto hide-scrollbar">
          {room.players.map(p => (
            <div key={p.id} className="flex flex-col items-center flex-shrink-0">
              <span className="font-bold flex items-center gap-1 text-sm text-navy dark:text-mint whitespace-nowrap">
                {p.isBot && <Bot size={13} className="text-jade" />}
                {p.name}
                {p.id === room.czarId && <Crown size={14} className="text-spring animate-float" />}
              </span>
              <span className="text-2xl font-black text-teal dark:text-spring tabular-nums">{p.score}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main play area */}
      <div className="flex-1 flex flex-col items-center">
        {room.state === 'lobby' ? (
          <div className="w-full max-w-lg animate-fade-in-up mt-12">
            <h2 className="text-2xl sm:text-3xl font-black mb-2 flex items-center justify-center gap-2 text-navy dark:text-mint">
              Waiting for players
              <span className="flex space-x-1">
                <span className="w-2 h-2 bg-jade rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-2 h-2 bg-jade rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-2 h-2 bg-jade rounded-full animate-bounce" />
              </span>
            </h2>
            <p className="font-medium text-navy/60 dark:text-mint/50 mb-6 text-center">
              Share the invite link to bring people in.
            </p>

            {/* Who's here */}
            <div className="panel p-4 mb-4">
              <ul className="divide-y divide-navy/10 dark:divide-mint/10">
                {room.players.map((p, i) => (
                  <li key={p.id} className="flex items-center justify-between py-2.5 animate-pop-in" style={{ animationDelay: `${i * 0.05}s` }}>
                    <div className="flex items-center gap-2.5 min-w-0">
                      {p.isBot
                        ? <Bot size={18} className="text-jade flex-shrink-0" />
                        : <div className="w-2 h-2 rounded-full bg-spring flex-shrink-0" />}
                      <div className="min-w-0">
                        <span className="font-black text-navy dark:text-mint truncate block">
                          {p.name}
                          {p.id === room.hostId && <span className="ml-2 text-[10px] font-black uppercase tracking-widest text-teal dark:text-spring">Host</span>}
                        </span>
                        {p.blurb && (
                          <span className="text-xs font-medium text-navy/50 dark:text-mint/40">{p.blurb}</span>
                        )}
                      </div>
                    </div>
                    {p.isBot && isHost && (
                      <button
                        onClick={() => removeBot(p.id)}
                        aria-label={`Remove ${p.name}`}
                        className="p-1.5 rounded-lg text-navy/40 dark:text-mint/40 hover:text-red-500 hover:bg-red-500/10 transition-colors flex-shrink-0"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {/* The nudge: two players means the Czar picks from a single card. */}
            {isHost && room.players.length < 3 && (
              <div className="mb-4 p-4 rounded-xl border-2 border-spring/50 bg-spring/10 animate-pop-in">
                <div className="flex gap-3">
                  <Bot className="text-teal dark:text-spring flex-shrink-0 mt-0.5 animate-float" size={22} />
                  <div className="min-w-0">
                    <p className="font-black text-navy dark:text-mint text-sm uppercase tracking-wide">
                      Only {room.players.length}? Add a computer.
                    </p>
                    <p className="mt-1.5 text-sm font-medium text-navy/70 dark:text-mint/60 leading-relaxed">
                      With two players the Czar only ever has one card to choose
                      from — there's no real contest. A computer player gives you
                      something to actually beat.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {botError && (
              <div className="mb-4 rounded-xl border-2 border-red-400/50 bg-red-500/10 p-3 font-bold text-sm text-red-600 dark:text-red-300 animate-pop-in">
                {botError}
              </div>
            )}

            {isHost && (
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleAddBot}
                  disabled={addingBot || botCount >= 4}
                  className={`btn-ghost py-3 px-5 flex items-center justify-center gap-2 flex-shrink-0 ${
                    room.players.length < 3 ? 'border-spring/60 animate-glow-pulse' : ''
                  }`}
                >
                  <Plus size={18} /> {addingBot ? 'Adding…' : 'Add Computer'}
                </button>
                <button
                  onClick={() => socket.emit('start_game', room.id)}
                  disabled={room.players.length < 2}
                  className="btn-primary text-lg py-3 px-8 flex-1 inline-flex items-center justify-center gap-2"
                >
                  <Play size={20} /> Start Game
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col w-full max-w-6xl">
            {/* Status banner */}
            <div className="text-center mb-8 min-h-12">
              {roundWinner ? (
                <div className="inline-flex items-center gap-2 bg-spring text-navy px-6 py-2.5 rounded-full font-black text-lg sm:text-xl shadow-card animate-pop-in">
                  <Trophy size={22} />
                  {roundWinner.winnerName} won this round!
                </div>
              ) : (
                <h2 className="text-xl sm:text-2xl font-black text-navy dark:text-mint">
                  {isCzar
                    ? (isPlaying ? 'You are the Card Czar. Waiting for submissions…' : 'Choose the best card!')
                    : (isPlaying
                        ? (hasSubmitted ? 'Waiting for others…' : `Play ${room.currentBlackCard?.pick} card(s)`)
                        : 'The Card Czar is choosing…')}
                </h2>
              )}
            </div>

            {/* Board */}
            <div className="flex flex-wrap justify-center gap-6 sm:gap-8 mb-16 p-6 sm:p-8 rounded-3xl border-2 border-dashed border-teal/30 dark:border-mint/15 bg-white/30 dark:bg-white/[0.03] backdrop-blur-sm min-h-[400px]">
              {room.currentBlackCard && (
                <div className="z-10 animate-deal">
                  <Card text={room.currentBlackCard.text} type="black" pick={room.currentBlackCard.pick} />
                </div>
              )}

              {isCzarPicking ? (
                room.submissions.map((sub, i) => (
                  <div
                    key={i}
                    className="flex gap-2 relative group cursor-pointer animate-deal"
                    style={{ animationDelay: `${i * 0.08}s` }}
                    onClick={() => isCzar && pickWinner(sub)}
                  >
                    {sub.cards.map((cText: string, j: number) => (
                      <Card key={j} text={cText} type="white" />
                    ))}
                    {isCzar && (
                      <div className="absolute inset-0 bg-navy/20 hidden group-hover:flex items-center justify-center rounded-2xl">
                        <div className="bg-spring text-navy px-4 py-2 font-black rounded-xl shadow-card uppercase tracking-wider animate-pop-in">
                          Pick This
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                Array.from({ length: room.submissionCount }).map((_, i) => (
                  <div key={i} className="flex gap-2 animate-pop-in" style={{ animationDelay: `${i * 0.08}s` }}>
                    {Array.from({ length: room.currentBlackCard?.pick || 1 }).map((_, j) => (
                      <div
                        key={j}
                        className="relative w-32 h-48 sm:w-48 sm:h-64 rounded-2xl border-2 border-mint/20 bg-gradient-to-br from-navy to-ink shadow-card flex items-center justify-center"
                      >
                        <div className="absolute inset-3 rounded-xl border border-mint/10" />
                        <span className="text-spring/30 font-black text-3xl rotate-45 select-none">S</span>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>

            {/* Hand */}
            {!isCzar && isPlaying && (
              <div className="fixed bottom-0 left-0 right-0 p-4 sm:p-6 border-t-2 border-teal/20 dark:border-mint/10 bg-white/80 dark:bg-ink/85 backdrop-blur-xl shadow-[0_-10px_40px_rgba(13,43,62,0.15)] z-20 animate-rise">
                <div className="flex justify-between items-end max-w-7xl mx-auto mb-3">
                  <h3 className="font-black text-sm uppercase tracking-[0.2em] text-navy/60 dark:text-mint/50 hidden sm:block">
                    Your Hand
                  </h3>
                  {canSubmit && (
                    <button
                      onClick={handleSubmit}
                      className="btn-primary px-6 sm:px-8 py-2.5 flex items-center gap-2 w-full sm:w-auto justify-center animate-pop-in"
                    >
                      <Check size={20} /> Submit
                    </button>
                  )}
                </div>
                <div className="flex gap-2 sm:gap-4 overflow-x-auto pb-4 px-2 pt-4 snap-x hide-scrollbar items-center">
                  {hand.map((cardText, i) => {
                    const selectionIndex = selectedCards.indexOf(i);
                    return (
                      <div key={i} className="snap-start relative animate-deal" style={{ animationDelay: `${i * 0.05}s` }}>
                        {selectionIndex !== -1 && room.currentBlackCard && room.currentBlackCard.pick > 1 && (
                          <div className="absolute -top-2 -right-2 w-8 h-8 bg-spring text-navy rounded-full flex items-center justify-center font-black z-20 shadow-card animate-pop-in">
                            {selectionIndex + 1}
                          </div>
                        )}
                        <Card
                          text={cardText}
                          type="white"
                          selected={selectionIndex !== -1}
                          onClick={() => handleCardClick(i)}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
