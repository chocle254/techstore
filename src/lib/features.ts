// The public shop (buyer accounts, cart, checkout, riders) is switched off unless SHOP_ENABLED=1.
// Off, the app is the boss's own records: sales, scheduled orders, owed money, stock and expenses.
export const SHOP_ON = process.env.SHOP_ENABLED === "1";

/** Shop pages that are closed while the shop is off. */
export function isShopPath(pathname: string): boolean {
  if (pathname === "/") return true;
  if (pathname.startsWith("/account/password")) return false;
  return /^\/(products|p|cart|checkout|signup|delivery|orders|account|rider)(\/|$)/.test(pathname) || pathname.startsWith("/admin/orders") || pathname.startsWith("/admin/areas");
}
