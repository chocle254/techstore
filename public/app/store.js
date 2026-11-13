// Records live on the phone (IndexedDB) and are copied to the server when there is network.
// Every record: { id, kind, u (time of last change), del, dirty (not yet sent), ...fields }.

const DB_NAME = "jonwin";
let idb = null;
const recs = new Map();
let byKind = null;
const meta = { since: 0, me: null, lastSync: 0, status: "idle", seeded: false };
const listeners = new Set();

function req(r) {
  return new Promise((ok, bad) => {
    r.onsuccess = () => ok(r.result);
    r.onerror = () => bad(r.error);
  });
}

function openDb() {
  return new Promise((ok, bad) => {
    const r = indexedDB.open(DB_NAME, 1);
    r.onupgradeneeded = () => {
      r.result.createObjectStore("recs", { keyPath: "id" });
      r.result.createObjectStore("meta", { keyPath: "k" });
    };
    r.onsuccess = () => ok(r.result);
    r.onerror = () => bad(r.error);
  });
}

function writeAll(list, metaToo) {
  return new Promise((ok, bad) => {
    const tx = idb.transaction(metaToo ? ["recs", "meta"] : ["recs"], "readwrite");
    const s = tx.objectStore("recs");
    for (const r of list) s.put(r);
    if (metaToo) {
      const m = tx.objectStore("meta");
      for (const k of ["since", "me", "lastSync", "seeded"]) m.put({ k, v: meta[k] });
    }
    tx.oncomplete = () => ok();
    tx.onerror = () => bad(tx.error);
  });
}

export async function open() {
  idb = await openDb();
  const tx = idb.transaction(["recs", "meta"]);
  const [all, metas] = await Promise.all([req(tx.objectStore("recs").getAll()), req(tx.objectStore("meta").getAll())]);
  for (const r of all) recs.set(r.id, r);
  for (const m of metas) meta[m.k] = m.v;
  byKind = null;
}

export const getMeta = () => meta;
export async function setMeta(patch) {
  Object.assign(meta, patch);
  await writeAll([], true);
  emit();
}

export function onChange(fn) {
  listeners.add(fn);
}
function emit() {
  for (const fn of listeners) fn();
}

function index() {
  if (byKind) return byKind;
  byKind = {};
  for (const r of recs.values()) {
    if (r.del) continue;
    (byKind[r.kind] ||= []).push(r);
  }
  return byKind;
}

/** All live records of one kind. Don't change the returned objects; use save(). */
export const list = (kind) => index()[kind] || [];
export const get = (id) => {
  const r = recs.get(id);
  return r && !r.del ? r : null;
};
export const waiting = () => {
  let n = 0;
  for (const r of recs.values()) if (r.dirty) n++;
  return n;
};

export function newId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
}

/** Create or update a record. Returns the saved record. */
export async function save(kind, fields) {
  const old = fields.id ? recs.get(fields.id) : null;
  const rec = {
    ...(old || {}),
    ...fields,
    id: fields.id || newId(),
    kind,
    u: Math.max(Date.now(), (old?.u || 0) + 1),
    del: false,
    dirty: 1,
  };
  if (!old) {
    rec.at = Date.now();
    rec.by = meta.me?.name || "";
  }
  recs.set(rec.id, rec);
  byKind = null;
  await writeAll([rec]);
  emit();
  soon();
  return rec;
}

export async function remove(id) {
  const old = recs.get(id);
  if (!old) return;
  const rec = { ...old, del: true, dirty: 1, u: Math.max(Date.now(), old.u + 1) };
  recs.set(id, rec);
  byKind = null;
  await writeAll([rec]);
  emit();
  soon();
}

// ---------- Sync ----------
const LOCAL = new Set(["id", "kind", "u", "del", "dirty"]);
function toWire(r) {
  const data = {};
  for (const k in r) if (!LOCAL.has(k)) data[k] = r[k];
  return { id: r.id, kind: r.kind, u: r.u, del: !!r.del, data };
}

let running = false;
let again = false;
let timer = 0;

function soon() {
  clearTimeout(timer);
  timer = setTimeout(sync, 1500);
}

function setStatus(s) {
  if (meta.status !== s) {
    meta.status = s;
    emit();
  }
}

export async function sync() {
  if (!meta.me) return;
  if (running) {
    again = true;
    return;
  }
  if (!navigator.onLine) return setStatus("offline");
  running = true;
  setStatus("syncing");
  try {
    let more = true;
    while (more) {
      const sent = [];
      for (const r of recs.values()) {
        if (r.dirty) sent.push(r);
        if (sent.length >= 400) break;
      }
      const ctl = new AbortController();
      const t = setTimeout(() => ctl.abort(), 30000);
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ since: meta.since || 0, changes: sent.map(toWire) }),
        signal: ctl.signal,
      }).finally(() => clearTimeout(t));
      if (res.status === 401) {
        setStatus("login");
        running = false;
        return;
      }
      if (!res.ok) throw new Error("sync " + res.status);
      const j = await res.json();
      const changed = [];
      for (const s of sent) {
        const cur = recs.get(s.id);
        if (cur && cur.u === s.u && cur.dirty) {
          cur.dirty = 0;
          changed.push(cur);
        }
      }
      for (const c of j.changes) {
        const cur = recs.get(c.id);
        if (cur && (cur.u > c.u || (cur.u === c.u && !cur.dirty))) continue;
        const r = { ...c.data, id: c.id, kind: c.kind, u: c.u, del: c.del, dirty: 0 };
        recs.set(r.id, r);
        changed.push(r);
      }
      meta.since = j.seq;
      meta.lastSync = Date.now();
      if (j.me) meta.me = { ...meta.me, ...j.me };
      byKind = null;
      await writeAll(changed, true);
      if (changed.length) emit();
      more = j.more || sent.length >= 400;
    }
    setStatus(waiting() ? "waiting" : "synced");
  } catch {
    setStatus(navigator.onLine ? "error" : "offline");
  }
  running = false;
  if (again) {
    again = false;
    soon();
  }
}

/** Everything on this phone, for a backup file. */
export function exportAll() {
  return { app: "jonwin", exported: new Date().toISOString(), records: [...recs.values()] };
}

/** Forget everything on this phone (after logging out). Unsent records are lost. */
export async function wipe() {
  recs.clear();
  byKind = null;
  Object.assign(meta, { since: 0, me: null, lastSync: 0, status: "idle", seeded: false });
  await new Promise((ok, bad) => {
    const tx = idb.transaction(["recs", "meta"], "readwrite");
    tx.objectStore("recs").clear();
    tx.objectStore("meta").clear();
    tx.oncomplete = () => ok();
    tx.onerror = () => bad(tx.error);
  });
  emit();
}
