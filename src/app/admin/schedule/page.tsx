import Link from "next/link";
import { requireUser } from "@/lib/auth/guard";
import { stockLevels } from "@/lib/queries";
import { listScheduled, type ScheduledView } from "@/lib/scheduled";
import { addDaysYmd, daysBetween, fmtDate, ksh, sizeLabel, ymdNairobi } from "@/lib/format";
import { formatPhone } from "@/lib/phone";
import { BookForm, CancelScheduledForm, DoneForm, MoveDateForm, type PickProduct } from "./forms";

export const metadata = { title: "Schedule" };

const TABS = { open: "Coming up", done: "Done", cancelled: "Cancelled" } as const;

const short = (name: string) => name.replace(/^JonWin\s+/, "");

function dayHeading(date: string, today: string): string {
  const d = daysBetween(today, date);
  if (d === 0) return "Today";
  if (d === 1) return "Tomorrow";
  return new Date(date + "T12:00:00").toLocaleDateString("en-KE", { weekday: "long", day: "numeric", month: "short" });
}

function OrderCard({ o, today }: { o: ScheduledView; today: string }) {
  const late = o.status === "scheduled" ? daysBetween(o.dueDate, today) : 0;
  return (
    <article className={`card space-y-3 ${late > 0 ? "border-red-300" : ""}`}>
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-lg font-semibold">{o.customerName}</p>
          {o.customerPhone && (
            <a href={`tel:+${o.customerPhone}`} className="text-sm text-brand-700 underline">
              {formatPhone(o.customerPhone)}
            </a>
          )}
        </div>
        <div className="text-right">
          <p className="font-bold">{ksh(o.total)}</p>
          {late > 0 && <span className="badge bg-red-100 text-red-700">{late} day(s) late</span>}
          {o.status === "done" && o.receiptNo && <p className="text-xs text-muted">Receipt #{o.receiptNo}</p>}
        </div>
      </header>
      <ul className="text-sm">
        {o.lines.map((l) => (
          <li key={l.variantId} className="flex justify-between gap-2">
            <span>
              {l.qty} × {short(l.name)} {sizeLabel(l.sizeMl)}
            </span>
            {o.status === "scheduled" && <span className="text-muted">{ksh(l.qty * l.unitPrice)}</span>}
          </li>
        ))}
      </ul>
      {o.note && <p className="rounded-xl bg-surface px-3 py-2 text-sm">Note: {o.note}</p>}
      {o.status !== "scheduled" && (
        <p className="text-xs text-muted">
          For {fmtDate(o.dueDate)} · {o.status === "done" ? "done" : "cancelled"} {fmtDate(o.updatedAt)}
          {o.cancelReason && ` · ${o.cancelReason}`}
        </p>
      )}
      {o.status === "scheduled" && (
        <>
          <div className="flex flex-wrap gap-2">
            <DoneForm id={o.id} total={o.total} hasPhone={!!o.customerPhone} />
            <MoveDateForm id={o.id} dueDate={o.dueDate} />
          </div>
          <CancelScheduledForm id={o.id} />
        </>
      )}
    </article>
  );
}

export default async function SchedulePage({ searchParams }: PageProps<"/admin/schedule">) {
  await requireUser("boss", "helper");
  const { show } = await searchParams;
  const tab = (typeof show === "string" && show in TABS ? show : "open") as keyof typeof TABS;
  const today = ymdNairobi();
  const tomorrow = addDaysYmd(today, 1);

  const [orders, stock] = await Promise.all([listScheduled(tab === "open" ? "scheduled" : tab, tab === "open" ? 300 : 50), stockLevels()]);

  const products = new Map<string, PickProduct>();
  for (const s of stock.filter((x) => x.isActive)) {
    const p = products.get(s.productId) ?? { id: s.productId, name: s.product, sizes: [] };
    p.sizes.push({ variantId: s.variantId, sizeMl: s.sizeMl, price: s.price });
    products.set(s.productId, p);
  }

  // Group open orders: late ones first, then one heading per day.
  const groups = new Map<string, ScheduledView[]>();
  for (const o of orders) {
    const key = tab === "open" && o.dueDate < today ? "late" : tab === "open" ? o.dueDate : "all";
    groups.set(key, [...(groups.get(key) ?? []), o]);
  }

  // Bottles needed for everything due in the next 7 days (late included), against what's on the shelf.
  const weekEnd = addDaysYmd(today, 7);
  const need = new Map<string, number>();
  if (tab === "open") for (const o of orders) if (o.dueDate <= weekEnd) for (const l of o.lines) need.set(l.variantId, (need.get(l.variantId) ?? 0) + l.qty);
  const needRows = stock
    .filter((s) => need.has(s.variantId))
    .map((s) => ({ ...s, need: need.get(s.variantId)!, short: Math.max(0, need.get(s.variantId)! - Math.max(0, s.onHand)) }));

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-2xl font-bold">Schedule</h1>
      <BookForm products={[...products.values()]} defaultDate={tomorrow} />

      <nav className="flex gap-2" aria-label="Order lists">
        {Object.entries(TABS).map(([k, label]) => (
          <Link key={k} href={`/admin/schedule?show=${k}`} className={k === tab ? "btn-primary" : "btn-secondary"} aria-current={k === tab ? "page" : undefined}>
            {label}
          </Link>
        ))}
      </nav>

      {needRows.length > 0 && (
        <section className="card space-y-2" aria-labelledby="need">
          <h2 id="need" className="font-semibold">
            To have ready this week
          </h2>
          <ul className="text-sm">
            {needRows.map((r) => (
              <li key={r.variantId} className="flex justify-between gap-2">
                <span>
                  {r.need} × {short(r.product)} {sizeLabel(r.sizeMl)}
                </span>
                {r.short > 0 ? (
                  <span className="text-amber-800">{r.short} more to make</span>
                ) : (
                  <span className="text-muted">In stock</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {orders.length === 0 && <p className="card text-muted">{tab === "open" ? "No orders booked. Tap “Book an order” to add one." : "Nothing here yet."}</p>}

      {[...groups].map(([key, list]) => (
        <section key={key} className="space-y-2">
          {key !== "all" && (
            <h2 className={`font-semibold ${key === "late" ? "text-red-700" : ""}`}>
              {key === "late" ? "Late" : dayHeading(key, today)} <span className="font-normal text-muted">· {list.length}</span>
            </h2>
          )}
          {list.map((o) => (
            <OrderCard key={o.id} o={o} today={today} />
          ))}
        </section>
      ))}
    </div>
  );
}
