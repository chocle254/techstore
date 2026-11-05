import { daysBetween, ymdNairobi } from "./format";
import type { Bucket, Range } from "./queries";

export const PRESETS = [
  { key: "today", label: "Today" },
  { key: "7d", label: "7 days" },
  { key: "month", label: "This month" },
  { key: "lastmonth", label: "Last month" },
  { key: "year", label: "This year" },
] as const;

const isYmd = (s: unknown): s is string => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));

const addDays = (ymd: string, n: number) => new Date(Date.parse(ymd) + n * 86_400_000).toISOString().slice(0, 10);

export function resolveRange(sp: Record<string, string | string[] | undefined>): { range: Range; preset: string; bucket: Bucket } {
  const today = ymdNairobi();
  let preset = typeof sp.p === "string" ? sp.p : "month";
  let range: Range;

  if (isYmd(sp.from) && isYmd(sp.to) && sp.from <= sp.to) {
    preset = "custom";
    range = { from: sp.from, to: sp.to };
  } else {
    const [y, m] = today.split("-").map(Number);
    switch (preset) {
      case "today":
        range = { from: today, to: today };
        break;
      case "7d":
        range = { from: addDays(today, -6), to: today };
        break;
      case "lastmonth": {
        const first = new Date(Date.UTC(y, m - 2, 1)).toISOString().slice(0, 10);
        const last = new Date(Date.UTC(y, m - 1, 0)).toISOString().slice(0, 10);
        range = { from: first, to: last };
        break;
      }
      case "year":
        range = { from: `${y}-01-01`, to: today };
        break;
      default:
        preset = "month";
        range = { from: `${today.slice(0, 7)}-01`, to: today };
    }
  }

  const days = daysBetween(range.from, range.to) + 1;
  const auto: Bucket = days <= 45 ? "day" : days <= 120 ? "week" : days <= 800 ? "month" : "year";
  const bucket = (["day", "week", "month", "year"] as const).find((b) => b === sp.by) ?? auto;
  return { range, preset, bucket };
}

export function bucketLabel(ymd: string, bucket: Bucket): string {
  const d = new Date(ymd + "T00:00:00Z");
  if (bucket === "year") return String(d.getUTCFullYear());
  if (bucket === "month") return d.toLocaleDateString("en-KE", { month: "short", year: "2-digit", timeZone: "UTC" });
  const s = d.toLocaleDateString("en-KE", { day: "numeric", month: "short", timeZone: "UTC" });
  return bucket === "week" ? `Wk of ${s}` : s;
}
