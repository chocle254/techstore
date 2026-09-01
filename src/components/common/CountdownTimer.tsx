import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

function getParts(msLeft: number) {
  const total = Math.max(0, Math.floor(msLeft / 1000));
  return {
    h: String(Math.floor(total / 3600)).padStart(2, '0'),
    m: String(Math.floor((total % 3600) / 60)).padStart(2, '0'),
    s: String(total % 60).padStart(2, '0'),
  };
}

interface CountdownTimerProps {
  /** Deal deadline */
  endsAt: Date;
  className?: string;
  /** Compact = just the digits, no icon/label (for hero overlay) */
  compact?: boolean;
}

export function CountdownTimer({ endsAt, className, compact }: CountdownTimerProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const { h, m, s } = getParts(endsAt.getTime() - now);

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 glass rounded-full px-3 py-1.5 text-xs font-semibold tabular-nums',
        className
      )}
    >
      {!compact && <Clock className="w-3.5 h-3.5 text-[hsl(var(--ember))]" />}
      {!compact && <span className="text-muted-foreground font-normal mr-0.5">Ends in</span>}
      <span className="text-foreground">{h}</span>
      <span className="text-[hsl(var(--ember))]">:</span>
      <span className="text-foreground">{m}</span>
      <span className="text-[hsl(var(--ember))]">:</span>
      <span className="text-foreground">{s}</span>
    </div>
  );
}

/** Deterministic "flash sale ends tonight" deadline — stable across re-renders/refreshes within the same day */
export function useEndOfDayDeadline() {
  const [deadline] = useState(() => {
    const d = new Date();
    d.setHours(23, 59, 59, 0);
    if (d.getTime() < Date.now()) d.setDate(d.getDate() + 1);
    return d;
  });
  return deadline;
}
