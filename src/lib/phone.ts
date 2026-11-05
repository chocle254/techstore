// Normalises Kenyan phone numbers to 2547XXXXXXXX / 2541XXXXXXXX. Returns null if invalid.
export function normalizePhone(input: string): string | null {
  let n = input.replace(/[^\d]/g, "");
  if (/^0[17]\d{8}$/.test(n)) n = "254" + n.slice(1);
  else if (/^[17]\d{8}$/.test(n)) n = "254" + n;
  return /^254[17]\d{8}$/.test(n) ? n : null;
}

export function formatPhone(p: string): string {
  return p.startsWith("254") ? "0" + p.slice(3, 6) + " " + p.slice(6, 9) + " " + p.slice(9) : p;
}
