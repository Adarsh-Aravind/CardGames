import { useEffect, useState } from 'react';
import { AlertTriangle, Coffee } from 'lucide-react';

const MESSAGES = [
  'Waking up the server…',
  'Brewing the card deck…',
  'Dealing with the free tier…',
  'Almost there, thanks for waiting…',
];

/**
 * Shown between accepting the warning and the socket connecting.
 *
 * The backend sleeps on Render's free plan, so a first connection after an idle
 * spell takes ~30-60s. Without this the app looked frozen, so we show progress,
 * an elapsed counter, and say plainly why it's slow.
 */
export function BootScreen() {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    // Derive elapsed time from a timestamp rather than counting ticks: browsers
    // throttle timers in background tabs, and an incrementing counter would
    // under-report for anyone who tabs away while waiting.
    const startedAt = Date.now();
    const id = setInterval(
      () => setSeconds(Math.floor((Date.now() - startedAt) / 1000)),
      500,
    );
    return () => clearInterval(id);
  }, []);

  const message = MESSAGES[Math.min(Math.floor(seconds / 8), MESSAGES.length - 1)];
  const isSlow = seconds >= 45;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Shuffling deck */}
      <div className="relative h-40 w-40 mb-10" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="absolute inset-0 mx-auto w-24 h-36 rounded-xl border-2 border-mint/30 bg-navy shadow-card animate-shuffle-card"
            style={{ animationDelay: `${i * 0.35}s` }}
          >
            <div className="absolute inset-2 rounded-lg border border-mint/15" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-spring/40 font-black text-2xl rotate-45 select-none">S</span>
            </div>
          </div>
        ))}
      </div>

      <h2 className="text-2xl sm:text-3xl font-black text-navy dark:text-mint text-center text-balance">
        {message}
      </h2>

      <p className="mt-3 font-bold text-teal dark:text-jade tabular-nums">
        {seconds}s elapsed
      </p>

      {/* Indeterminate progress */}
      <div className="mt-6 w-full max-w-sm h-2 rounded-full overflow-hidden bg-navy/10 dark:bg-mint/10">
        <div className="h-full w-full shimmer-bar animate-shimmer" />
      </div>

      {/* The heads-up the user asked for */}
      <div className="mt-10 max-w-md w-full panel p-5 animate-fade-in-up">
        <div className="flex gap-3">
          <Coffee className="text-jade flex-shrink-0 mt-0.5 animate-float" size={22} />
          <div>
            <p className="font-black text-navy dark:text-mint uppercase tracking-wide text-sm">
              First load is slow — that's normal
            </p>
            <p className="mt-2 text-sm font-medium text-navy/75 dark:text-mint/70 leading-relaxed">
              The game server runs on a free plan and goes to sleep when nobody's
              playing. Waking it takes up to a minute. Once it's up, everything is
              instant — for you and everyone you invite.
            </p>
          </div>
        </div>
      </div>

      {isSlow && (
        <div className="mt-4 max-w-md w-full rounded-xl border-2 border-teal/40 bg-teal/10 p-4 animate-pop-in">
          <div className="flex gap-3">
            <AlertTriangle className="text-teal dark:text-jade flex-shrink-0 mt-0.5" size={20} />
            <p className="text-sm font-bold text-navy dark:text-mint leading-relaxed">
              Still waking up. This can happen if the server has been idle for a
              while — it'll connect on its own, no need to refresh.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
