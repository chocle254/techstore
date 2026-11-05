import "server-only";
import { headers } from "next/headers";

type Limit = { limit: number; windowSec: number };

export const LIMITS = {
  login: { limit: 5, windowSec: 15 * 60 },
  signup: { limit: 5, windowSec: 60 * 60 },
  passwordReset: { limit: 3, windowSec: 60 * 60 },
  checkout: { limit: 10, windowSec: 60 * 60 },
  write: { limit: 120, windowSec: 60 },
} satisfies Record<string, Limit>;

export async function clientIp(): Promise<string> {
  const h = await headers();
  // On Vercel the first x-forwarded-for entry is the real client address.
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

// Fallback for local development: per-process memory.
const memory = new Map<string, { count: number; resetAt: number }>();

async function hitRedis(key: string, { limit, windowSec }: Limit): Promise<boolean> {
  const { Ratelimit } = await import("@upstash/ratelimit");
  const { Redis } = await import("@upstash/redis");
  const redis = new Redis({
    url: (process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL)!,
    token: (process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN)!,
  });
  const rl = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(limit, `${windowSec} s`), prefix: "jw" });
  return (await rl.limit(key)).success;
}

/** Returns true if the action is allowed. `id` narrows the bucket (e.g. a phone number). */
export async function rateLimit(name: keyof typeof LIMITS, id = ""): Promise<boolean> {
  const cfg = LIMITS[name];
  const key = `${name}:${await clientIp()}:${id}`;
  if (process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL) {
    try {
      return await hitRedis(key, cfg);
    } catch (e) {
      console.error("Rate limiter unavailable, falling back to memory", e);
    }
  } else if (process.env.VERCEL && process.env.NODE_ENV === "production") {
    console.warn("No Upstash Redis configured: rate limits are per-instance only.");
  }
  const now = Date.now();
  const entry = memory.get(key);
  if (!entry || entry.resetAt < now) {
    memory.set(key, { count: 1, resetAt: now + cfg.windowSec * 1000 });
    return true;
  }
  entry.count++;
  return entry.count <= cfg.limit;
}
