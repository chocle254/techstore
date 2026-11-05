import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number, opts: object) => Promise<Buffer>;

// OWASP-recommended scrypt parameters (N=2^17, r=8, p=1).
const N = 131072;
const R = 8;
const P = 1;
const KEYLEN = 64;
const MAXMEM = 256 * 1024 * 1024;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scrypt(password.normalize("NFKC"), salt, KEYLEN, { N, r: R, p: P, maxmem: MAXMEM });
  return ["scrypt", N, R, P, salt.toString("base64"), key.toString("base64")].join("$");
}

export async function verifyPassword(password: string, stored: string | null): Promise<boolean> {
  // Always do the work, even with no stored hash, so timing doesn't reveal whether an account exists.
  const parts = (stored ?? "").split("$");
  const valid = parts.length === 6 && parts[0] === "scrypt";
  const n = valid ? Number(parts[1]) : N;
  const r = valid ? Number(parts[2]) : R;
  const p = valid ? Number(parts[3]) : P;
  const salt = valid ? Buffer.from(parts[4], "base64") : randomBytes(16);
  const expected = valid ? Buffer.from(parts[5], "base64") : randomBytes(KEYLEN);
  const key = await scrypt(password.normalize("NFKC"), salt, expected.length, { N: n, r, p, maxmem: MAXMEM });
  return valid && timingSafeEqual(key, expected);
}

const COMMON = new Set(["12345678", "123456789", "password", "password1", "jonwin123", "qwertyui", "11111111"]);

export function passwordProblem(pw: string): string | null {
  if (pw.length < 8) return "Password must be at least 8 characters.";
  if (pw.length > 128) return "Password is too long.";
  if (/^(.)\1+$/.test(pw) || COMMON.has(pw.toLowerCase())) return "That password is too easy to guess.";
  return null;
}
