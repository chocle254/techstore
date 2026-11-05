export const ksh = (n: number) => "KSh " + Math.round(n).toLocaleString("en-KE");

export function sizeLabel(ml: number): string {
  return ml < 1000 ? `${ml}ml` : `${ml / 1000}L`;
}

export const ROLE_LABELS: Record<string, string> = {
  boss: "Boss",
  helper: "Helper",
  cook: "Cook",
  rider: "Rider",
  customer: "Customer",
};

export const METHOD_LABELS: Record<string, string> = {
  cash: "Cash",
  mpesa: "M-Pesa",
  online: "Online",
  cod: "Cash on delivery",
  credit: "Pay later",
};

export const EXPENSE_LABELS: Record<string, string> = {
  transport: "Transport",
  containers: "Containers / bottles",
  labels: "Labels",
  rent: "Rent",
  chemicals: "Chemicals",
  tips: "Tips",
  wages: "Wages",
  other: "Other",
};

const TZ = "Africa/Nairobi";

export function fmtDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric", timeZone: TZ });
}

export function fmtDateTime(d: Date | string) {
  return new Date(d).toLocaleString("en-KE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: TZ });
}

/** A date in Nairobi as YYYY-MM-DD. */
export function ymdNairobi(d: Date = new Date()): string {
  return d.toLocaleDateString("en-CA", { timeZone: TZ });
}

export function daysBetween(fromYmd: string, toYmd: string): number {
  return Math.round((Date.parse(toYmd) - Date.parse(fromYmd)) / 86_400_000);
}
