import "server-only";
import { sql } from "drizzle-orm";
import type { DB } from "@/db";

// Every record the phones keep (sales, orders, customers, …) is one row here.
// `seq` grows on every write, so a phone asks "what changed after seq N?".
// `u` is the phone's own time of the change; the newest change to a record wins.
let ready: Promise<void> | null = null;

export function ensureSyncTable(db: DB) {
  ready ??= (async () => {
    await db.execute(sql`create sequence if not exists sync_seq`);
    await db.execute(sql`create table if not exists sync_records (
      id text primary key,
      kind text not null,
      data jsonb not null,
      u bigint not null,
      del boolean not null default false,
      by_user uuid,
      seq bigint not null,
      saved_at timestamptz not null default now()
    )`);
    await db.execute(sql`create index if not exists sync_records_seq_idx on sync_records (seq)`);
  })().catch((e) => {
    ready = null;
    throw e;
  });
  return ready;
}

export type SyncChange = { id: string; kind: string; u: number; del: boolean; data: Record<string, unknown> };

const rowsOf = (r: unknown) => ((r as { rows?: unknown[] }).rows ?? (r as unknown[])) as Record<string, unknown>[];

export async function pushChanges(db: DB, userId: string, changes: SyncChange[]) {
  if (!changes.length) return;
  const payload = JSON.stringify(changes);
  // One writer at a time, so seq numbers become visible in order and no phone skips a change.
  await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(771001)`);
    await tx.execute(sql`
      insert into sync_records (id, kind, data, u, del, by_user, seq)
      select x.id, x.kind, x.data, x.u, x.del, ${userId}::uuid, nextval('sync_seq')
      from jsonb_to_recordset(${payload}::jsonb) as x(id text, kind text, data jsonb, u bigint, del boolean)
      on conflict (id) do update set
        kind = excluded.kind, data = excluded.data, u = excluded.u, del = excluded.del,
        by_user = excluded.by_user, seq = excluded.seq, saved_at = now()
      where sync_records.u <= excluded.u`);
  });
}

/**
 * Mark every live record of these kinds as deleted. The deletes get new seq numbers and a newer `u`,
 * so every phone drops its copies on its next sync, and older unsent edits can't bring them back.
 */
export async function resetRecords(db: DB, userId: string, kinds: string[]) {
  const now = Date.now();
  const kindList = JSON.stringify(kinds);
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(771001)`);
    const res = await tx.execute(sql`
      update sync_records set
        del = true, data = '{}'::jsonb, u = greatest(u + 1, ${now}::bigint),
        by_user = ${userId}::uuid, seq = nextval('sync_seq'), saved_at = now()
      where del = false and kind in (select jsonb_array_elements_text(${kindList}::jsonb))
      returning id`);
    return rowsOf(res).length;
  });
}

const PAGE = 1000;

/** Records changed after `since`; with `kinds`, only those kinds (a Production phone). */
export async function pullChanges(db: DB, since: number, kinds: string[] | null = null) {
  const res = kinds
    ? await db.execute(sql`
        select id, kind, data, u, del, seq from sync_records
        where seq > ${since} and kind in (select jsonb_array_elements_text(${JSON.stringify(kinds)}::jsonb))
        order by seq limit ${PAGE}`)
    : await db.execute(sql`
        select id, kind, data, u, del, seq from sync_records where seq > ${since} order by seq limit ${PAGE}`);
  const rows = rowsOf(res);
  const changes = rows.map((r) => ({ id: r.id, kind: r.kind, data: r.data, u: Number(r.u), del: Boolean(r.del) }));
  const last = rows.length ? Number(rows[rows.length - 1].seq) : since;
  return { changes, seq: last, more: rows.length === PAGE };
}
