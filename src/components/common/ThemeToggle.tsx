import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={toggleTheme}
      className={cn(
        'relative inline-flex h-8 w-16 shrink-0 items-center rounded-full border border-border transition-colors duration-300 btn-press',
        isDark ? 'bg-secondary' : 'bg-primary/15',
        className
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-card shadow-md transition-all duration-300 ease-out',
          isDark ? 'left-[calc(100%-1.75rem)]' : 'left-0.5'
        )}
      >
        {isDark
          ? <Moon className="w-3.5 h-3.5 text-primary" />
          : <Sun className="w-3.5 h-3.5 text-primary animate-[spin_0.5s_ease-out]" />
        }
      </span>
    </button>
  );
}
