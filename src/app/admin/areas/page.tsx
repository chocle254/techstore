import { asc } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { hasRole, requireUser } from "@/lib/auth/guard";
import { ksh } from "@/lib/format";
import { AreaForm } from "./forms";

export const metadata = { title: "Delivery areas" };

export default async function AreasPage() {
  const user = await requireUser("boss", "helper");
  const canEdit = hasRole(user, "boss");
  const db = await getDb();
  const areas = await db.select().from(schema.deliveryAreas).orderBy(asc(schema.deliveryAreas.name));

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-2xl font-bold">Delivery areas</h1>
      <p className="text-sm text-muted">
        Customers choose one of these at checkout, and its fee is added to the order once. Turn an area off instead of deleting it, so old orders keep their record.
      </p>
      {areas.length === 0 && <p className="card">No areas yet. The shop can&apos;t take orders until you add at least one.</p>}
      {canEdit ? (
        <>
          {areas.map((a) => (
            <section key={a.id} className={`card ${a.isActive ? "" : "opacity-60"}`}>
              <AreaForm area={a} />
            </section>
          ))}
          <section className="card space-y-2">
            <h2 className="font-semibold">Add an area</h2>
            <AreaForm />
          </section>
        </>
      ) : (
        <ul className="card divide-y divide-line">
          {areas.map((a) => (
            <li key={a.id} className="flex justify-between py-2">
              <span>
                {a.name} {!a.isActive && <span className="badge bg-surface text-muted">Off</span>}
              </span>
              <span>{ksh(a.fee)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
