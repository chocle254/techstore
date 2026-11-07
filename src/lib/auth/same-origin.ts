import "server-only";

/**
 * Plain form posts (used where we don't want to depend on JavaScript) must come from our own pages.
 * Server actions check this themselves; route handlers have to do it by hand.
 */
export function fromOurSite(req: Request): boolean {
  const origin = req.headers.get("origin");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
