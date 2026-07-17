
import { useGameStore } from '../store/useGameStore';

export function WarningModal() {
  const acceptWarning = useGameStore((state) => state.acceptWarning);

  return (
    <div className="fixed inset-0 bg-black/80 dark:bg-black/90 flex items-center justify-center z-50 p-4 sm:p-6 overflow-y-auto backdrop-blur-sm">
      <div className="bg-white dark:bg-neutral-800 text-black dark:text-white p-6 sm:p-8 max-w-md w-full rounded shadow-2xl border-4 border-black dark:border-white animate-fade-in-up my-auto transition-colors">
        <h1 className="text-2xl sm:text-3xl font-black mb-4 uppercase tracking-tighter">Warning!</h1>
        <p className="text-base sm:text-lg font-bold mb-6">
          This game contains offensive, inappropriate, and 18+ content. 
          It is a party game for horrible people.
        </p>
        <p className="text-sm sm:text-md mb-8 opacity-80">
          By proceeding, you confirm that you are at least 18 years old and are not easily offended.
        </p>
        <button 
          onClick={acceptWarning}
          className="w-full bg-black dark:bg-white text-white dark:text-black font-bold text-lg sm:text-xl py-4 hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors uppercase tracking-widest rounded shadow-[4px_4px_0px_rgba(0,0,0,0.2)] dark:shadow-[4px_4px_0px_rgba(255,255,255,0.2)] active:translate-y-1 active:shadow-none"
        >
          I Understand
        </button>
      </div>
    </div>
  );
}
