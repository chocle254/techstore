"use client";

import { useSyncExternalStore } from "react";

export type Theme = "light" | "dark" | "system";
const OPTIONS: { value: Theme; label: string; icon: string }[] = [
  { value: "light", label: "Light", icon: "☀" },
  { value: "dark", label: "Dark", icon: "☾" },
  { value: "system", label: "Auto", icon: "◐" },
];

const listeners = new Set<() => void>();
const subscribe = (fn: () => void) => (listeners.add(fn), () => void listeners.delete(fn));
const read = () => (document.documentElement.dataset.theme as Theme | undefined) ?? "system";

function setTheme(t: Theme) {
  document.documentElement.dataset.theme = t;
  // A year-long cookie so the server renders the right theme on the next visit, with no flash.
  document.cookie = `theme=${t}; path=/; max-age=31536000; samesite=lax`;
  listeners.forEach((fn) => fn());
}

/** Light / Dark / Auto (follows the phone). `tone="dark"` for use on dark backgrounds like the shop footer. */
export function ThemePicker({ tone = "default", className = "" }: { tone?: "default" | "dark"; className?: string }) {
  const current = useSyncExternalStore(subscribe, read, () => null);
  const box = tone === "dark" ? "bg-white/10" : "bg-surface border border-line";
  const on = tone === "dark" ? "bg-white text-[#16181d]" : "bg-card text-ink shadow-sm";
  const off = tone === "dark" ? "text-white/75 hover:text-white" : "text-muted hover:text-ink";
  return (
    <div role="radiogroup" aria-label="Appearance" className={`inline-flex rounded-full p-1 ${box} ${className}`}>
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={current === o.value}
          onClick={() => setTheme(o.value)}
          className={`flex min-h-9 items-center gap-1.5 rounded-full px-3 text-sm font-semibold transition-colors ${current === o.value ? on : off}`}
        >
          <span aria-hidden>{o.icon}</span>
          {o.label}
        </button>
      ))}
    </div>
  );
}
