import "server-only";
import { redirect } from "next/navigation";
import { SHOP_ON } from "@/lib/features";
import { getCurrentUser, type Role, type SessionUser } from "./session";

export const STAFF_ROLES: Role[] = ["boss", "helper", "cook", "rider"];

export function hasRole(user: Pick<SessionUser, "roles"> | null, ...allowed: Role[]) {
  return !!user && user.roles.some((r) => allowed.includes(r));
}

/**
 * Use at the top of every protected page AND every server action.
 * Redirects to login when logged out, and to the home page when the role isn't allowed.
 */
export async function requireUser(...allowed: Role[]): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.mustChangePassword) redirect("/account/password?first=1");
  // With the shop off there is no public home page, so send them back to login instead.
  if (allowed.length && !hasRole(user, ...allowed)) redirect(SHOP_ON ? "/" : "/login");
  return user;
}

/** Same as requireUser, but allows users who still need to change their temporary password. */
export async function requireLoggedIn(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** Whether this person can use the app while the shop is off (the team, not buyers or riders). */
export function canUseApp(user: Pick<SessionUser, "roles">): boolean {
  return SHOP_ON || hasRole(user, "boss", "helper", "cook");
}

/** Where a user lands after login. */
export function homeFor(user: Pick<SessionUser, "roles">): string {
  if (hasRole(user, "boss", "helper")) return "/admin";
  if (hasRole(user, "cook")) return "/admin/production";
  if (hasRole(user, "rider")) return "/rider";
  return "/account";
}
