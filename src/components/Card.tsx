type CardProps = {
  text: string;
  type: 'black' | 'white';
  pick?: number;
  selected?: boolean;
  onClick?: () => void;
};

export function Card({ text, type, pick, selected, onClick }: CardProps) {
  const isPrompt = type === 'black';

  return (
    <div
      onClick={onClick}
      className={`
        group relative w-32 h-48 sm:w-48 sm:h-64 p-3 sm:p-4 rounded-2xl select-none flex-shrink-0
        border-2 shadow-card overflow-hidden
        transition-all duration-300 ease-out
        ${onClick ? 'cursor-pointer hover:-translate-y-3 hover:rotate-1 hover:shadow-card-hover' : ''}
        ${isPrompt
          ? 'bg-gradient-to-br from-navy to-ink text-mint border-navy'
          : 'bg-gradient-to-br from-frost to-mint text-navy border-white/60'}
        ${selected ? 'ring-4 ring-spring -translate-y-3 shadow-card-hover' : ''}
      `}
    >
      {/* Sheen that sweeps across on hover */}
      {onClick && (
        <div className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
      )}

      <p className="relative text-sm sm:text-lg font-bold leading-tight">{text}</p>

      {isPrompt && pick && (
        <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 bg-spring text-navy text-[10px] sm:text-xs font-black px-2 py-1 rounded-full shadow">
          PICK {pick}
        </div>
      )}

      <div className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4 flex items-center gap-1 opacity-60">
        <div className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-sm ${isPrompt ? 'bg-spring' : 'bg-teal'}`} />
        <span className="text-[7px] sm:text-[9px] font-black uppercase tracking-widest leading-none">
          Shuffle
        </span>
      </div>
    </div>
  );
}
