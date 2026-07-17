import { useGameStore } from '../store/useGameStore';
import { AlertTriangle } from 'lucide-react';

export function WarningModal() {
  const acceptWarning = useGameStore((state) => state.acceptWarning);

  return (
    <div className="fixed inset-0 bg-abyss/80 flex items-center justify-center z-50 p-4 sm:p-6 overflow-y-auto backdrop-blur-md">
      <div className="panel max-w-md w-full p-6 sm:p-8 my-auto animate-pop-in bg-white/90 dark:bg-ink/90">
        <div className="w-14 h-14 rounded-2xl bg-spring/20 border-2 border-spring/40 flex items-center justify-center mb-5 animate-tilt">
          <AlertTriangle className="text-teal dark:text-spring" size={28} />
        </div>

        <h1 className="text-2xl sm:text-3xl font-black mb-1 uppercase tracking-tighter text-navy dark:text-mint">
          Hold up.
        </h1>
        <p className="text-xs font-black uppercase tracking-[0.2em] text-jade mb-5">
          Cards Against Humanity
        </p>

        <p className="text-base sm:text-lg font-bold mb-4 text-navy dark:text-mint text-balance">
          This game contains offensive, inappropriate, and 18+ content. It's a
          party game for horrible people.
        </p>
        <p className="text-sm mb-8 font-medium text-navy/70 dark:text-mint/60 leading-relaxed">
          By proceeding, you confirm that you are at least 18 years old and are
          not easily offended.
        </p>

        <button
          onClick={acceptWarning}
          className="btn-primary w-full text-lg py-4 animate-glow-pulse"
        >
          I Understand
        </button>
      </div>
    </div>
  );
}
