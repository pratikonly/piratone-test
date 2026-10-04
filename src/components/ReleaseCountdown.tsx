import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

interface ReleaseCountdownProps {
  /** Moment the countdown reaches 00:00:00 */
  unlockAt: Date;
  title: string;
  backdropUrl: string | null;
  /** e.g. "Server 6" */
  serverLabel: string;
  onUnlock: () => void;
}

const pad = (value: number) => String(value).padStart(2, '0');

/** Live countdown shown in place of the player until a movie's release-day unlock time. */
const ReleaseCountdown = ({ unlockAt, title, backdropUrl, serverLabel, onUnlock }: ReleaseCountdownProps) => {
  const target = unlockAt.getTime();
  const [secondsLeft, setSecondsLeft] = useState(() => Math.max(0, Math.ceil((target - Date.now()) / 1000)));

  useEffect(() => {
    const tick = () => {
      const left = Math.max(0, Math.ceil((target - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left === 0) onUnlock();
    };
    tick();
    const interval = window.setInterval(tick, 250);
    return () => window.clearInterval(interval);
  }, [target, onUnlock]);

  const hours = Math.floor(secondsLeft / 3600);
  const minutes = Math.floor((secondsLeft % 3600) / 60);
  const seconds = secondsLeft % 60;
  const unlockLabel = unlockAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });

  return (
    <div className="relative isolate aspect-video w-full overflow-hidden rounded-lg border border-white/10 bg-black">
      {backdropUrl && (
        <img
          src={backdropUrl}
          alt=""
          className="absolute inset-0 -z-10 h-full w-full scale-105 object-cover opacity-40 blur-sm"
        />
      )}
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black via-black/60 to-black/40" />

      <div className="flex h-full flex-col items-center justify-center gap-3 px-4 text-center sm:gap-5">
        <div className="flex items-center gap-2 rounded-full border border-white/20 bg-black/50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white backdrop-blur-sm sm:text-xs">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
          </span>
          Releasing today
        </div>

        <h2 className="line-clamp-2 max-w-xl text-lg font-bold text-white sm:text-2xl">{title}</h2>

        <div role="timer" aria-label={`Time left: ${hours} hours ${minutes} minutes ${seconds} seconds`} className="flex items-center gap-2 sm:gap-3">
          {[
            { value: hours, label: 'Hours' },
            { value: minutes, label: 'Minutes' },
            { value: seconds, label: 'Seconds' },
          ].map((unit, index) => (
            <div key={unit.label} className="flex items-center gap-2 sm:gap-3">
              {index > 0 && <span className="pb-4 text-2xl font-bold text-white/40 sm:text-4xl">:</span>}
              <div className="flex flex-col items-center">
                <div className="min-w-[3.25rem] rounded-xl border border-white/15 bg-white/[0.08] px-2 py-2 font-mono text-3xl font-bold tabular-nums text-white backdrop-blur-sm sm:min-w-[5.5rem] sm:px-4 sm:py-3 sm:text-6xl">
                  {pad(unit.value)}
                </div>
                <span className="mt-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-white/50 sm:text-[11px]">
                  {unit.label}
                </span>
              </div>
            </div>
          ))}
        </div>

        <p className="flex items-center gap-1.5 text-xs text-white/70 sm:text-sm">
          <Clock className="h-3.5 w-3.5" />
          Unlocks at {unlockLabel}. Then play it on {serverLabel}.
        </p>
      </div>
    </div>
  );
};

export default ReleaseCountdown;