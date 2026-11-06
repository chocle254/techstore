"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export type NavItem = { href: string; label: string; icon: string; primary?: boolean };

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

export function AdminNav({ home, items, userName, logout }: { home: string; items: NavItem[]; userName: string; logout: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const primary = items.filter((i) => i.primary).slice(0, 4);

  return (
    <>
      {/* Desktop / tablet sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-56 shrink-0 flex-col border-r border-line bg-white p-3 md:flex">
        <Link href={home} className="px-2 py-3 text-lg font-bold text-brand-700">
          JonWin <span className="text-ink">Admin</span>
        </Link>
        <nav className="mt-2 flex-1 space-y-0.5 overflow-y-auto">
          {items.map((i) => (
            <Link
              key={i.href}
              href={i.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${
                isActive(pathname, i.href) ? "bg-brand-50 text-brand-700" : "text-ink hover:bg-surface"
              }`}
            >
              <span aria-hidden>{i.icon}</span>
              {i.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-line pt-3 text-sm">
          <p className="truncate px-3 text-muted">{userName}</p>
          <Link href="/account/password" className="block rounded-lg px-3 py-2 hover:bg-surface">
            Change password
          </Link>
          {logout}
        </div>
      </aside>

      {/* Phone bottom bar */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-line bg-white pb-[env(safe-area-inset-bottom)] md:hidden"
        aria-label="Main"
      >
        {primary.map((i) => (
          <Link
            key={i.href}
            href={i.href}
            className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${
              isActive(pathname, i.href) ? "text-brand-700" : "text-muted"
            }`}
          >
            <span className="text-xl leading-none" aria-hidden>
              {i.icon}
            </span>
            {i.label}
          </Link>
        ))}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium text-muted"
          aria-expanded={open}
        >
          <span className="text-xl leading-none" aria-hidden>
            ☰
          </span>
          More
        </button>
      </nav>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="All pages">
          <button type="button" className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} aria-label="Close menu" />
          <div className="absolute inset-x-0 bottom-0 max-h-[80dvh] overflow-y-auto rounded-t-3xl bg-white p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <p className="mb-2 px-2 text-sm text-muted">{userName}</p>
            <div className="grid grid-cols-3 gap-2">
              {items.map((i) => (
                <Link
                  key={i.href}
                  href={i.href}
                  onClick={() => setOpen(false)}
                  className={`flex flex-col items-center gap-1 rounded-2xl border p-3 text-center text-xs font-medium ${
                    isActive(pathname, i.href) ? "border-brand-500 bg-brand-50 text-brand-700" : "border-line"
                  }`}
                >
                  <span className="text-2xl" aria-hidden>
                    {i.icon}
                  </span>
                  {i.label}
                </Link>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Link href="/account/password" onClick={() => setOpen(false)} className="btn-secondary">
                Password
              </Link>
              {logout}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
