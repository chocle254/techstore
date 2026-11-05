import { desc, eq, lt } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { requireUser } from "@/lib/auth/guard";
import { fmtDateTime } from "@/lib/format";

export const metadata = { title: "Activity log" };

const ACTIONS: Record<string, string> = {
  login: "Logged in",
  locked: "Account locked (wrong passwords)",
  password_changed: "Changed password",
  password_reset_requested: "Asked for password reset",
  password_reset: "Reset password by email",
  password_reset_by_boss: "Password reset by boss",
  sale_recorded: "Recorded a sale",
  sale_voided: "Voided a sale",
  payment_recorded: "Recorded a payment",
  price_changed: "Changed price",
  product_created: "Added product",
  product_updated: "Edited product",
  size_added: "Added size",
  stock_added: "Added stock",
  stock_corrected: "Corrected stock",
  expense_added: "Added expense",
  expense_voided: "Voided expense",
  staff_created: "Added staff",
  staff_updated: "Updated staff",
  roles_changed: "Changed roles",
  suspended: "Suspended account",
  unsuspended: "Unsuspended account",
  marked_trusted: "Marked customer trusted",
  unmarked_trusted: "Removed trusted",
};

const PAGE = 50;

export default async function AuditPage({ searchParams }: PageProps<"/admin/audit">) {
  await requireUser("boss");
  const sp = await searchParams;
  const before = typeof sp.before === "string" && !Number.isNaN(Date.parse(sp.before)) ? new Date(sp.before) : null;
  const db = await getDb();
  const rows = await db
    .select({
      id: schema.auditLog.id,
      action: schema.auditLog.action,
      entity: schema.auditLog.entity,
      details: schema.auditLog.details,
      createdAt: schema.auditLog.createdAt,
      who: schema.users.name,
    })
    .from(schema.auditLog)
    .leftJoin(schema.users, eq(schema.users.id, schema.auditLog.actorId))
    .where(before ? lt(schema.auditLog.createdAt, before) : undefined)
    .orderBy(desc(schema.auditLog.createdAt))
    .limit(PAGE);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-2xl font-bold">Activity log</h1>
      <p className="text-sm text-muted">Every change is recorded here and can&apos;t be edited or deleted.</p>
      <ul className="card divide-y divide-line p-0">
        {rows.map((r) => (
          <li key={r.id} className="px-4 py-2.5 text-sm">
            <p>
              <b>{r.who ?? "System"}</b> · {ACTIONS[r.action] ?? r.action}
            </p>
            <p className="text-xs text-muted">
              {fmtDateTime(r.createdAt)}
              {r.details ? ` · ${JSON.stringify(r.details).slice(0, 160)}` : ""}
            </p>
          </li>
        ))}
        {rows.length === 0 && <li className="px-4 py-3 text-muted">Nothing yet.</li>}
      </ul>
      {rows.length === PAGE && (
        <a className="btn-secondary" href={`?before=${encodeURIComponent(rows[rows.length - 1].createdAt.toISOString())}`}>
          Older →
        </a>
      )}
    </div>
  );
}
