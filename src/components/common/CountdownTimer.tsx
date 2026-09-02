import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

function getTimeLeft(target: Date) {
  const diff = Math.max(0, target.getTime() - Date.now());
  const hours = Math.floor(diff / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const seconds = Math.floor((diff % 60_000) / 1000);
  return { diff, hours, minutes, seconds };
}

function endOfToday() {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

interface CountdownTimerProps {
  /** Defaults to the end of today (local time) — a rolling "deal ends tonight" countdown. */
  target?: Date;
  className?: string;
  /** Use light text/cards when placed over a dark or colorful gradient background. */
  variant?: 'default' | 'on-gradient';
}

export function CountdownTimer({ target, className, variant = 'default' }: CountdownTimerProps) {
  const [targetDate] = useState(() => target || endOfToday());
  const [{ hours, minutes, seconds }, setTimeLeft] = useState(() => getTimeLeft(targetDate));

  useEffect(() => {
    const id = setInterval(() => setTimeLeft(getTimeLeft(targetDate)), 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  const units = [
    { label: 'Hrs', value: hours },
    { label: 'Min', value: minutes },
    { label: 'Sec', value: seconds },
  ];

  const onGradient = variant === 'on-gradient';

  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        {units.map((u, i) => (
          <React.Fragment key={u.label}>
            <div className={cn(
              'flex flex-col items-center rounded-lg px-2.5 py-1.5 min-w-[48px] backdrop-blur-sm border',
              onGradient ? 'bg-black/25 border-white/25' : 'bg-background/90 border-white/10'
            )}>
              <span className={cn('text-lg font-extrabold tabular-nums leading-none', onGradient ? 'text-white' : 'text-foreground')}>
                {String(u.value).padStart(2, '0')}
              </span>
              <span className={cn('text-[9px] uppercase tracking-wide mt-0.5', onGradient ? 'text-white/80' : 'text-muted-foreground')}>{u.label}</span>
            </div>
            {i < units.length - 1 && (
              <span className={cn('text-lg font-bold animate-flicker', onGradient ? 'text-white' : 'text-destructive')}>:</span>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
