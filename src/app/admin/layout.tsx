import { requireUser, hasRole } from "@/lib/auth/guard";
import { logoutAction } from "@/lib/auth/actions";
import { AdminNav, type NavItem } from "./nav";

export const metadata = { title: { default: "Admin", template: "%s · JonWin Admin" } };

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await requireUser("boss", "helper", "cook");
  const isBoss = hasRole(user, "boss");
  const isOffice = hasRole(user, "boss", "helper");
  const isCook = hasRole(user, "cook");

  const items: NavItem[] = [
    ...(isOffice
      ? [
          { href: "/admin", label: "Dashboard", icon: "📊", primary: true },
          { href: "/admin/orders", label: "Orders", icon: "🛒", primary: true },
          { href: "/admin/sell", label: "Sell", icon: "🧾", primary: true },
          { href: "/admin/owed", label: "Owed", icon: "⏳", primary: true },
          { href: "/admin/sales", label: "Sales", icon: "📒" },
          { href: "/admin/products", label: "Products", icon: "🧴" },
          { href: "/admin/stock", label: "Stock", icon: "📦" },
          ...(isCook ? [] : [{ href: "/admin/production", label: "Kitchen", icon: "🧪" }]),
          { href: "/admin/chemicals", label: "Chemicals", icon: "⚗️" },
          { href: "/admin/expenses", label: "Expenses", icon: "💸" },
          { href: "/admin/customers", label: "Customers", icon: "👥" },
          { href: "/admin/areas", label: "Delivery areas", icon: "📍" },
        ]
      : []),
    ...(isCook ? [{ href: "/admin/production", label: "Kitchen", icon: "🧪", primary: true }] : []),
    ...(hasRole(user, "rider") ? [{ href: "/rider", label: "My deliveries", icon: "🛵", primary: !isOffice }] : []),
    ...(isBoss
      ? [
          { href: "/admin/staff", label: "Staff", icon: "🪪" },
          { href: "/admin/audit", label: "Activity log", icon: "🔍" },
        ]
      : []),
  ];

  const logout = (
    <form action={logoutAction}>
      <button type="submit" className="btn-secondary w-full md:min-h-0 md:justify-start md:border-0 md:px-3 md:py-2 md:text-sm md:font-normal">
        Log out
      </button>
    </form>
  );

  return (
    <div className="flex min-h-dvh">
      <AdminNav home={items[0]?.href ?? "/admin"} items={items} userName={user.name} logout={logout} />
      <main className="min-w-0 flex-1 px-4 pt-4 pb-24 md:px-8 md:pt-8 md:pb-10">{children}</main>
    </div>
  );
}
