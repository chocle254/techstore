import Link from "next/link";
import { hasRole, requireUser } from "@/lib/auth/guard";
import { logoutAction } from "@/lib/auth/actions";

export const metadata = { title: { default: "Deliveries", template: "%s · JonWin Deliveries" } };

export default async function RiderLayout({ children }: LayoutProps<"/rider">) {
  const user = await requireUser("rider");
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-line bg-white px-4 py-3 pt-[calc(0.75rem+env(safe-area-inset-top))]">
        <Link href="/rider" className="text-lg font-bold text-brand-700">
          JonWin <span className="text-ink">Deliveries</span>
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          {hasRole(user, "boss", "helper", "cook") && (
            <Link href={hasRole(user, "boss", "helper") ? "/admin" : "/admin/production"} className="text-brand-700 underline">
              Admin
            </Link>
          )}
          <Link href="/account/password" className="text-brand-700 underline">
            Password
          </Link>
          <form action={logoutAction}>
            <button type="submit" className="text-muted underline">
              Log out
            </button>
          </form>
        </nav>
      </header>
      <main className="mx-auto max-w-xl px-4 pt-4 pb-[calc(2.5rem+env(safe-area-inset-bottom))]">{children}</main>
    </div>
  );
}
