import React from 'react';

type CardProps = {
  text: string;
  type: 'black' | 'white';
  pick?: number;
  selected?: boolean;
  onClick?: () => void;
};

export function Card({ text, type, pick, selected, onClick }: CardProps) {
  const isBlack = type === 'black';

  return (
    <div 
      onClick={onClick}
      className={`
        relative w-32 h-48 sm:w-48 sm:h-64 p-3 sm:p-4 rounded-xl shadow-lg border-2 select-none flex-shrink-0
        transition-transform duration-200 ease-out
        ${onClick ? 'cursor-pointer hover:-translate-y-2 hover:shadow-xl' : ''}
        ${isBlack ? 'bg-black text-white border-black' : 'bg-white text-black border-neutral-300'}
        ${selected ? (isBlack ? 'ring-4 ring-neutral-500' : 'ring-4 ring-black') : ''}
      `}
    >
      <p className="text-sm sm:text-lg font-bold leading-tight" dangerouslySetInnerHTML={{ __html: text.replace(/_______/g, '_______') }} />
      
      {isBlack && pick && (
        <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 bg-white text-black text-[10px] sm:text-xs font-black px-2 py-1 rounded-full">
          PICK {pick}
        </div>
      )}
      <div className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4 flex items-center gap-1 opacity-50">
        <div className={`w-2 h-2 sm:w-3 sm:h-3 ${isBlack ? 'bg-white' : 'bg-black'}`} style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)' }} />
        <span className="text-[7px] sm:text-[10px] font-bold uppercase tracking-widest leading-none">Cards Against Humanity</span>
      </div>
    </div>
  );
}
