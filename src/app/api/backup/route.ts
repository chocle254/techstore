import { timingSafeEqual } from "node:crypto";
import { sql } from "drizzle-orm";
import { getDb } from "@/db";
import { currentUser, isBoss, json, sameOrigin } from "@/lib/server/session";
import { ensureSyncTable } from "@/lib/server/sync-store";

// A copy of every record, kept outside the database (Vercel Blob, private), so the records survive
// the database failing or being lost. Made every night by a Vercel cron, or by the boss with "Back up now".
// The file has the same shape as the phone's backup file, so either can be restored from the phone.

const PREFIX = "backups/";
const KEEP = 45;

const rowsOf = (r: unknown) => ((r as { rows?: unknown[] }).rows ?? (r as unknown[])) as Record<string, unknown>[];
const hasBlob = () => !!(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);

function isCron(req: Request) {
  const secret = process.env.CRON_SECRET;
  const got = req.headers.get("authorization") || "";
  if (!secret) return false;
  const want = Buffer.from("Bearer " + secret);
  const have = Buffer.from(got);
  return have.length === want.length && timingSafeEqual(have, want);
}

async function snapshot() {
  const db = await getDb();
  await ensureSyncTable(db);
  const res = await db.execute(sql`select id, kind, data, u from sync_records where del = false order by kind, id`);
  const records = rowsOf(res).map((r) => ({ ...(r.data as Record<string, unknown>), id: r.id, kind: r.kind, u: Number(r.u), del: false }));
  return { app: "jonwin", from: "server", exported: new Date().toISOString(), records };
}

async function makeBackup() {
  const { put, list, del } = await import("@vercel/blob");
  const snap = await snapshot();
  const name = PREFIX + "jonwin-" + snap.exported.replace(/[:.]/g, "-") + ".json";
  await put(name, JSON.stringify(snap), { access: "private", contentType: "application/json", addRandomSuffix: true });
  // Keep the newest ones only.
  const { blobs } = await list({ prefix: PREFIX, limit: 1000 });
  const old = blobs.sort((a, b) => +new Date(b.uploadedAt) - +new Date(a.uploadedAt)).slice(KEEP);
  if (old.length) await del(old.map((b) => b.url));
  return { saved: name, records: snap.records.length };
}

/** Cron: make tonight's backup. Boss: download the newest backup (or a fresh copy if none is stored). */
export async function GET(req: Request) {
  if (isCron(req)) {
    if (!hasBlob()) return json({ error: "No Blob store connected" }, 503);
    try {
      return json(await makeBackup());
    } catch (e) {
      console.error("Backup failed", e);
      return json({ error: "Backup failed" }, 500);
    }
  }
  const me = await currentUser();
  if (!me) return json({ error: "login" }, 401);
  if (!isBoss(me)) return json({ error: "Only the boss can download backups." }, 403);
  let body: string | ReadableStream<Uint8Array> | null = null;
  let when = new Date().toISOString().slice(0, 10);
  if (hasBlob()) {
    try {
      const { list, get } = await import("@vercel/blob");
      const { blobs } = await list({ prefix: PREFIX, limit: 1000 });
      const newest = blobs.sort((a, b) => +new Date(b.uploadedAt) - +new Date(a.uploadedAt))[0];
      if (newest) {
        const r = await get(newest.url, { access: "private", useCache: false });
        if (r?.statusCode === 200) {
          body = r.stream;
          when = new Date(newest.uploadedAt).toISOString().slice(0, 10);
        }
      }
    } catch (e) {
      console.error("Reading backup failed", e);
    }
  }
  // No stored backup (or Blob is down): give a fresh copy straight from the database.
  if (!body) body = JSON.stringify(await snapshot());
  return new Response(body, {
    headers: {
      "content-type": "application/json",
      "content-disposition": `attachment; filename="jonwin-server-backup-${when}.json"`,
      "cache-control": "no-store",
    },
  });
}

/** Boss: back up now. */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return json({ error: "Bad origin" }, 403);
  const me = await currentUser();
  if (!me) return json({ error: "login" }, 401);
  if (!isBoss(me)) return json({ error: "Only the boss can make backups." }, 403);
  if (!hasBlob()) return json({ error: "Backups aren't set up yet (no Blob store connected)." }, 503);
  try {
    return json(await makeBackup());
  } catch (e) {
    console.error("Backup failed", e);
    return json({ error: "Backup failed. Try again later." }, 500);
  }
}
