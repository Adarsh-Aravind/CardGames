import { useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { Card } from './Card';
import { Trophy, Crown, Check, Copy, CheckCircle2 } from 'lucide-react';

export function GameBoard() {
  const { room, hand, socket, submitCard, pickWinner, roundWinner } = useGameStore();
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [copied, setCopied] = useState(false);

  if (!room || !socket) return null;

  const isCzar = room.czarId === socket.id;
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
    const link = `${window.location.origin}?room=${room.id}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-4 sm:p-8 flex flex-col font-sans">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-8">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center w-full md:w-auto">
          <div className="bg-black text-white px-6 py-2 rounded font-black tracking-wider shadow-lg flex-shrink-0">
            ROOM: <span className="text-xl ml-2">{room.id}</span>
          </div>
          <button 
            onClick={handleCopyLink}
            className="flex items-center justify-center gap-2 bg-white border-2 border-black px-4 py-2 rounded font-bold hover:bg-neutral-100 transition shadow w-full sm:w-auto flex-shrink-0"
          >
            {copied ? <CheckCircle2 size={18} className="text-green-600" /> : <Copy size={18} />}
            {copied ? 'Copied!' : 'Copy Invite Link'}
          </button>
        </div>
        
        {/* Scoreboard */}
        <div className="bg-white border-2 border-black rounded shadow-lg p-3 sm:p-4 flex gap-4 sm:gap-6 w-full md:w-auto overflow-x-auto hide-scrollbar">
          {room.players.map(p => (
            <div key={p.id} className="flex flex-col items-center">
              <span className="font-bold flex items-center gap-1">
                {p.name}
                {p.id === room.czarId && <Crown size={16} className="text-yellow-500" />}
              </span>
              <span className="text-2xl font-black">{p.score}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Play Area */}
      <div className="flex-1 flex flex-col items-center">
        {room.state === 'lobby' ? (
          <div className="text-center animate-fade-in-up mt-10">
            <h2 className="text-2xl sm:text-3xl font-black mb-6 flex items-center justify-center gap-2">
              Waiting for players
              <span className="flex space-x-1">
                <span className="w-2 h-2 bg-black dark:bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-2 h-2 bg-black dark:bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-2 h-2 bg-black dark:bg-white rounded-full animate-bounce"></span>
              </span>
            </h2>
            {room.players[0].id === socket.id && (
              <button 
                onClick={() => socket.emit('start_game', room.id)}
                className="bg-black dark:bg-white text-white dark:text-black font-bold text-lg sm:text-xl py-4 px-8 sm:px-12 rounded hover:bg-neutral-800 dark:hover:bg-neutral-200 transition shadow-xl w-full sm:w-auto"
              >
                START GAME
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col w-full max-w-6xl">
            
            {/* Status Banner */}
            <div className="text-center mb-8 h-12">
              {roundWinner ? (
                <div className="inline-block bg-yellow-400 text-black px-6 py-2 rounded-full font-black text-xl animate-bounce shadow-lg flex items-center gap-2">
                  <Trophy size={24} />
                  {roundWinner.winnerName} won this round!
                </div>
              ) : isCzar ? (
                <h2 className="text-2xl font-black text-neutral-800">
                  {isPlaying ? "You are the Card Czar. Waiting for submissions..." : "Choose the best card!"}
                </h2>
              ) : (
                <h2 className="text-2xl font-black text-neutral-800">
                  {isPlaying ? (hasSubmitted ? "Waiting for others..." : `Play ${room.currentBlackCard?.pick} card(s)`) : "The Card Czar is choosing..."}
                </h2>
              )}
            </div>

            {/* Board (Black Card & Submissions) */}
            <div className="flex flex-wrap justify-center gap-8 mb-16 p-8 bg-white/50 rounded-2xl border-4 border-dashed border-neutral-300 min-h-[400px] relative">
              
              {room.currentBlackCard && (
                <div className="z-10">
                  <Card text={room.currentBlackCard.text} type="black" pick={room.currentBlackCard.pick} />
                </div>
              )}

              {/* Submissions */}
              {isCzarPicking ? (
                // Show submitted cards for czar to pick
                room.submissions.map((sub, i) => (
                  <div 
                    key={i} 
                    className="flex gap-2 relative group cursor-pointer"
                    onClick={() => isCzar && pickWinner(sub)}
                  >
                    {sub.cards.map((cText: string, j: number) => (
                      <Card key={j} text={cText} type="white" />
                    ))}
                    {isCzar && (
                      <div className="absolute inset-0 bg-black/10 hidden group-hover:flex items-center justify-center rounded-xl transition-all">
                        <div className="bg-black text-white px-4 py-2 font-bold rounded shadow-lg uppercase tracking-wider">
                          Pick This
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                // Show face down cards for submissions
                Array.from({ length: room.submissionCount }).map((_, i) => (
                   <div key={i} className="flex gap-2">
                     {Array.from({ length: room.currentBlackCard?.pick || 1 }).map((_, j) => (
                        <div key={j} className="w-48 h-64 bg-black rounded-xl border-4 border-white shadow-xl flex items-center justify-center relative opacity-80">
                           <span className="text-white font-black opacity-30 text-2xl rotate-45">CAH</span>
                        </div>
                     ))}
                   </div>
                ))
              )}
            </div>
            
            {/* Player Hand */}
            {!isCzar && isPlaying && (
              <div className="fixed bottom-0 left-0 right-0 p-4 sm:p-8 bg-neutral-200 border-t-4 border-black shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-20">
                <div className="flex justify-between items-end max-w-7xl mx-auto mb-2 sm:mb-4">
                  <h3 className="font-black text-lg sm:text-xl uppercase tracking-widest hidden sm:block">Your Hand</h3>
                  {canSubmit && (
                    <button 
                      onClick={handleSubmit}
                      className="bg-black text-white font-black px-6 sm:px-8 py-2 sm:py-3 rounded hover:scale-105 transition-transform shadow-lg flex items-center gap-2 uppercase tracking-wider w-full sm:w-auto justify-center"
                    >
                      <Check size={20} /> Submit
                    </button>
                  )}
                </div>
                <div className="flex gap-2 sm:gap-4 overflow-x-auto pb-4 px-2 snap-x hide-scrollbar items-center">
                   {hand.map((cardText, i) => {
                     const selectionIndex = selectedCards.indexOf(i);
                     return (
                      <div key={i} className="snap-start relative">
                        {selectionIndex !== -1 && room.currentBlackCard && room.currentBlackCard.pick > 1 && (
                          <div className="absolute -top-3 -right-3 w-8 h-8 bg-black text-white rounded-full flex items-center justify-center font-black z-20 shadow-lg">
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
