// Keeps the app on the phone so it opens with no network.
// Change VERSION whenever a file in /public/app or index.html changes.
const VERSION = "jw-2026-11-15-5";
const FILES = ["/", "/app/app.css", "/app/main.js", "/app/store.js", "/app/logic.js", "/app/pdf.js", "/manifest.webmanifest", "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches
      .open(VERSION)
      .then((c) => c.addAll(FILES.map((f) => new Request(f, { cache: "reload" }))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin || url.pathname.startsWith("/api/")) return;
  // Every page is the same app; the part after # picks the screen.
  const key = req.mode === "navigate" ? "/" : url.pathname;
  e.respondWith(
    caches.open(VERSION).then((c) =>
      c.match(key).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok && FILES.includes(key)) c.put(key, res.clone());
            return res;
          }),
      ),
    ),
  );
});

// ---------- Pay-later reminders ----------
// Chrome wakes an installed app about once a day ("periodic sync"); we read the records saved on the
// phone and show a notification for money due today or late. The same sums as unpaid() in logic.js.
const pad = (n) => (n < 10 ? "0" : "") + n;
const ymd = (d) => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
const plusDays = (s, n) => {
  const [y, m, d] = s.split("-").map(Number);
  return ymd(new Date(y, m - 1, d + n, 12));
};

function readRecords() {
  return new Promise((ok, bad) => {
    const r = indexedDB.open("jonwin", 1);
    r.onupgradeneeded = () => r.transaction.abort(); // app never opened here: nothing to read
    r.onerror = () => bad(r.error);
    r.onsuccess = () => {
      const g = r.result.transaction("recs").objectStore("recs").getAll();
      g.onsuccess = () => ok(g.result.filter((x) => !x.del));
      g.onerror = () => bad(g.error);
    };
  });
}

async function readMe() {
  return new Promise((ok) => {
    const r = indexedDB.open("jonwin", 1);
    r.onupgradeneeded = () => r.transaction.abort();
    r.onerror = () => ok(null);
    r.onsuccess = () => {
      const g = r.result.transaction("meta").objectStore("meta").get("me");
      g.onsuccess = () => ok(g.result?.v || null);
      g.onerror = () => ok(null);
    };
  });
}

async function remindChem(recs) {
  const left = {};
  const names = {};
  for (const r of recs) {
    if (r.kind === "product" && !r.off) (names[r.id] = r.short || r.name), (left[r.id] ??= 0);
    if (r.kind === "chemmove" && r.p) left[r.p] = (left[r.p] || 0) + (r.qty || 0);
    if (r.kind === "batch") left[r.p] = (left[r.p] || 0) - (r.n || 0);
  }
  const low = Object.keys(names).filter((id) => left[id] <= 1);
  if (!low.length) return;
  await self.registration.showNotification("⚗️ Chemicals running out", {
    body: low.map((id) => `${names[id]}: ${Math.max(0, left[id])} batch${left[id] === 1 ? "" : "es"} left`).join(", "),
    tag: "chem",
    icon: "/icon-192.png",
    data: { url: "/#/chems" },
  });
}

async function remindDue() {
  const recs = await readRecords();
  const me = await readMe();
  if (!me) return;
  await remindChem(recs);
  const roles = me.roles || [];
  if (!roles.includes("boss") && roles.includes("cook")) return; // Production: no money reminders
  const today = ymd(new Date());
  const bal = {};
  const sales = {};
  const names = {};
  for (const r of recs) {
    if (r.kind === "customer") names[r.id] = r.name;
    if (r.kind === "sale" && r.pay === "later" && !r.voided && r.customer) {
      bal[r.customer] = (bal[r.customer] || 0) + r.total;
      (sales[r.customer] ||= []).push(r);
    }
    if (r.kind === "payment" && !r.voided) bal[r.customer] = (bal[r.customer] || 0) - r.amount;
  }
  const due = [];
  for (const [cid, list] of Object.entries(sales)) {
    let left = bal[cid] || 0;
    if (left <= 0 || !names[cid]) continue;
    list.sort((a, b) => b.date.localeCompare(a.date) || b.u - a.u);
    let first = null;
    for (const s of list) {
      if (left <= 0) break;
      left -= s.total;
      const d = s.due || plusDays(s.date, 7);
      if (!first || d < first) first = d;
    }
    if (first && first <= today) due.push({ name: names[cid], owed: bal[cid], late: first < today });
  }
  if (!due.length) return;
  const money = (n) => "KSh " + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const total = due.reduce((a, d) => a + d.owed, 0);
  await self.registration.showNotification(`💰 ${money(total)} due from ${due.length} customer${due.length > 1 ? "s" : ""}`, {
    body: due.map((d) => `${d.name} ${money(d.owed)}${d.late ? " (late)" : ""}`).join(", "),
    tag: "due",
    icon: "/icon-192.png",
    data: { url: "/#/home" },
  });
}

self.addEventListener("periodicsync", (e) => {
  if (e.tag === "due") e.waitUntil(remindDue().catch(() => {}));
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = e.notification.data?.url || "/";
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      const w = list[0];
      if (w) return w.focus().then(() => w.navigate(url).catch(() => {}));
      return self.clients.openWindow(url);
    }),
  );
});
