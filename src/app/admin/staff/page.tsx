import { sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { requireUser } from "@/lib/auth/guard";
import { ROLE_LABELS } from "@/lib/format";
import { formatPhone } from "@/lib/phone";
import { AccountControls, CreateStaffForm, RolesForm } from "./forms";

export const metadata = { title: "Staff" };

export default async function StaffPage() {
  const me = await requireUser("boss");
  const db = await getDb();
  const staff = await db
    .select()
    .from(schema.users)
    .where(sql`${schema.users.roles} && array['boss','helper','cook','rider']::role[]`)
    .orderBy(schema.users.name);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-2xl font-bold">Staff & riders</h1>
      <p className="text-sm text-muted">
        <b>Boss</b>: everything. <b>Helper</b>: sales, owed money, stock, expenses (can&apos;t change prices or void). <b>Cook</b>: production.{" "}
        <b>Rider</b>: deliveries.
      </p>
      <ul className="space-y-2">
        {staff.map((u) => (
          <li key={u.id} className={`card space-y-3 ${u.suspendedAt ? "border-red-200 bg-red-50/40" : ""}`}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-semibold">
                  {u.name} {u.id === me.id && <span className="text-sm font-normal text-muted">(you)</span>}
                </p>
                <p className="text-sm text-muted">
                  {formatPhone(u.phone)}
                  {u.email && ` · ${u.email}`}
                </p>
              </div>
              <div className="flex flex-wrap gap-1">
                {u.roles
                  .filter((r) => r !== "customer")
                  .map((r) => (
                    <span key={r} className="badge bg-brand-50 text-brand-700">
                      {ROLE_LABELS[r]}
                    </span>
                  ))}
                {u.suspendedAt && <span className="badge bg-red-100 text-red-700">Suspended</span>}
              </div>
            </div>
            {u.suspendedAt && <p className="text-sm text-red-700">Reason: {u.suspendedReason}</p>}
            <RolesForm userId={u.id} roles={u.roles} />
            {u.id !== me.id && <AccountControls userId={u.id} suspended={!!u.suspendedAt} hasPassword={!!u.passwordHash} />}
          </li>
        ))}
      </ul>
      <section className="card space-y-3">
        <h2 className="font-semibold">Add staff or rider</h2>
        <CreateStaffForm />
      </section>
    </div>
  );
}
