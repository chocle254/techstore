import React from 'react';
import { cn } from '@/lib/utils';

interface AdSlotProps {
  /** Reserve height so the ad never causes layout shift once it loads. */
  height?: number;
  className?: string;
  label?: string;
}

/**
 * Placeholder ad container. Sized and styled to sit comfortably in the page
 * flow — clearly labeled as an ad (so it never feels deceptive), same
 * rounded/border language as the rest of the UI (so it doesn't feel bolted
 * on), and a reserved fixed height (so content doesn't jump around it once
 * a real ad network script fills it in).
 *
 * Swap the inner content for your ad network's mount point / script tag
 * when ready — the outer wrapper and spacing can stay as-is.
 */
export function AdSlot({ height = 100, className, label = 'Advertisement' }: AdSlotProps) {
  return (
    <div className={cn('w-full flex flex-col items-center gap-1.5', className)}>
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60">{label}</span>
      <div
        className="ad-slot w-full"
        style={{ minHeight: height }}
      >
        <span>Ad space</span>
      </div>
    </div>
  );
}
