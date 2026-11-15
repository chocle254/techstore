// JonWin records app. Plain JavaScript, no framework, so it stays quick on a cheap phone.
import * as S from "./store.js";
import * as L from "./logic.js";

const app = document.getElementById("app");
const esc = (v) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const attr = esc;
const me = () => S.getMeta().me;
const isBoss = () => !!me()?.roles?.includes("boss");
// ---------- Icons ----------
// One drawn set: 24px grid, 1.9 stroke, round ends, coloured by the text around them.
const ICONS = {
  home: '<path d="M3.5 10.5 12 3.5l8.5 7"/><path d="M5.5 9v11h13V9"/><path d="M10 20v-5.5h4V20"/>',
  cart: '<circle cx="9.5" cy="19.5" r="1.4"/><circle cx="17.5" cy="19.5" r="1.4"/><path d="M2.5 3.5h2.8l2.3 11.5h11l2-8.5H6.3"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  flask: '<path d="M9 3.5h6M10 3.5v6L4.8 18a2 2 0 0 0 1.7 3h11a2 2 0 0 0 1.7-3L14 9.5v-6"/><path d="M7.3 15h9.4"/>',
  layers: '<path d="m12 3.5 8.5 4.5-8.5 4.5L3.5 8 12 3.5Z"/><path d="m3.5 12.5 8.5 4.5 8.5-4.5"/><path d="m3.5 16.5 8.5 4.5 8.5-4.5"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4.5 20.5a7.5 7.5 0 0 1 15 0"/>',
  users: '<circle cx="9" cy="8.5" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M15.5 5.3a3.5 3.5 0 0 1 0 6.4M18 14.3a6.5 6.5 0 0 1 3.5 5.7"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  x: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
  chev: '<path d="m9.5 6 6 6-6 6"/>',
  back: '<path d="m14.5 6-6 6 6 6"/>',
  up: '<path d="M12 19V5M6.5 10.5 12 5l5.5 5.5"/>',
  down: '<path d="M12 5v14M6.5 13.5 12 19l5.5-5.5"/>',
  phone: '<path d="M5.2 3.5h3l1.6 4.3-2 1.3a11 11 0 0 0 5.6 5.6l1.3-2 4.3 1.6v3a2.3 2.3 0 0 1-2.5 2.3A16.5 16.5 0 0 1 2.9 6a2.3 2.3 0 0 1 2.3-2.5Z"/>',
  message: '<path d="M4 5h16v11H9.5L4 20V5Z"/><path d="M8 9.5h8M8 12.5h5"/>',
  file: '<path d="M14 3H6.5A1.5 1.5 0 0 0 5 4.5v15A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5V8l-5-5Z"/><path d="M14 3v5h5M8.5 13h7M8.5 17h5"/>',
  download: '<path d="M12 4v11M7 10.5l5 5 5-5M5 20h14"/>',
  bell: '<path d="M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15L6 16Z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
  truck: '<path d="M3 6h11v10H3V6ZM14 9.5h4l3 3.5V16h-7"/><circle cx="7" cy="18" r="1.8"/><circle cx="17" cy="18" r="1.8"/>',
  receipt: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z"/><path d="M9 8h6M9 12h6"/>',
  wallet: '<path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H19v14H6.5A2.5 2.5 0 0 1 4 16.5v-9Z"/><path d="M15 12h4"/>',
  out: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5v9M8.8 13.3 12 16.5l3.2-3.2"/>',
  chart: '<path d="M4 4v16h16"/><path d="M8.5 16v-4M12.5 16V8M16.5 16v-6"/>',
  bottle: '<path d="M10 2.5h4M10.5 2.5v3L8 9v10.5A1.5 1.5 0 0 0 9.5 21h5a1.5 1.5 0 0 0 1.5-1.5V9l-2.5-3.5v-3"/><path d="M8 13.5h8"/>',
  pin: '<path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11Z"/><circle cx="12" cy="10" r="2.3"/>',
  key: '<circle cx="8" cy="15.5" r="4"/><path d="m11 12.5 8.5-8.5M16 7.5l2.5 2.5"/>',
  chat: '<path d="M4.5 19.5 5.6 16A8 8 0 1 1 8.4 18.6L4.5 19.5Z"/><path d="M9 10.5h6M9 13.5h4"/>',
  paste: '<rect x="5" y="4.5" width="14" height="16.5" rx="2"/><path d="M9 4.5V3.5h6v1M9 11h6M9 15h4"/>',
  sun: '<circle cx="12" cy="12" r="3.8"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4"/>',
  install: '<rect x="6.5" y="2.5" width="11" height="19" rx="2.5"/><path d="M12 7v7M9.3 11.5 12 14.2l2.7-2.7"/>',
};
const ic = (name, cls = "") => `<svg class="i${cls ? " " + cls : ""}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name]}</svg>`;
const CHEV = ic("chev", "chev");
/** Coloured or no-colour batch: a filled or empty swatch. */
const sw = (col) => `<i class="sw ${col ? "col" : "plain"}" aria-hidden="true"></i>`;

const PAY = { cash: "Cash", mpesa: "M-Pesa", later: "Pay later" };
// "cook" is stored on the server; it is shown as Production.
const ROLE_NAME = { boss: "Boss", helper: "Helper", cook: "Production" };
const roleText = (roles) => (roles || []).filter((r) => ROLE_NAME[r]).map((r) => ROLE_NAME[r]).join(", ");
/** Production only sees what to make and the chemicals. */
const isProd = () => !isBoss() && !!me()?.roles?.includes("cook");
const PROD_VIEWS = new Set(["make", "chems", "chem", "account", "password"]);

// Screen state that must survive a redraw (cart, order being written, …).
const st = { cart: [], cartPlace: null, cartCustomer: "", draft: null, showPast: false, sheet: null, askDue: null, mp: null, people: null, peopleErr: "", tempPw: "" };
let editing = false;
let installEvt = null;

// ---------- Small helpers ----------
function toast(msg, bad) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.className = "toast show" + (bad ? " bad" : "");
  clearTimeout(toast.t);
  toast.t = setTimeout(() => (t.className = "toast"), 2600);
}
const go = (h) => {
  if (location.hash === h) render();
  else location.hash = h;
};
const route = () => {
  const parts = location.hash.replace(/^#\/?/, "").split("/");
  return { name: parts[0] || "home", arg: parts[1] ? decodeURIComponent(parts[1]) : "", arg2: parts[2] ? decodeURIComponent(parts[2]) : "" };
};
const opts = (list, val, blank) =>
  (blank != null ? `<option value="">${esc(blank)}</option>` : "") +
  list.map((o) => `<option value="${attr(o.v)}"${String(o.v) === String(val ?? "") ? " selected" : ""}>${esc(o.t)}</option>`).join("");
const placeOpts = (val, blank = "—") => opts(L.places().map((p) => ({ v: p.id, t: p.name + (p.day ? " (" + L.DAYS[p.day].slice(0, 3) + ")" : "") })), val, blank);
const dot = (p) => `<i class="dot" style="background:${attr(p?.color || "#888")}"></i>`;
const num = (v) => {
  const n = Number(String(v ?? "").replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
};
async function api(path, body) {
  const res = await fetch(path, {
    method: body ? "POST" : "GET",
    headers: body ? { "content-type": "application/json" } : {},
    credentials: "same-origin",
    body: body ? JSON.stringify(body) : undefined,
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(j.error || "Something went wrong (" + res.status + ")");
  return j;
}

// ---------- Layout ----------
const NAV = [
  ["home", "home", "Home"],
  ["sell", "cart", "Sell"],
  ["orders", "calendar", "Orders"],
  ["chems", "flask", "Chemicals"],
  ["more", "menu", "More"],
];
const PROD_NAV = [
  ["make", "layers", "Batches"],
  ["chems", "flask", "Chemicals"],
  ["account", "user", "Account"],
];
const SUB = { mpesa: "home", summary: "home", sales: "more", owed: "more", customers: "more", customer: "more", expenses: "more", reports: "more", products: "more", product: "more", places: "more", team: "more", account: "more", order: "orders", chem: "chems", password: "account" };

function syncPill() {
  const m = S.getMeta();
  const w = S.waiting();
  const map = {
    synced: ["ok", "Saved online"],
    syncing: ["busy", "Sending…"],
    offline: ["off", w ? w + " on phone" : "Offline"],
    waiting: ["busy", w + " waiting"],
    error: ["off", w ? w + " waiting" : "No network"],
    login: ["bad", "Log in to send"],
    idle: ["off", w ? w + " waiting" : "On phone"],
  };
  const [cls, text] = map[m.status] || map.idle;
  return `<a href="#/${m.status === "login" ? "login" : "account"}" id="sync" class="pill ${cls}">${esc(text)}</a>`;
}

function shell(name, title, body, back) {
  const active = SUB[name] || name;
  return `<header class="top">${back ? `<a class="back" href="${attr(back)}" aria-label="Back">${ic("back")}</a>` : ""}<h1>${esc(title)}</h1>${syncPill()}</header>
<main>${body}</main>
<nav class="tabs">${(isProd() ? PROD_NAV : NAV).map(([k, i, t]) => `<a href="#/${k}" class="${k === active ? "on" : ""}">${ic(i)}<span>${t}</span></a>`).join("")}</nav>`;
}

function render() {
  editing = false;
  const m = S.getMeta();
  const r = route();
  if (!m.me || r.name === "login") return (app.innerHTML = loginView());
  if (m.me.mustChangePassword) return (app.innerHTML = passwordView(true));
  if (!L.products().length && r.name !== "account") {
    app.innerHTML = shell(r.name, "JonWin", setupView());
    return;
  }
  if (isProd() && !PROD_VIEWS.has(r.name)) return go("#/make");
  const v = VIEWS[r.name] || VIEWS.home;
  const [title, body, back] = v(r.arg, r.arg2);
  app.innerHTML = shell(r.name, title, body, back) + sheet() + dueSheet();
  document.body.classList.toggle("lock", !!(st.sheet || st.askDue));
}

// Pop-up card after tapping a size: amount, price and (for a sale) payment, without scrolling.
function sheet() {
  const s = st.sheet;
  if (!s || !["sell", "order"].includes(route().name)) return (st.sheet = null), "";
  const items = itemsOf(s.t);
  const it = items[s.i];
  if (!it) return (st.sheet = null), "";
  const p = S.get(it.p);
  const sell = s.t === "cart";
  const others = items.map((x, i) => ({ x, i })).filter((o) => o.i !== s.i);
  return `<div class="sheet-bg" data-act="closesheet"></div>
<div class="sheet" role="dialog" aria-modal="true" aria-label="${attr((p?.name || "") + " " + L.size(it.ml))}">
<div class="row"><h2>${dot(p)}${esc(p?.short || p?.name || "?")} ${L.size(it.ml)}</h2><button type="button" class="x close" data-act="closesheet" aria-label="Close">${ic("x")}</button></div>
<div class="bigqty"><button type="button" data-act="qty" data-t="${s.t}" data-i="${s.i}" data-d="-1" aria-label="One less">−</button><b>${it.qty}</b><button type="button" data-act="qty" data-t="${s.t}" data-i="${s.i}" data-d="1" aria-label="One more">+</button></div>
<div class="daypick center-chips">${[1, 2, 3, 5, 10, 20].map((n) => `<button type="button" class="chip${it.qty === n ? " on" : ""}" data-act="setqty" data-n="${n}">${n}</button>`).join("")}</div>
<div class="two"><label>Price each (KSh) <span class="muted tiny">change it for this customer</span><input inputmode="numeric" data-price="${s.t}:${s.i}" value="${it.price || ""}" placeholder="price"></label>
<div class="linetot"><span class="muted small">This line</span><b data-linetot="${s.t}:${s.i}">${L.money(it.qty * (it.price || 0))}</b></div></div>
${sell ? "" : `<div class="daypick center-chips"><button type="button" class="chip${it.col === false ? "" : " on"}" data-act="setcol" data-v="1">${sw(true)}Coloured</button><button type="button" class="chip${it.col === false ? " on" : ""}" data-act="setcol" data-v="0">${sw(false)}No colour</button></div>`}
${others.length ? `<div class="mini">${others.map((o) => `<button type="button" class="row" data-act="openline" data-i="${o.i}"><span>${o.x.qty}× ${esc(S.get(o.x.p)?.short || "?")} ${L.size(o.x.ml)}</span><span>${L.money(o.x.qty * (o.x.price || 0))}${CHEV}</span></button>`).join("")}</div>` : ""}
<div class="total">${sell ? "Sale" : "Order"} total <b data-tot="${s.t}">${L.money(L.itemsTotal(items))}</b></div>
<button type="button" class="btn ghost" data-act="closesheet">${ic("plus")}Add another product</button>
${
  sell
    ? `<label>Customer <span class="muted">(needed for pay later)</span><input list="custlist" data-bind="cartCustomer" value="${attr(st.cartCustomer)}" autocomplete="off" placeholder="Name"></label>
<div class="paybtns"><button type="button" class="btn big cash" data-act="sell" data-pay="cash">Cash</button><button type="button" class="btn big mpesa" data-act="sell" data-pay="mpesa">M-Pesa</button><button type="button" class="btn big later" data-act="sell" data-pay="later">Pay later</button></div>`
    : `${st.draft && !st.draft.name.trim() ? `<label>Customer<input list="custlist" data-bind="draft.name" data-change="ordcust" autocomplete="off" placeholder="Name"></label>` : ""}<button type="button" class="btn big" data-act="saveorder">${st.draft?.id ? "Save changes" : "Book order"}</button>`
}
</div>`;
}

// Pop-up after "Pay later": when the customer will pay.
function dueSheet() {
  const a = st.askDue;
  if (!a) return "";
  const t = L.today();
  const chips = [
    [3, "3 days"],
    [7, "1 week"],
    [14, "2 weeks"],
    [30, "1 month"],
  ];
  return `<div class="sheet-bg" data-act="closedue"></div>
<div class="sheet" role="dialog" aria-modal="true" aria-label="When will they pay">
<div class="row"><h2>When will ${esc(a.name)} pay?</h2><button type="button" class="x close" data-act="closedue" aria-label="Close">${ic("x")}</button></div>
<p class="muted small">${L.money(a.total)} on pay later. You get a reminder on this day.</p>
<div class="daypick center-chips">${chips.map(([n, l]) => `<button type="button" class="chip${a.date === L.addDays(t, n) ? " on" : ""}" data-act="duepick" data-n="${n}">${l}</button>`).join("")}</div>
<label>Pay by<input type="date" data-bind="askDue.date" data-change="redraw" min="${t}" value="${attr(a.date)}"></label>
<button type="button" class="btn big later" data-act="${a.act}" data-pay="later" data-ok="1">Save · pay by ${esc(L.niceDate(a.date))}</button>
</div>`;
}

function setupView() {
  const m = S.getMeta();
  return `<div class="card"><h2>Getting ready</h2><p>${
    m.status === "syncing" ? "Downloading records…" : isBoss() ? "Connect to the internet once so the app can load the products." : "The boss needs to open the app once so the products are set up. Then come back here with network."
  }</p><button class="btn" data-act="syncnow">Try again</button></div>`;
}

// ---------- Login / password ----------
function loginView() {
  const expired = !!me();
  return `<div class="auth"><div class="logo">JW</div><h1>JonWin Clean</h1>
<p class="muted">${expired ? "Log in again so this phone can send its records. Nothing on the phone is lost." : "Log in once with network. After that the app works without internet."}</p>
<form data-form="login" class="card">
<label>Phone number<input name="phone" type="tel" inputmode="tel" autocomplete="username" required value="${attr(me()?.phone || "")}"></label>
<label>Password<input name="password" type="password" autocomplete="current-password" required></label>
<button class="btn big">Log in</button>
${expired ? `<a class="btn ghost" href="#/home">Not now</a>` : ""}
</form></div>`;
}

function passwordView(first) {
  return `<div class="auth"><h1>${first ? "Choose your password" : "Change password"}</h1>
${first ? `<p class="muted">You logged in with a temporary password. Choose your own (8 or more letters/numbers).</p>` : ""}
<form data-form="password" class="card">
<label>${first ? "Temporary password" : "Current password"}<input name="current" type="password" autocomplete="current-password" required></label>
<label>New password<input name="next" type="password" autocomplete="new-password" minlength="8" required></label>
<label>New password again<input name="confirm" type="password" autocomplete="new-password" minlength="8" required></label>
<button class="btn big">Save password</button>
${first ? "" : `<a class="btn ghost" href="#/account">Back</a>`}
</form></div>`;
}

// ---------- Item picker (sell + orders) ----------
function picker(target) {
  return `<div class="picker">${L.products()
    .map(
      (p) => `<div class="prow"><div class="pname">${dot(p)}${esc(p.short || p.name)}</div><div class="sizes">${(p.sizes || [])
        .map((s) => `<button type="button" data-act="add" data-t="${target}" data-p="${attr(p.id)}" data-ml="${s.ml}">${L.size(s.ml)}<small>${s.price ? "KSh " + s.price : "no price"}</small></button>`)
        .join("")}</div></div>`,
    )
    .join("")}</div>`;
}
const itemsOf = (target) => (target === "cart" ? st.cart : st.draft.items);
const custOf = (target) => L.findCustomer(target === "cart" ? st.cartCustomer : st.draft?.name || "");
/** After picking a customer, use the prices they got last time (lines she typed a price on stay). */
function reprice(target) {
  const c = custOf(target);
  let changed = false;
  for (const it of itemsOf(target) || []) {
    if (it.own) continue;
    const pr = (c && L.customerPrice(c.id, it.p, it.ml)) || L.priceOf(it.p, it.ml);
    if (pr !== it.price) (it.price = pr), (changed = true);
  }
  return changed;
}
const cleanItems = (items) => items.map(({ own, col, ...i }) => (col === false ? { ...i, col } : i)); // eslint-disable-line no-unused-vars

function lines(target) {
  const items = itemsOf(target);
  if (!items.length) return `<p class="muted center">Tap a size above to add it.</p>`;
  return `<div class="lines">${items
    .map((it, i) => {
      const p = S.get(it.p);
      return `<div class="line">${dot(p)}<div class="lname">${esc(p?.short || p?.name || "?")} ${L.size(it.ml)}</div>
<div class="qty"><button type="button" data-act="qty" data-t="${target}" data-i="${i}" data-d="-1">−</button><b>${it.qty}</b><button type="button" data-act="qty" data-t="${target}" data-i="${i}" data-d="1">+</button></div>
<input class="price" inputmode="numeric" data-price="${target}:${i}" value="${it.price || ""}" placeholder="price" aria-label="Price each">${
        target === "draft" ? `<button type="button" class="chip colchip${it.col === false ? "" : " on"}" data-act="togglecol" data-i="${i}">${it.col === false ? sw(false) + "No colour" : sw(true) + "Coloured"}</button>` : ""
      }</div>`;
    })
    .join("")}<div class="total">Total <b data-tot="${target}">${L.money(L.itemsTotal(items))}</b></div></div>`;
}

// ---------- Views ----------
const VIEWS = {
  home() {
    const t = L.today();
    const stops = L.placeFor(t);
    const sum = L.sumSales(L.salesOn(t));
    const pl = L.plan(8);
    const todayPlan = pl.find((d) => d.date === t);
    const owed = Object.values(L.balances()).reduce((a, b) => a + Math.max(0, b), 0);

    // Last 14 days of sales as bars.
    const days = [];
    for (let i = 13; i >= 0; i--) {
      const d = L.addDays(t, -i);
      days.push({ d, s: L.sumSales(L.salesOn(d)) });
    }

    return [
      "JonWin",
      `${installEvt ? `<button class="btn install" data-act="install">${ic("install")}Install the app on this phone</button>` : ""}
${heroCard(t, stops, sum, todayPlan)}
${new Date().getHours() >= 17 ? `<a class="card row link" href="#/summary"><span class="rowlabel">${ic("sun")}<b>Today's summary</b></span><span class="muted">Share${CHEV}</span></a>` : ""}
${dueCard(t)}
${profitCard(t)}
${chemCard(true)}
<a class="card row link" href="#/owed"><span>Money owed to you</span><b>${L.money(owed)}${CHEV}</b></a>
<section class="card"><h3>Sales, last 14 days</h3>${barChart(days, { labels: true, tick: (d) => L.parse(d).getDate() })}</section>
<section class="card"><div class="row"><h3>Coming days</h3><a href="#/orders">All orders${CHEV}</a></div>${pl
        .filter((d) => d.date > t && d.orders.length)
        .map((d) => `<a class="row link" href="#/orders"><span>${esc(L.niceDate(d.date))} · ${esc(d.orders.map((o) => S.get(o.customer)?.name || "?").join(", "))}</span><span>${L.money(d.total)}${CHEV}</span></a>`)
        .join("") || `<p class="muted">No orders booked.</p>`}</section>`,
    ];
  },

  sell() {
    const t = L.today();
    if (st.cartPlace == null) st.cartPlace = L.placeFor(t)[0]?.id || "";
    return [
      "Sell",
      `<div class="card"><label>Where<select data-bind="cartPlace">${placeOpts(st.cartPlace, "Other / shop")}</select></label></div>
${picker("cart")}
<div class="card">${lines("cart")}
<label>Customer <span class="muted">(needed for pay later)</span><input list="custlist" data-bind="cartCustomer" value="${attr(st.cartCustomer)}" autocomplete="off" placeholder="Name"></label>
${custList()}
<div class="paybtns"><button class="btn big cash" data-act="sell" data-pay="cash">Cash</button><button class="btn big mpesa" data-act="sell" data-pay="mpesa">M-Pesa</button><button class="btn big later" data-act="sell" data-pay="later">Pay later</button></div>
${st.cart.length ? `<button class="btn ghost" data-act="clearcart">Clear</button>` : ""}
</div>
<a class="card row link" href="#/sales">Today's sales · ${L.money(L.sumSales(L.salesOn(t)).total)}${CHEV}</a>`,
    ];
  },

  orders() {
    const t = L.today();
    const open = L.booked().sort((a, b) => a.date.localeCompare(b.date));
    const groups = new Map();
    for (const o of open) {
      const k = o.date < t ? "late" : o.date;
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k).push(o);
    }
    const past = st.showPast
      ? S.list("order")
          .filter((o) => o.status !== "booked")
          .sort((a, b) => (b.doneOn || b.date).localeCompare(a.doneOn || a.date))
          .slice(0, 40)
      : [];
    return [
      "Orders",
      `<a class="btn big" href="#/order/new">${ic("plus")}Book an order</a>
${open.length ? "" : `<p class="card muted">No orders booked.</p>`}
${[...groups.entries()]
  .map(([k, list]) => {
    const late = k === "late";
    const stops = late ? [] : L.placeFor(k);
    const byP = {};
    for (const o of list) for (const it of o.items || []) byP[it.p] = (byP[it.p] || 0) + (it.qty * it.ml) / 1000;
    return `<section class="card${late ? " warn" : ""}"><h3>${late ? "Late — not delivered yet" : esc(L.niceDate(k)) + (stops.length ? " · " + esc(stops.map((s) => s.name).join(", ")) : "")}</h3>
<p class="muted small">${list.length} order${list.length > 1 ? "s" : ""} · ${Object.entries(byP)
      .map(([p, l]) => esc(S.get(p)?.short || L.productName(p)) + " " + L.litres(l))
      .join(" · ")}</p>
${list.map(orderRow).join("")}</section>`;
  })
  .join("")}
<button class="btn ghost" data-act="past">${st.showPast ? "Hide" : "Show"} delivered & cancelled</button>
${past.length ? `<section class="card">${past.map(orderRow).join("")}</section>` : ""}`,
    ];
  },

  order(id, custId) {
    const rec = id && id !== "new" ? S.get(id) : null;
    if (!st.draft || st.draft.key !== (id || "new") + (custId || "")) {
      const c = custId ? S.get(custId) : rec ? S.get(rec.customer) : null;
      const place = rec?.place || c?.place || "";
      st.draft = {
        key: (id || "new") + (custId || ""),
        id: rec?.id || "",
        name: c?.name || "",
        phone: c?.phone || "",
        place,
        date: rec?.date || (place ? L.nextVisit(place) : L.addDays(L.today(), 1)),
        note: rec?.note || "",
        items: (rec?.items || []).map((i) => ({ ...i })),
      };
    }
    const d = st.draft;
    const status = rec?.status || "booked";
    const placeDay = S.get(d.place)?.day;
    const wrongDay = placeDay && d.date && L.weekday(d.date) !== placeDay;
    if (status !== "booked") {
      return [
        "Order",
        `<section class="card"><h2>${esc(d.name)}</h2><p>${esc(L.niceDate(d.date))} · ${esc(L.placeName(d.place))}</p><p>${esc(L.itemsText(d.items))}</p><p><b>${L.money(L.itemsTotal(d.items))}</b></p>
<p class="badge ${status}">${status === "done" ? "Delivered " + esc(rec.doneOn ? L.niceDate(rec.doneOn) : "") : "Cancelled"}</p>
<button class="btn" data-act="again" data-id="${attr(rec.id)}">Book the same again</button></section>`,
        "#/orders",
      ];
    }
    return [
      rec ? "Order" : "Book an order",
      `<div class="card">
<label>Customer<input list="custlist" data-bind="draft.name" data-change="ordcust" value="${attr(d.name)}" autocomplete="off" placeholder="Name" required></label>${custList()}
<label>Phone <span class="muted">(optional)</span><input type="tel" inputmode="tel" data-bind="draft.phone" value="${attr(d.phone)}"></label>
<div class="two"><label>Place<select data-bind="draft.place" data-change="ordplace">${placeOpts(d.place)}</select></label>
<label>Day<input type="date" data-bind="draft.date" data-change="redraw" value="${attr(d.date)}"></label></div>
<div class="daypick">${dayChoices(d)
      .map((c) => `<button type="button" class="chip${c.date === d.date ? " on" : ""}" data-act="setdate" data-d="${c.date}">${esc(c.label)}</button>`)
      .join("")}</div>
${
  wrongDay
    ? `<p class="sendnote">${ic("truck")}<b>Send order.</b> ${esc(L.niceDate(d.date))} is not ${esc(L.placeName(d.place))} day (${L.DAYS[placeDay]}), so you'll send it to them.</p>`
    : d.date
      ? `<p class="muted small">${esc(L.DAYS[L.weekday(d.date)])}${placeDay ? " — " + esc(L.placeName(d.place)) + " day, delivered on the route" : ""}</p>`
      : ""
}
</div>
${picker("draft")}
<div class="card">${lines("draft")}
<label>Note<input data-bind="draft.note" value="${attr(d.note)}" placeholder="e.g. bring own container"></label>
<button class="btn big" data-act="saveorder">${rec ? "Save changes" : "Book order"}</button></div>
${
  rec
    ? `<section class="card"><h3>Delivered? Paid with:</h3><div class="paybtns"><button class="btn cash" data-act="deliver" data-pay="cash">Cash</button><button class="btn mpesa" data-act="deliver" data-pay="mpesa">M-Pesa</button><button class="btn later" data-act="deliver" data-pay="later">Pay later</button></div>
<button class="btn ghost" data-act="again" data-id="${attr(rec.id)}">Book same for next visit</button>
<button class="btn ghost red" data-act="cancelorder">Cancel this order</button></section>`
    : ""
}`,
      "#/orders",
    ];
  },

  stock() {
    const s = L.stock();
    const left = L.chemLeft();
    const batches = S.list("batch")
      .sort((a, b) => b.date.localeCompare(a.date) || b.u - a.u)
      .slice(0, 12);
    return [
      "Stock",
      `${L.products()
        .map((p) => {
          const c = left[p.id] || 0;
          const low = c <= (p.chemLow ?? 1);
          return `<section class="card"><div class="row"><b>${dot(p)}${esc(p.name)}</b><b>${L.litres(Math.max(0, s[p.id] || 0))}</b></div>${(s[p.id] || 0) < 0 ? `<p class="muted small">Sold ${L.litres(-s[p.id])} more than the cooking recorded. Tap <b>Cooked</b> to add the missing cooking, or <b>Count L</b> to set what's there.</p>` : ""}
<a class="row link chemline${low ? " low" : ""}" href="#/chem/${attr(p.id)}"><span>Chemicals</span><span><b>${Math.max(0, c)}</b> batch${c === 1 ? "" : "es"} left${CHEV}</span></a>
<div class="three"><a class="btn sm" href="#/cook/${attr(p.id)}">Cooked</a><a class="btn sm ghost" href="#/chem/${attr(p.id)}">Bought</a><button class="btn sm ghost" data-act="countstock" data-p="${attr(p.id)}">Count L</button></div></section>`;
        })
        .join("")}
<section class="card"><h3>Recent cooking</h3>${
        batches
          .map(
            (b) => `<div class="row"><span>${esc(L.niceDate(b.date))} · ${dot(S.get(b.p))}${esc(L.productName(b.p))} ×${b.n}</span><span>${L.litres(b.litres)} ${esc(b.by ? "· " + b.by : "")}${isBoss() ? ` <button class="x" data-act="delbatch" data-id="${attr(b.id)}" aria-label="Delete">${ic("x")}</button>` : ""}</span></div>`,
          )
          .join("") || `<p class="muted">Nothing cooked yet.</p>`
      }</section>`,
    ];
  },

  mpesa() {
    const m = st.mp?.m;
    const owe = L.balances();
    const opts2 = [...L.customers()].sort((a, b) => (owe[b.id] > 0) - (owe[a.id] > 0) || a.name.localeCompare(b.name));
    const cid = st.mp?.cid || "";
    const c = cid ? S.get(cid) : null;
    const dup = m?.code && S.list("payment").some((p) => p.code === m.code && !p.voided);
    return [
      "M-Pesa payment",
      `<section class="card"><p class="muted small">Copy the M-Pesa message you got, then tap Paste.</p>
<button class="btn big" data-act="mppaste">${ic("paste")}Paste M-Pesa message</button>
<label>Or paste it here<textarea id="mptext" rows="4" placeholder="QK12ABC3DE Confirmed. You have received Ksh…">${esc(st.mp?.text || "")}</textarea></label>
<button class="btn ghost" data-act="mpread">Read message</button></section>
${
  st.mp && !m
    ? `<p class="card warn">That doesn't look like an M-Pesa message with an amount. Copy the whole message and try again.</p>`
    : m
      ? `<section class="card${dup ? " warn" : ""}"><div class="muted small">Received${m.code ? " · " + esc(m.code) : ""} · ${esc(L.niceDate(m.date))}</div>
<div class="big">${L.money(m.amount)}</div><div>from <b>${esc(m.name || "?")}</b>${m.phone ? ` <span class="muted">${esc(m.phone)}</span>` : ""}</div>
${dup ? `<p><b>Already saved.</b> This M-Pesa code is already recorded as a payment.</p>` : ""}
<label>Customer<select data-bind="mp.cid" data-change="redraw">${opts([{ v: "", t: "Choose…" }, ...opts2.map((x) => ({ v: x.id, t: x.name + (owe[x.id] > 0 ? " · owes " + L.money(owe[x.id]) : "") }))], cid)}</select></label>
${c ? `<p class="small">${owe[c.id] > 0 ? (m.amount > owe[c.id] ? `${esc(c.name)} owes ${L.money(owe[c.id])}. The extra ${L.money(m.amount - owe[c.id])} is kept as credit.` : `${esc(c.name)} owes ${L.money(owe[c.id])}. After this: <b>${L.money(owe[c.id] - m.amount)}</b>.`) : `${esc(c.name)} owes nothing. This is kept as credit.`}</p>` : ""}
<button class="btn big mpesa" data-act="mpsave"${!c || dup ? " disabled" : ""}>Save payment ${L.money(m.amount)}</button></section>`
      : ""
}`,
      "#/owed",
    ];
  },

  summary(date) {
    const d = /^\d{4}-\d{2}-\d{2}$/.test(date || "") ? date : L.today();
    const x = L.daySummary(d);
    const line = (k, v, cls = "") => `<div class="row"><span>${k}</span><b class="${cls}">${v}</b></div>`;
    return [
      d === L.today() ? "Today's summary" : L.niceDate(d),
      `<section class="card">
${line("Sold" + (x.sum.count ? ` (${x.sum.count} sale${x.sum.count > 1 ? "s" : ""})` : ""), L.money(x.sum.total))}
<div class="muted small">Cash ${L.money(x.sum.cash)} · M-Pesa ${L.money(x.sum.mpesa)} · Pay later ${L.money(x.sum.later)}</div>
${line("Owed money paid back", L.money(x.paidBack))}
${line("Spent", L.money(x.spent))}
${line("Profit", L.money(x.profit), x.profit < 0 ? "red" : "green")}
${line("Still owed to you", L.money(x.owedNow))}
</section>
${x.dueNext.length || x.lateNow.length ? `<section class="card"><h3>Money to collect</h3>${[...x.lateNow.map((u) => [u, "late"]), ...x.dueNext.map((u) => [u, "due tomorrow"])].map(([u, w]) => `<a class="row link" href="#/customer/${attr(u.c.id)}"><span>${esc(u.c.name)} <span class="muted small">${w}</span></span><b>${L.money(u.owed)}${CHEV}</b></a>`).join("")}</section>` : ""}
${x.ordersNext.length ? `<section class="card"><h3>Orders tomorrow</h3>${x.ordersNext.map((o) => `<a class="row link" href="#/order/${attr(o.id)}"><span>${esc(S.get(o.customer)?.name || "?")}<br><span class="muted small">${esc(L.itemsText(o.items))}</span></span><span>${L.money(L.itemsTotal(o.items))}${CHEV}</span></a>`).join("")}</section>` : ""}
<a class="btn big" href="${attr("https://wa.me/?text=" + encodeURIComponent(summaryText(x)))}">${ic("chat")}Share on WhatsApp</a>`,
      "#/home",
    ];
  },

  make() {
    const t = L.today();
    const pl = L.plan(8).filter((d) => d.rows.some((r) => r.batches));
    const low = L.chemLasts().filter((x) => x.left <= 1 || x.out);
    return [
      "Batches to make",
      `${low.length ? `<a class="card warn link" href="#/chems"><b>Chemicals low:</b> ${low.map((x) => esc(x.p.short || x.p.name) + " " + x.left + " left").join(" · ")}${CHEV}</a>` : ""}
${
  pl
    .map((d) => {
      const makeDay = L.addDays(d.date, -1);
      const total = d.rows.reduce((a, r) => a + r.batches, 0);
      return `<section class="card plancard"><div class="row"><h3>${makeDay <= t ? "Make today" : "Make " + esc(L.niceDate(makeDay))}</h3><b>${total} batch${total === 1 ? "" : "es"}</b></div>
<p class="muted small">For ${esc(L.niceDate(d.date))}${d.stops.length ? " · " + esc(d.stops.map((x) => x.name).join(", ")) : ""}${d.orders.length ? " · " + d.orders.length + " order" + (d.orders.length > 1 ? "s" : "") : ""}</p>
${d.rows
  .filter((r) => r.batches)
  .map(
    (r) => `<div class="mk"><span>${dot(r.p)}<b>${esc(r.p.short || r.p.name)}</b></span><span>${r.col ? `<span class="tag col">${sw(true)}${r.col} coloured</span>` : ""}${r.plain ? `<span class="tag plain">${sw(false)}${r.plain} no colour</span>` : ""}</span></div>
<div class="muted tiny">${[r.forOrders ? r.forOrders + " for orders" : "", r.extra ? r.extra + " to sell" : ""].filter(Boolean).join(" + ")}</div>`,
  )
  .join("")}</section>`;
    })
    .join("") || `<p class="card muted">Nothing to make in the next week.</p>`
}`,
    ];
  },

  chems() {
    const prod = isProd();
    return [
      "Chemicals",
      `<p class="muted small">${prod ? "Tap a product to set how many batches its chemicals are enough for." : "Tap a product to add chemicals you bought."}</p>
${L.chemLasts()
  .map(
    (x) => `<a class="card link${x.left <= 1 ? " warn" : ""}" href="#/chem/${attr(x.p.id)}"><div class="row"><b>${dot(x.p)}${esc(x.p.name)}</b><b>${x.left} <small class="muted">batch${x.left === 1 ? "" : "es"}</small>${CHEV}</b></div>
<div class="small">${lastsText(x)}</div></a>`,
  )
  .join("")}`,
    ];
  },

  cook(pid) {
    const p = S.get(pid) || L.products()[0];
    const bl = p.batchL || 25;
    const left = L.chemLeft()[p.id] || 0;
    return [
      "Cooked",
      `<form data-form="cook" class="card">
<label>Product<select name="p" data-change="cookp">${opts(L.products().map((x) => ({ v: x.id, t: x.name })), p.id)}</select></label>
<div class="two"><label>Batches<input name="n" type="number" inputmode="numeric" min="1" step="1" value="1" data-litres="${bl}" required></label>
<label>Litres made<input name="litres" type="number" inputmode="decimal" min="0" step="0.5" value="${bl}" required></label></div>
<label>Day<input name="date" type="date" value="${L.today()}" required></label>
<label>Note<input name="note" placeholder="optional"></label>
<p class="${left < 1 ? "sendnote" : "muted small"}">Chemicals for ${Math.max(0, left)} batch${left === 1 ? "" : "es"} left. Cooking takes them off.</p>
<button class="btn big">Save</button></form>`,
      "#/stock",
    ];
  },

  chem(pid) {
    const p = S.get(pid);
    if (!p) return ["Chemicals", `<p class="card">Not found.</p>`, "#/chems"];
    const left = L.chemLeft()[p.id] || 0;
    const hist = [
      ...S.list("chemmove")
        .filter((m) => m.p === p.id)
        .map((m) => ({ d: m.date, t: m.type === "buy" ? "Bought" + (m.cost && !isProd() ? " · " + L.money(m.cost) : "") : "Counted", q: m.qty })),
      ...S.list("batch")
        .filter((b) => b.p === p.id)
        .map((b) => ({ d: b.date, t: "Cooked", q: -(b.n || 0) })),
    ]
      .sort((a, b) => b.d.localeCompare(a.d))
      .slice(0, 30);
    return [
      p.short || p.name,
      `<section class="card"><div class="muted">${dot(p)}${esc(p.name)} chemicals</div><div class="big ${left <= 1 ? "red" : ""}">${Math.max(0, left)} <small>batch${left === 1 ? "" : "es"} left</small></div>
<div class="small">${lastsText(L.chemLasts().find((x) => x.p.id === p.id))}</div></section>
${
  isProd()
    ? `<form data-form="chemcount" class="card"><h3>Batches left</h3><p class="muted small">How many batches the chemicals at home are enough for now.</p><div class="inline"><input name="qty" type="number" inputmode="numeric" min="0" step="1" value="${Math.max(0, left)}" required><button class="btn sm">Save</button></div></form>`
    : `<form data-form="chembuy" class="card"><h3>Bought chemicals</h3><div class="two"><label>Enough for how many batches<input name="qty" type="number" inputmode="numeric" min="1" step="1" required></label>
<label>Cost KSh<input name="cost" type="number" inputmode="numeric" min="0"></label></div><button class="btn">Add</button></form>`
}
<section class="card"><h3>History</h3>${hist.map((h) => `<div class="row"><span>${esc(L.niceDate(h.d))} · ${esc(h.t)}</span><span class="${h.q < 0 ? "red" : "green"}">${h.q > 0 ? "+" : ""}${h.q}</span></div>`).join("") || `<p class="muted">Nothing yet.</p>`}</section>`,
      "#/chems",
    ];
  },

  more() {
    const link = (h, i, t, sub) => `<a class="row link" href="#/${h}"><span class="rowlabel">${ic(i)}${t}</span><span class="muted">${sub || ""}${CHEV}</span></a>`;
    const owed = Object.values(L.balances()).reduce((a, b) => a + Math.max(0, b), 0);
    return [
      "More",
      `<section class="card list">${link("sales", "receipt", "Sales")}${link("owed", "wallet", "Money owed", L.money(owed))}${link("customers", "users", "Customers")}${link("expenses", "out", "Expenses")}${link("reports", "chart", "Reports")}</section>
<section class="card list">${isBoss() ? link("products", "bottle", "Products & prices") + link("places", "pin", "Route days") + link("team", "key", "Team logins") : ""}${link("account", "user", "My account & sync", esc(me()?.name))}</section>`,
    ];
  },

  sales(mode, key) {
    ({ mode, key } = salesPeriod(mode, key));
    const list = salesIn(key);
    const sum = L.sumSales(list);
    const t = L.today();
    const prev = shiftPeriod(mode, key, -1);
    const next = shiftPeriod(mode, key, 1);
    const hasNext = next <= t.slice(0, next.length);
    const tab = (m, label, k) => `<a class="${m === mode ? "on" : ""}" href="#/sales/${m}/${k}">${label}</a>`;
    // Keep the same day/month/year in view when switching tabs.
    const day = mode === "day" ? key : key.length === 7 ? (t.startsWith(key) ? t : key + "-01") : t.startsWith(key) ? t : key + "-01-01";
    let body = "";
    if (mode === "day") {
      body = list
        .map(
          (s) => `<div class="sale${s.voided ? " void" : ""}"><div class="row"><b>${esc(s.time || "")} ${s.customer ? esc(S.get(s.customer)?.name || "") : ""}</b><b>${L.money(s.total)}</b></div>
<div class="muted small">${esc(L.itemsText(s.items))}</div><div class="row small"><span><span class="badge ${s.pay}">${PAY[s.pay] || s.pay}</span> ${esc(L.placeName(s.place))} ${esc(s.by ? "· " + s.by : "")}</span>${
            s.voided ? `<span class="red">Cancelled: ${esc(s.voidWhy || "")}</span>` : isBoss() ? `<button class="x" data-act="voidsale" data-id="${attr(s.id)}">Cancel sale</button>` : ""
          }</div></div>`,
        )
        .join("");
    } else {
      body = groupSales(list, mode === "month" ? 10 : 7)
        .map(
          (g) => `<a class="row link period" href="#/sales/${mode === "month" ? "day" : "month"}/${g.key}"><span><b>${esc(mode === "month" ? L.niceDate(g.key) : monthName(g.key))}</b><br><span class="muted small">${g.sum.count} sales · Cash ${L.money(g.sum.cash)} · M-Pesa ${L.money(g.sum.mpesa)} · Later ${L.money(g.sum.later)}</span></span><b>${L.money(g.sum.total)}${CHEV}</b></a>`,
        )
        .join("");
    }
    return [
      "Sales",
      `<div class="seg">${tab("day", "Day", day)}${tab("month", "Month", day.slice(0, 7))}${tab("year", "Year", day.slice(0, 4))}</div>
<div class="daynav"><a class="btn sm ghost" href="#/sales/${mode}/${prev}" aria-label="Earlier">${ic("back")}</a><b>${esc(periodName(mode, key))}</b>${hasNext ? `<a class="btn sm ghost" href="#/sales/${mode}/${next}" aria-label="Later">${CHEV}</a>` : "<span></span>"}</div>
<section class="card"><div class="stats"><div><b>${L.money(sum.total)}</b><span>${sum.count} sales</span></div><div><b>${L.money(sum.cash)}</b><span>Cash</span></div><div><b>${L.money(sum.mpesa)}</b><span>M-Pesa</span></div><div><b>${L.money(sum.later)}</b><span>Pay later</span></div></div>
<button class="btn big pdf" data-act="pdf" data-mode="${mode}" data-key="${key}">${ic("download")}Download PDF</button></section>
<section class="card">${body || `<p class="muted">No sales ${mode === "day" ? "this day" : mode === "month" ? "this month" : "this year"}.</p>`}</section>`,
      "#/more",
    ];
  },

  owed() {
    const bal = L.balances();
    const lastLater = {};
    for (const s of S.list("sale")) if (s.pay === "later" && !s.voided && (!lastLater[s.customer] || s.date > lastLater[s.customer])) lastLater[s.customer] = s.date;
    const rows = Object.entries(bal)
      .filter(([, v]) => v > 0)
      .map(([id, v]) => ({ c: S.get(id), v }))
      .filter((x) => x.c)
      .sort((a, b) => b.v - a.v);
    const total = rows.reduce((a, b) => a + b.v, 0);
    const daysAgo = (d) => Math.round((L.parse(L.today()) - L.parse(d)) / 86400000);
    return [
      "Money owed",
      `<section class="card"><div class="big">${L.money(total)}</div><div class="muted">${rows.length} customer${rows.length === 1 ? "" : "s"} owe you</div>${rows.length ? `<a class="btn ghost" href="#/mpesa">${ic("paste")}Paid by M-Pesa? Paste the message</a>` : ""}</section>
<section class="card">${
        rows
          .map(
            (r) => `<a class="row link" href="#/customer/${attr(r.c.id)}"><span><b>${esc(r.c.name)}</b><br><span class="muted small">${esc(L.placeName(r.c.place))}${lastLater[r.c.id] ? " · last took " + daysAgo(lastLater[r.c.id]) + " days ago" : ""}</span></span><b>${L.money(r.v)}${CHEV}</b></a>`,
          )
          .join("") || `<p class="muted">Nobody owes you.</p>`
      }</section>`,
      "#/more",
    ];
  },

  customers() {
    const bal = L.balances();
    const byPlace = new Map();
    for (const c of L.customers()) {
      const k = c.place || "";
      if (!byPlace.has(k)) byPlace.set(k, []);
      byPlace.get(k).push(c);
    }
    const order = [...L.places().map((p) => p.id), ""];
    return [
      "Customers",
      `<a class="btn big" href="#/customer/new">${ic("plus")}New customer</a>
<input class="search" type="search" placeholder="Search name or phone" data-search=".crow">
${order
  .filter((k) => byPlace.has(k))
  .map(
    (k) => `<section class="card"><h3>${esc(L.placeName(k) || "No place")}</h3>${byPlace
      .get(k)
      .map(
        (c) => `<a class="row link crow" data-s="${attr((c.name + " " + (c.phone || "")).toLowerCase())}" href="#/customer/${attr(c.id)}"><span>${esc(c.name)}</span><span class="muted">${bal[c.id] > 0 ? `<b class="red">owes ${L.money(bal[c.id])}</b>` : esc(c.phone || "")}${CHEV}</span></a>`,
      )
      .join("")}</section>`,
  )
  .join("")}`,
      "#/more",
    ];
  },

  customer(id) {
    const c = id && id !== "new" ? S.get(id) : null;
    const form = `<form data-form="customer" class="card"><input type="hidden" name="id" value="${attr(c?.id || "")}">
<label>Name<input name="name" value="${attr(c?.name || "")}" required></label>
<label>Phone<input name="phone" type="tel" inputmode="tel" value="${attr(c?.phone || "")}"></label>
<label>Place<select name="place">${placeOpts(c?.place)}</select></label>
<label>Note<input name="note" value="${attr(c?.note || "")}"></label>
<button class="btn">${c ? "Save" : "Add customer"}</button></form>`;
    if (!c) return ["New customer", form, "#/customers"];
    const bal = L.balances()[c.id] || 0;
    const hist = [
      ...S.list("sale")
        .filter((s) => s.customer === c.id)
        .map((s) => ({ d: s.date, h: `${PAY[s.pay]} · ${esc(L.itemsText(s.items))}`, v: s.total, x: s.voided })),
      ...S.list("payment")
        .filter((p) => p.customer === c.id)
        .map((p) => ({ d: p.date, h: `Paid back (${PAY[p.pay] || p.pay})`, v: -p.amount, x: p.voided, id: p.id })),
      ...S.list("order")
        .filter((o) => o.customer === c.id && o.status === "booked")
        .map((o) => ({ d: o.date, h: `Booked: ${esc(L.itemsText(o.items))}`, v: null, link: o.id })),
    ]
      .sort((a, b) => b.d.localeCompare(a.d))
      .slice(0, 40);
    return [
      c.name,
      `<section class="card"><div class="row"><div><div class="big ${bal > 0 ? "red" : ""}">${L.money(bal)}</div><div class="muted">${bal > 0 ? "owes you" : "owes nothing"}</div></div>
${c.phone ? `<a class="btn" href="tel:${attr(c.phone)}">${ic("phone")}Call</a>` : ""}</div>
${bal > 0 && L.waNumber(c.phone) ? `<a class="btn ghost" href="${attr(L.waLink(c.phone, balanceText(c)))}">${ic("chat")}Send balance on WhatsApp</a>` : ""}
<div class="two"><a class="btn" href="#/order/new/${attr(c.id)}">${ic("plus")}Book order</a><button class="btn ghost" data-act="invoice" data-id="${attr(c.id)}">${ic("file")}Invoice PDF</button></div></section>
${(() => {
  const u = bal > 0 ? L.unpaid().find((x) => x.c.id === c.id) : null;
  return u
    ? `<form data-form="due" class="card${u.due < L.today() ? " warn" : ""}"><div class="row"><h3>${u.due < L.today() ? "Late since" : "Pay by"} ${esc(L.niceDate(u.due))}</h3>${remindBtn(u)}</div>
<div class="inline"><input name="due" type="date" value="${attr(u.due)}" required aria-label="New pay-by date"><button class="btn sm">Change date</button></div></form>`
    : "";
})()}
${
  bal > 0
    ? `<form data-form="payment" class="card"><h3>Paid back</h3><div class="inline"><input name="amount" type="number" inputmode="numeric" min="1" value="${bal}" required>
<select name="pay"><option value="cash">Cash</option><option value="mpesa">M-Pesa</option></select><button class="btn sm">Save</button></div></form>`
    : ""
}
<section class="card"><h3>History</h3>${
        hist
          .map(
            (h) =>
              `<${h.link ? `a href="#/order/${attr(h.link)}"` : "div"} class="row${h.x ? " void" : ""}"><span>${esc(L.niceDate(h.d))} · ${h.h}</span><span>${h.v == null ? CHEV : L.money(Math.abs(h.v))}${
                h.id && !h.x && isBoss() ? ` <button class="x" data-act="voidpay" data-id="${attr(h.id)}" aria-label="Cancel payment">${ic("x")}</button>` : ""
              }</span></${h.link ? "a" : "div"}>`,
          )
          .join("") || `<p class="muted">Nothing yet.</p>`
      }</section>
${form}`,
      "#/customers",
    ];
  },

  expenses(month) {
    const m = month || L.today().slice(0, 7);
    const list = S.list("expense")
      .filter((e) => e.date.startsWith(m))
      .sort((a, b) => b.date.localeCompare(a.date) || b.u - a.u);
    const byCat = {};
    for (const e of list) byCat[e.cat] = (byCat[e.cat] || 0) + e.amount;
    const [y, mo] = m.split("-").map(Number);
    const prev = mo === 1 ? y - 1 + "-12" : y + "-" + String(mo - 1).padStart(2, "0");
    const next = mo === 12 ? y + 1 + "-01" : y + "-" + String(mo + 1).padStart(2, "0");
    return [
      "Expenses",
      `<form data-form="expense" class="card"><div class="two"><label>Amount KSh<input name="amount" type="number" inputmode="numeric" min="1" required></label>
<label>For<select name="cat">${opts(L.EXPENSE_CATS.map((c) => ({ v: c, t: c })), "Transport")}</select></label></div>
<label>Note<input name="note" placeholder="optional"></label><label>Day<input name="date" type="date" value="${L.today()}" required></label>
<p class="muted small">Chemicals bought in Stock are counted already. Don't add them here too.</p>
<button class="btn">Add expense</button></form>
<div class="daynav"><a class="btn sm ghost" href="#/expenses/${prev}" aria-label="Earlier">${ic("back")}</a><b>${L.MONTHS[mo - 1]} ${y}</b><a class="btn sm ghost" href="#/expenses/${next}" aria-label="Later">${CHEV}</a></div>
<section class="card"><div class="row"><b>Total</b><b>${L.money(list.reduce((a, e) => a + e.amount, 0))}</b></div>${Object.entries(byCat)
        .map(([k, v]) => `<div class="row small"><span>${esc(k)}</span><span>${L.money(v)}</span></div>`)
        .join("")}</section>
<section class="card">${
        list
          .map(
            (e) => `<div class="row"><span>${esc(L.niceDate(e.date))} · ${esc(e.cat)}${e.note ? " · " + esc(e.note) : ""}</span><span>${L.money(e.amount)}${
              isBoss() ? ` <button class="x" data-act="delexp" data-id="${attr(e.id)}" aria-label="Delete">${ic("x")}</button>` : ""
            }</span></div>`,
          )
          .join("") || `<p class="muted">No expenses this month.</p>`
      }</section>`,
      "#/more",
    ];
  },

  reports(month) {
    const m = month || L.today().slice(0, 7);
    const [y, mo] = m.split("-").map(Number);
    const prev = mo === 1 ? y - 1 + "-12" : y + "-" + String(mo - 1).padStart(2, "0");
    const next = mo === 12 ? y + 1 + "-01" : y + "-" + String(mo + 1).padStart(2, "0");
    const sales = S.list("sale").filter((s) => s.date.startsWith(m) && !s.voided);
    const sum = L.sumSales(sales);
    const paidBack = S.list("payment")
      .filter((p) => p.date.startsWith(m) && !p.voided)
      .reduce((a, p) => a + p.amount, 0);
    const exp = S.list("expense")
      .filter((e) => e.date.startsWith(m))
      .reduce((a, e) => a + e.amount, 0);
    const chem = S.list("chemmove")
      .filter((x) => x.date.startsWith(m) && x.type === "buy")
      .reduce((a, x) => a + (x.cost || 0), 0);
    const moneyIn = sum.cash + sum.mpesa + paidBack;
    const out = exp + chem;
    const byP = {};
    const byPlace = {};
    for (const s of sales) {
      for (const it of s.items || []) byP[it.p] = (byP[it.p] || 0) + (it.qty * it.ml) / 1000;
      byPlace[s.place || ""] = (byPlace[s.place || ""] || 0) + s.total;
    }
    const cooked = {};
    for (const b of S.list("batch")) if (b.date.startsWith(m)) cooked[b.p] = (cooked[b.p] || 0) + (b.n || 0);
    const days = new Date(y, mo, 0).getDate();
    const daily = [];
    for (let i = 1; i <= days; i++) {
      const d = m + "-" + String(i).padStart(2, "0");
      daily.push({ d, s: L.sumSales(sales.filter((x) => x.date === d)) });
    }
    return [
      "Reports",
      `<div class="daynav"><a class="btn sm ghost" href="#/reports/${prev}" aria-label="Earlier">${ic("back")}</a><b>${L.MONTHS[mo - 1]} ${y}</b><a class="btn sm ghost" href="#/reports/${next}" aria-label="Later">${CHEV}</a></div>
<section class="card"><div class="stats"><div><b>${L.money(sum.total)}</b><span>Sales (${sum.count})</span></div><div><b>${L.money(moneyIn)}</b><span>Money in</span></div><div><b>${L.money(out)}</b><span>Money out</span></div><div><b class="${moneyIn - out < 0 ? "red" : "green"}">${L.money(moneyIn - out)}</b><span>In − out</span></div></div>
<div class="row small"><span>Cash ${L.money(sum.cash)} · M-Pesa ${L.money(sum.mpesa)} · Later ${L.money(sum.later)}</span></div>
<div class="row small"><span>Owed money paid back ${L.money(paidBack)} · Chemicals bought ${L.money(chem)} · Other expenses ${L.money(exp)}</span></div></section>
<section class="card"><h3>Sales per day</h3>${barChart(daily, { tick: (d) => { const n = Number(d.slice(8)); return n === 1 || n % 5 === 0 ? n : ""; } })}</section>
<section class="card"><h3>Litres sold · batches cooked</h3>${L.products()
        .map((p) => `<div class="row"><span>${dot(p)}${esc(p.name)}</span><span>${L.litres(byP[p.id])} · ${cooked[p.id] || 0} batches</span></div>`)
        .join("")}</section>
<section class="card"><h3>Sales per place</h3>${Object.entries(byPlace)
        .sort((a, b) => b[1] - a[1])
        .map(([k, v]) => `<div class="row"><span>${esc(L.placeName(k) || "Other")}</span><span>${L.money(v)}</span></div>`)
        .join("") || `<p class="muted">No sales.</p>`}</section>`,
      "#/more",
    ];
  },

  products() {
    return [
      "Products & prices",
      `${L.products()
        .map(
          (p) => `<a class="card link" href="#/product/${attr(p.id)}"><div class="row"><b>${dot(p)}${esc(p.name)}</b><span>${CHEV}</span></div>
<div class="muted small">${(p.sizes || []).map((s) => L.size(s.ml) + " " + (s.price ? L.money(s.price) : "no price")).join(" · ")}</div>
<div class="muted small">Batch ${p.batchL || 25} L</div></a>`,
        )
        .join("")}${isBoss() ? `<a class="btn" href="#/product/new">${ic("plus")}New product</a>` : `<p class="muted center">Only the boss can change prices.</p>`}`,
      "#/more",
    ];
  },

  product(id) {
    const p = id && id !== "new" ? S.get(id) : null;
    const dis = isBoss() ? "" : " disabled";
    const COMMON = [250, 500, 750, 1000, 1500, 2000, 3000, 4000, 5000, 10000, 20000];
    const have = (p?.sizes || []).map((s) => s.ml);
    const addOpts = opts(COMMON.filter((ml) => !have.includes(ml)).map((ml) => ({ v: ml, t: L.size(ml) + " bottle" })), "", "Add a size…");
    return [
      p ? p.name : "New product",
      `<form data-form="product" class="card"><input type="hidden" name="id" value="${attr(p?.id || "")}">
<label>Name<input name="name" value="${attr(p?.name || "")}" required${dis}></label>
<div class="two"><label>Short name<input name="short" value="${attr(p?.short || "")}" placeholder="e.g. Soap"${dis}></label><label>Colour<input name="color" type="color" value="${attr(p?.color || "#16a34a")}"${dis}></label></div>
<div class="two"><label>Litres per batch<input name="batchL" type="number" inputmode="decimal" step="any" min="1" value="${attr(p?.batchL || 25)}"${dis}></label>
${L.isSoap(p) ? `<label>Batches to sell each route day<select name="extraBatches"${dis}>${opts([{ v: 0, t: "None" }, { v: 1, t: "1 batch" }, { v: 2, t: "2 batches" }, { v: 3, t: "3 batches" }, { v: "auto", t: "Auto (from her sales)" }], p?.extraBatches ?? 1)}</select></label>` : `<input type="hidden" name="extraBatches" value="0"><p class="muted small">Made only when ordered.</p>`}</div>
${L.isSoap(p) ? walkInNote(p) : ""}
<h3>Price per bottle</h3><p class="muted small">What a customer pays for one bottle of each size, e.g. 500ml = 70, 20L = 2800.</p>
${(p?.sizes || []).map((s) => `<div class="sizerow"><input type="hidden" name="ml" value="${s.ml}"><b>${L.size(s.ml)}</b><label class="ksh">KSh<input name="price" type="number" inputmode="numeric" min="0" placeholder="0" value="${attr(s.price || "")}"${dis}></label>${isBoss() ? `<button type="button" class="x" data-act="rmrow" aria-label="Remove ${L.size(s.ml)}">${ic("x")}</button>` : ""}</div>`).join("")}
${isBoss() ? `<div class="sizerow"><select name="ml">${addOpts}</select><label class="ksh">KSh<input name="price" type="number" inputmode="numeric" min="0" placeholder="0"></label><span></span></div>` : ""}
<input type="hidden" name="chemLow" value="1">
${isBoss() ? `<label class="check"><input type="checkbox" name="off"${p?.off ? " checked" : ""}> Hide this product</label><button class="btn big">Save</button>` : ""}
</form>`,
      "#/products",
    ];
  },

  places() {
    const rows = [...L.places(), { id: "", name: "", day: "" }, { id: "", name: "", day: "" }];
    const dis = isBoss() ? "" : " disabled";
    const dayOpts = (v) => opts([1, 2, 3, 4, 5, 6, 7].map((d) => ({ v: d, t: L.DAYS[d] })), v, "No fixed day");
    return [
      "Route days",
      `<form data-form="places" class="card"><p class="muted small">Which place you go to on which day. Orders for a place are booked on its day. Empty a name to remove it.</p>
${rows.map((r) => `<div class="two"><input type="hidden" name="pid" value="${attr(r.id)}"><input name="pname" value="${attr(r.name)}" placeholder="Place"${dis}><select name="pday"${dis}>${dayOpts(r.day)}</select></div>`).join("")}
${isBoss() ? `<button class="btn big">Save</button>` : `<p class="muted">Only the boss can change route days.</p>`}</form>`,
      "#/more",
    ];
  },

  team() {
    if (!isBoss()) return ["Team", `<p class="card">Only the boss can see this.</p>`, "#/more"];
    if (st.people == null && !st.peopleErr && !st.peopleLoading) loadPeople();
    return [
      "Team logins",
      `${st.tempPw ? `<section class="card ok"><h3>Give them this password</h3><div class="big mono">${esc(st.tempPw)}</div><p class="muted small">They log in with their phone number and this password, then choose their own.</p><button class="btn ghost" data-act="hidepw">Done</button></section>` : ""}
${st.peopleErr ? `<p class="card warn">${esc(st.peopleErr)} <button class="btn sm" data-act="reloadpeople">Try again</button></p>` : ""}
${st.people == null && !st.peopleErr ? `<p class="card muted">Loading…</p>` : ""}
${
  st.people
    ? `<section class="card">${st.people
        .map(
          (p) => `<div class="person"><div><b>${esc(p.name)}</b> <span class="muted small">${esc(roleText(p.roles))}${p.suspendedAt ? " · <span class='red'>blocked</span>" : ""}</span><div class="muted small">${esc(p.phone)}</div></div>${
            p.id === me().id
              ? ""
              : `<div class="btnrow"><select class="rolepick" data-change="role" data-id="${attr(p.id)}" aria-label="Role for ${attr(p.name)}">${["boss", "helper", "cook"].map((r) => `<option value="${r}"${p.roles.includes(r) ? " selected" : ""}>${ROLE_NAME[r]}</option>`).join("")}</select><button class="btn sm ghost" data-act="resetpw" data-id="${attr(p.id)}">New password</button><button class="btn sm ghost${p.suspendedAt ? "" : " red"}" data-act="suspend" data-id="${attr(p.id)}" data-on="${p.suspendedAt ? "" : "1"}">${p.suspendedAt ? "Unblock" : "Block"}</button><button class="btn sm ghost red" data-act="delperson" data-id="${attr(p.id)}" data-name="${attr(p.name)}">Delete</button></div>`
          }</div>`,
        )
        .join("")}</section>`
    : ""
}
<form data-form="addperson" class="card"><h3>Add a helper</h3><label>Name<input name="name" required></label><label>Phone<input name="phone" type="tel" inputmode="tel" required></label><button class="btn">Add</button>
<p class="muted small">Needs internet. Helpers can sell, book orders, record cooking and expenses. They can't change prices or route days.</p>
<p class="muted small">Roles: <b>Boss</b> can do everything, including this page. <b>Helper</b> sells and books orders but can't change prices, route days or logins. <b>Production</b> only sees the batches to make and the chemicals. Changing a role logs that person out.</p></form>`,
      "#/more",
    ];
  },

  account() {
    const m = S.getMeta();
    const w = S.waiting();
    return [
      "My account",
      `<section class="card"><h2>${esc(m.me.name)}</h2><p class="muted">${esc(roleText(m.me.roles))}</p></section>
<section class="card"><h3>Sync</h3><p>${w ? `<b>${w}</b> record${w > 1 ? "s" : ""} on this phone not sent yet.` : "Everything on this phone is saved online."}</p>
<p class="muted small">Last sent: ${m.lastSync ? new Date(m.lastSync).toLocaleString() : "never"}</p>
<button class="btn" data-act="syncnow">Sync now</button></section>
${"Notification" in window ? `<section class="card"><h3>Reminders</h3><p class="muted small">${isProd() ? "A phone notification when a product's chemicals are down to 1 batch." : "A phone notification on the day money is due (and every day after until it's paid), and when a product's chemicals are down to 1 batch."}</p>${Notification.permission === "granted" ? `<p class="green">Reminders are on.</p>` : Notification.permission === "denied" ? `<p class="muted small">Blocked. Allow notifications for this app in the phone's settings.</p>` : `<button class="btn" data-act="notifyon">${ic("bell")}Turn on reminders</button>`}</section>` : ""}
${installEvt ? `<button class="btn install" data-act="install">${ic("install")}Install the app on this phone</button>` : ""}
<section class="card list"><a class="row link" href="#/password"><span>Change password</span><span>${CHEV}</span></a>
<a class="row link" href="#" data-act="backup"><span>Save a backup file</span><span>${CHEV}</span></a></section>
<button class="btn ghost red" data-act="logout">Log out</button>
${isBoss() ? `<section class="card warn"><h3>Start fresh</h3><p class="muted small">Clears all sales, orders, customers, money owed, expenses, cooking, stock and chemicals on every phone. Products, prices, route days and team logins stay. This can't be undone, so save a backup file first.</p><button class="btn danger" data-act="reset">Reset all records</button></section>` : ""}`,
    ];
  },

  password() {
    return ["Change password", passwordView(false), "#/account"];
  },
};

/** Pay-later money due today, tomorrow or late, with a reminder text button. */
function dueCard(t) {
  const soon = L.unpaid().filter((u) => u.due <= L.addDays(t, 1));
  const canAsk = "Notification" in window && Notification.permission === "default";
  if (!soon.length) return "";
  return `<section class="card warn"><h3>Payments due</h3>${soon
    .map((u) => {
      const late = u.due < t;
      const when = late ? Math.round((L.parse(t) - L.parse(u.due)) / 864e5) + " day" + (u.due === L.addDays(t, -1) ? "" : "s") + " late" : u.due === t ? "due today" : "due tomorrow";
      return `<div class="person"><a class="link" href="#/customer/${attr(u.c.id)}"><b>${esc(u.c.name)}</b> <b class="${late ? "red" : ""}">${L.money(u.owed)}</b><div class="small">${when}</div></a>${remindBtn(u)}</div>`;
    })
    .join("")}<a class="btn ghost" href="#/mpesa">${ic("paste")}Paid by M-Pesa? Paste the message</a>${canAsk ? `<button class="btn sm ghost" data-act="notifyon">${ic("bell")}Turn on phone reminders</button>` : ""}</section>`;
}

/** SMS button with a ready reminder (or a link to add their phone number). */
function remindBtn(u) {
  if (!u.c.phone) return `<a class="btn sm ghost" href="#/customer/${attr(u.c.id)}">Add phone${CHEV}</a>`;
  const t = L.today();
  const msg = `Hello ${u.c.name}, this is JonWin. A reminder that KSh ${Math.round(u.owed).toLocaleString("en")} ${u.due < t ? "was due on " + L.niceDate(u.due) : u.due === t ? "is due today" : "is due " + L.niceDate(u.due).toLowerCase()}. Thank you!`;
  if (L.waNumber(u.c.phone)) return `<a class="btn sm" href="${attr(L.waLink(u.c.phone, msg))}">${ic("chat")}Remind</a>`;
  return `<a class="btn sm" href="sms:${attr(u.c.phone)}?body=${attr(encodeURIComponent(msg))}">${ic("message")}Remind</a>`;
}

/** "Enough until Thursday" for one product's chemicals. */
function lastsText(x) {
  if (!x) return "";
  if (x.out && x.left === 0) return `<span class="red">None left — needed ${esc(L.niceDate(x.out))}</span>`;
  if (x.out) return `Enough until <b>${esc(L.niceDate(x.until || L.today()))}</b> · <span class="red">runs out ${esc(L.niceDate(x.out))}</span>`;
  if (!x.used) return x.left ? `Not needed by any order yet` : `<span class="muted">None left · no orders need it</span>`;
  return `Enough for everything planned${x.until ? " (to " + esc(L.niceDate(x.until)) + ")" : ""}`;
}

/** Home: chemicals that are down to 1 batch or will run out soon. */
function chemCard() {
  const bad = L.chemLasts().filter((x) => x.left <= 1 || x.out);
  if (!bad.length) return "";
  return `<section class="card warn"><div class="row"><h3>Buy chemicals</h3><a href="#/chems">All${CHEV}</a></div>${bad
    .map((x) => `<a class="row link" href="#/chem/${attr(x.p.id)}"><span>${dot(x.p)}${esc(x.p.short || x.p.name)} · <b>${x.left}</b> left</span><span class="small">${x.out ? "runs out " + esc(L.niceDate(x.out)) : x.left ? "1 batch left" : "none left"}${CHEV}</span></a>`)
    .join("")}</section>`;
}

/** Invoice PDF for one customer: what they still owe (or recent buying when nothing is owed). */
function invoiceSpec(c) {
  const t = L.today();
  const u = L.unpaid().find((x) => x.c.id === c.id);
  const dm = (d) => d.slice(8) + "/" + d.slice(5, 7) + "/" + d.slice(0, 4);
  const from = L.addDays(t, -30);
  const recent = S.list("sale")
    .filter((s) => s.customer === c.id && !s.voided && s.date >= from)
    .sort((a, b) => a.date.localeCompare(b.date));
  const pays = S.list("payment")
    .filter((p) => p.customer === c.id && !p.voided && p.date >= from)
    .sort((a, b) => a.date.localeCompare(b.date));
  const owed = u?.owed || 0;
  const tables = [];
  if (u)
    tables.push({
      title: "Unpaid",
      cols: [{ h: "Date", w: 62 }, { h: "Items" }, { h: "Due", w: 62 }, { h: "Amount", w: 86, align: "right" }],
      rows: [...u.open].reverse().map((o) => ({ cells: [dm(o.sale.date), L.itemsText(o.sale.items), dm(L.dueOf(o.sale)), L.money(o.owed)] })),
      total: ["", "", "DUE", L.money(owed)],
    });
  tables.push({
    title: "Bought in the last 30 days",
    cols: [{ h: "Date", w: 62 }, { h: "Items" }, { h: "Paid by", w: 62 }, { h: "Amount", w: 86, align: "right" }],
    rows: recent.map((s) => ({ cells: [dm(s.date), L.itemsText(s.items), PAY[s.pay] || s.pay, L.money(s.total)] })),
    total: ["", "", "TOTAL", L.money(recent.reduce((a, s) => a + s.total, 0))],
  });
  if (pays.length)
    tables.push({
      title: "Payments received",
      cols: [{ h: "Date", w: 62 }, { h: "Paid by" }, { h: "Amount", w: 86, align: "right" }],
      rows: pays.map((p) => ({ cells: [dm(p.date), PAY[p.pay] || p.pay, L.money(p.amount)] })),
    });
  return {
    title: "INVOICE",
    number: "INV-" + t.replace(/-/g, "") + "-" + c.id.slice(0, 4).toUpperCase(),
    periodLabel: "BILL TO",
    period: c.name,
    sub: [c.phone, L.placeName(c.place)].filter(Boolean).join(" · "),
    issued: periodName("day", t),
    by: me()?.name || "",
    summary: [
      ["Amount due", L.money(owed)],
      ["Pay by", u ? L.niceDate(u.due).replace(/^(Today|Tomorrow|Yesterday)$/, (m) => m + " " + dm(u.due).slice(0, 5)) : "-"],
      ["Bought (30 days)", L.money(recent.reduce((a, s) => a + s.total, 0))],
      ["Paid (30 days)", L.money(pays.reduce((a, p) => a + p.amount, 0))],
    ],
    tables,
    empty: "Nothing.",
    note: owed ? "Please pay by M-Pesa or cash. Thank you for buying JonWin!" : "Nothing owed. Thank you for buying JonWin!",
  };
}

/** The balance message for a customer, for WhatsApp. */
function balanceText(c) {
  const u = L.unpaid().find((x) => x.c.id === c.id);
  if (!u) return `Hello ${c.name}, this is JonWin. Thank you for buying from us!`;
  const nice = (d) => (d === L.today() ? "today" : L.niceDate(d));
  return [
    `Hello ${c.name}, this is JonWin.`,
    `Your balance is KSh ${Math.round(u.owed).toLocaleString("en")}, ${u.due < L.today() ? "it was due " + nice(u.due) : "please pay by " + nice(u.due)}.`,
    "",
    ...[...u.open].reverse().map((o) => `- ${L.niceDate(o.sale.date)}: ${L.itemsText(o.sale.items)}, KSh ${Math.round(o.owed).toLocaleString("en")}`),
    "",
    "You can pay by M-Pesa or cash. Thank you!",
  ].join("\n");
}

/** The day summary as a WhatsApp message. */
function summaryText(x) {
  const k = (n) => "KSh " + Math.round(n).toLocaleString("en");
  const out = [
    `JonWin · ${L.DAYS[L.weekday(x.date)]} ${L.parse(x.date).getDate()} ${L.MONTHS[L.parse(x.date).getMonth()]}`,
    `Sold: ${k(x.sum.total)} (${x.sum.count} sale${x.sum.count === 1 ? "" : "s"})`,
    `Cash ${k(x.sum.cash)} · M-Pesa ${k(x.sum.mpesa)} · Pay later ${k(x.sum.later)}`,
  ];
  if (x.paidBack) out.push(`Paid back: ${k(x.paidBack)}`);
  if (x.spent) out.push(`Spent: ${k(x.spent)}`);
  out.push(`Profit: ${k(x.profit)}`, `Still owed: ${k(x.owedNow)}`);
  if (x.dueNext.length) out.push(`Due tomorrow: ${x.dueNext.map((u) => u.c.name + " " + k(u.owed)).join(", ")}`);
  if (x.ordersNext.length) out.push(`Orders tomorrow: ${x.ordersNext.map((o) => S.get(o.customer)?.name || "?").join(", ")}`);
  return out.join("\n");
}

/** Profit after all expenses: this month big, today and since the start below. */
function profitCard(t) {
  const m = L.profit(t.slice(0, 7));
  const d = L.profit(t);
  const all = L.profit("");
  const cls = (n) => (n < 0 ? "red" : "green");
  return `<a class="card link" href="#/reports"><div class="row"><h3>Profit this month</h3><span>${CHEV}</span></div>
<div class="big ${cls(m.profit)}">${L.money(m.profit)}</div>
<div class="muted small">Sales ${L.money(m.sales)} − expenses ${L.money(m.costs)}</div>
<div class="row small"><span>Today <b class="${cls(d.profit)}">${L.money(d.profit)}</b></span><span>Since start <b class="${cls(all.profit)}">${L.money(all.profit)}</b></span></div></a>`;
}

/** Today's card: place, the day's total, and how it was paid as one split bar. */
function heroCard(t, stops, raw, todayPlan) {
  // Pay-later money already paid back counts as cash / M-Pesa, so the orange part shrinks or goes.
  const pb = L.paidBack(t);
  const sum = { ...raw, cash: raw.cash + pb.cash, mpesa: raw.mpesa + pb.mpesa, later: Math.max(0, raw.later - pb.total) };
  const y = L.sumSales(L.salesOn(L.addDays(t, -1))).total;
  const diff = y ? Math.round(((sum.total - y) / y) * 100) : null;
  const parts = [
    ["cash", "Cash", sum.cash],
    ["mpesa", "M-Pesa", sum.mpesa],
    ["later", "Pay later", sum.later],
  ];
  const late = todayPlan?.orders.some((o) => o.date < t);
  return `<section class="hero">
<div class="hero-top"><span class="hero-day">${esc(L.DAYS[L.weekday(t)])} · ${stops.length ? esc(stops.map((s) => s.name).join(" + ")) : "No route today"}</span><a class="hero-sell" href="#/sell">${ic("plus")}Sell</a></div>
<div class="hero-amt">${L.money(sum.total)}</div>
<div class="hero-sub">${sum.count ? sum.count + " sale" + (sum.count === 1 ? "" : "s") + " today" : "No sales yet today"}${
    diff == null ? "" : ` <span class="delta ${diff >= 0 ? "up" : "down"}">${ic(diff >= 0 ? "up" : "down")}${Math.abs(diff)}% vs yesterday</span>`
  }</div>
<div class="split">${sum.total ? parts.filter((p) => p[2] > 0).map((p) => `<i class="${p[0]}" style="flex:${p[2]}"></i>`).join("") : '<i class="none"></i>'}</div>
<div class="legend">${(sum.total ? parts.filter((p) => p[2] > 0) : parts).map((p) => `<span><i class="${p[0]}"></i>${p[1]} <b>${L.money(p[2])}</b></span>`).join("")}</div>
${todayPlan?.orders.length ? `<a class="hero-strip" href="#/orders">${ic("truck")}${todayPlan.orders.length} order${todayPlan.orders.length > 1 ? "s" : ""} to deliver today${late ? " · some late" : ""}<span>${CHEV}</span></a>` : ""}
</section>`;
}

function custList() {
  return `<datalist id="custlist">${L.customers()
    .map((c) => `<option value="${attr(c.name)}">${esc(L.placeName(c.place))}</option>`)
    .join("")}</datalist>`;
}

// ---------- Bar chart (tap a bar to see its numbers) ----------
const kshort = (v) => (v >= 1000 ? (v / 1000).toFixed(v < 10000 ? 1 : 0).replace(/\.0$/, "") + "k" : String(Math.round(v)));

function barChart(points, { labels = false, tick = () => "" } = {}) {
  const t = L.today();
  const max = Math.max(1, ...points.map((p) => p.s.total));
  const withSales = points.filter((p) => p.s.total > 0);
  const avg = withSales.length ? withSales.reduce((a, p) => a + p.s.total, 0) / withSales.length : 0;
  // Start on today, or the last day with sales.
  const start = points.find((p) => p.d === t) || [...withSales].pop() || points[points.length - 1];
  return `<div class="chart">
<div class="readout" aria-live="polite">${readout(start)}</div>
<div class="plot">${max > 1 ? `<span class="maxlab">${kshort(max)}</span>` : ""}${avg ? `<i class="avg" style="bottom:${((avg / max) * 100).toFixed(1)}%"><em>avg ${kshort(avg)}</em></i>` : ""}${points
    .map(
      (p) =>
        `<button type="button" class="bar${p === start ? " on" : ""}${p.d === t ? " today" : ""}" data-act="bar" data-d="${p.d}" aria-label="${attr(L.niceDate(p.d) + ": " + L.money(p.s.total))}">${labels && p.s.total ? `<em>${kshort(p.s.total)}</em>` : ""}<i style="height:${p.s.total ? Math.max(2, Math.round((p.s.total / max) * 100)) : 0}%"></i></button>`,
    )
    .join("")}</div>
<div class="xlab">${points.map((p) => `<span>${tick(p.d)}</span>`).join("")}</div></div>`;
}

function readout(p) {
  const s = p.s || L.sumSales(L.salesOn(p.d));
  return `<div><b>${L.money(s.total)}</b> <span class="muted small">${esc(L.niceDate(p.d))} · ${s.count} sale${s.count === 1 ? "" : "s"}</span></div>
<div class="muted small">${s.count ? `Cash ${L.money(s.cash)} · M-Pesa ${L.money(s.mpesa)} · Later ${L.money(s.later)}` : "No sales this day"} · <a href="#/sales/day/${p.d}">Open${CHEV}</a></div>`;
}

/** What she sells herself (not orders): helps choose how many extra batches to cook. */
function walkInNote(p) {
  const w = L.walkIn(p);
  if (!w.days) return `<p class="note">When there's an order, the plan adds the extra batches for her to sell. After a few days of selling, this shows how much she sells on her own.</p>`;
  const bl = p.batchL || 25;
  return `<p class="note">Her own sales (not orders), last 4 weeks: about <b>${L.litres(w.perDay)}</b> a day over ${w.days} day${w.days === 1 ? "" : "s"}${
    w.bottlesPerDay.length ? " (" + w.bottlesPerDay.slice(0, 3).map((b) => (Math.round(b.q * 10) / 10) + " × " + L.size(b.ml)).join(", ") + ")" : ""
  }. One batch is ${bl} L, so that's about <b>${L.num(w.perDay / bl)} batches</b> a day. Auto would cook <b>${L.extraBatches({ ...p, extraBatches: "auto" })}</b>.</p>`;
}

// ---------- Sales periods ----------
function salesPeriod(mode, key) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(mode || "")) return { mode: "day", key: mode };
  const t = L.today();
  if (mode === "month") return { mode, key: /^\d{4}-\d{2}$/.test(key) ? key : t.slice(0, 7) };
  if (mode === "year") return { mode, key: /^\d{4}$/.test(key) ? key : t.slice(0, 4) };
  return { mode: "day", key: /^\d{4}-\d{2}-\d{2}$/.test(key || "") ? key : t };
}
function shiftPeriod(mode, key, n) {
  if (mode === "day") return L.addDays(key, n);
  if (mode === "year") return String(Number(key) + n);
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
}
const monthName = (k) => L.MONTHS[Number(k.slice(5, 7)) - 1] + " " + k.slice(0, 4);
function periodName(mode, key) {
  if (mode === "day") return L.DAYS[L.weekday(key)] + " " + Number(key.slice(8)) + " " + monthName(key.slice(0, 7));
  return mode === "month" ? monthName(key) : "Year " + key;
}
/** Sales whose date starts with the key (a day, "YYYY-MM" or "YYYY"), newest first. */
const salesIn = (key) =>
  S.list("sale")
    .filter((s) => s.date.startsWith(key))
    .sort((a, b) => b.date.localeCompare(a.date) || (b.time || "").localeCompare(a.time || ""));
/** Totals per day (len 10) or per month (len 7), newest first. */
function groupSales(list, len) {
  const g = new Map();
  for (const s of list) {
    const k = s.date.slice(0, len);
    if (!g.has(k)) g.set(k, []);
    g.get(k).push(s);
  }
  return [...g.entries()].map(([key, l]) => ({ key, sum: L.sumSales(l) }));
}

/** The PDF contents for a day, month or year of sales. */
function salesStatement(mode, key) {
  const list = salesIn(key);
  const live = list.filter((s) => !s.voided);
  const sum = L.sumSales(list);
  const t = L.today();
  const custName = (s) => (s.customer ? S.get(s.customer)?.name || "" : "Walk-in");
  const detail = (withDate) => ({
    title: mode === "day" ? "Sales" : "All sales",
    cols: [
      withDate ? { h: "Date", w: 52 } : { h: "Time", w: 40 },
      { h: "Customer", w: 92 },
      { h: "Items" },
      { h: "Place", w: 58 },
      { h: "Paid by", w: 52 },
      { h: "Amount", w: 86, align: "right" },
    ],
    rows: [...list].reverse().map((s) => ({
      cells: [withDate ? s.date.slice(8) + "/" + s.date.slice(5, 7) : s.time || "", custName(s), L.itemsText(s.items), L.placeName(s.place), PAY[s.pay] || s.pay, L.money(s.total)],
      struck: !!s.voided,
    })),
    total: ["", "", live.length + " sales", "", "TOTAL", L.money(sum.total)],
  });
  const byPeriod = (len, label) => {
    const groups = groupSales(list, len).reverse();
    return {
      title: label,
      cols: [{ h: len === 10 ? "Date" : "Month", w: 120 }, { h: "Sales", w: 42, align: "right" }, { h: "Cash", align: "right" }, { h: "M-Pesa", align: "right" }, { h: "Pay later", align: "right" }, { h: "Total", align: "right" }],
      rows: groups.map((g) => ({
        cells: [len === 10 ? L.DAYS[L.weekday(g.key)].slice(0, 3) + " " + Number(g.key.slice(8)) + " " + monthName(g.key.slice(0, 7)) : monthName(g.key), String(g.sum.count), L.money(g.sum.cash), L.money(g.sum.mpesa), L.money(g.sum.later), L.money(g.sum.total)],
      })),
      total: ["TOTAL", String(sum.count), L.money(sum.cash), L.money(sum.mpesa), L.money(sum.later), L.money(sum.total)],
    };
  };
  const tables = mode === "day" ? [detail(false)] : mode === "month" ? [byPeriod(10, "Day by day"), detail(true)] : [byPeriod(7, "Month by month")];
  return {
    title: mode === "day" ? "DAILY SALES" : mode === "month" ? "MONTHLY SALES" : "YEARLY SALES",
    number: "JW-" + key.replace(/-/g, ""),
    period: periodName(mode, key),
    issued: periodName("day", t),
    by: me()?.name || "",
    summary: [
      ["Total sales", L.money(sum.total)],
      ["Cash", L.money(sum.cash)],
      ["M-Pesa", L.money(sum.mpesa)],
      ["Pay later", L.money(sum.later)],
      ["Litres sold", L.litres(sum.litres)],
    ],
    tables,
    note: list.some((s) => s.voided) ? "Cancelled sales are crossed out and not counted in the totals." : "",
  };
}

/** True when the order's day isn't its place's route day, so it has to be sent. */
const isSend = (o) => {
  const day = S.get(o.place)?.day;
  return !!(day && o.date && L.weekday(o.date) !== day);
};

/** Quick picks for the order day: tomorrow, the day after, and the place's next route day. */
function dayChoices(d) {
  const t = L.today();
  const list = [
    { date: t, label: "Today" },
    { date: L.addDays(t, 1), label: "Tomorrow" },
    { date: L.addDays(t, 2), label: L.DAYS[L.weekday(L.addDays(t, 2))].slice(0, 3) },
  ];
  if (d.place && S.get(d.place)?.day) {
    const nv = L.nextVisit(d.place);
    if (!list.some((c) => c.date === nv)) list.push({ date: nv, label: L.placeName(d.place) + " day · " + L.niceDate(nv) });
    else list.find((c) => c.date === nv).label += " (" + L.placeName(d.place) + " day)";
  }
  return list;
}

function orderRow(o) {
  const c = S.get(o.customer);
  return `<a class="row link order" href="#/order/${attr(o.id)}"><span><b>${esc(c?.name || "?")}</b>${o.status === "booked" && isSend(o) ? ` <span class="badge send">Send · ${esc(L.placeName(o.place))}</span>` : ""}${o.status !== "booked" ? ` <span class="badge ${o.status}">${o.status === "done" ? "delivered" : "cancelled"}</span>` : ""}<br><span class="muted small">${esc(L.itemsText(o.items))}${o.note ? " · " + esc(o.note) : ""}</span></span><span>${L.money(L.itemsTotal(o.items))}${CHEV}</span></a>`;
}

// ---------- Actions (buttons) ----------
const ACTS = {
  add(el) {
    const items = itemsOf(el.dataset.t);
    const p = el.dataset.p;
    const ml = Number(el.dataset.ml);
    const line = items.find((i) => i.p === p && i.ml === ml && i.col !== false);
    if (line) line.qty++;
    else items.push({ p, ml, qty: 1, price: L.customerPrice(custOf(el.dataset.t)?.id, p, ml) || L.priceOf(p, ml) });
    st.sheet = { t: el.dataset.t, i: items.findIndex((i) => i.p === p && i.ml === ml && i.col !== false) };
    render();
  },
  qty(el) {
    const items = itemsOf(el.dataset.t);
    const i = Number(el.dataset.i);
    items[i].qty += Number(el.dataset.d);
    if (items[i].qty <= 0) {
      items.splice(i, 1);
      if (st.sheet) st.sheet = null;
    }
    render();
  },
  setqty(el) {
    const it = st.sheet && itemsOf(st.sheet.t)[st.sheet.i];
    if (it) it.qty = Number(el.dataset.n);
    render();
  },
  openline(el) {
    st.sheet = { ...st.sheet, i: Number(el.dataset.i) };
    render();
  },
  rmrow(el) {
    el.closest(".sizerow")?.remove();
    toast("Press Save to keep this change");
  },
  bar(el) {
    const chart = el.closest(".chart");
    for (const b of chart.querySelectorAll(".bar.on")) b.classList.remove("on");
    el.classList.add("on");
    chart.querySelector(".readout").innerHTML = readout({ d: el.dataset.d });
  },
  async mppaste() {
    let text = "";
    try {
      text = await navigator.clipboard.readText();
    } catch {
      /* not allowed: she can paste into the box */
    }
    if (!text) return toast("Long-press the box below and choose Paste.", true), document.getElementById("mptext")?.focus();
    readMp(text);
  },
  mpread() {
    readMp(document.getElementById("mptext")?.value || "");
  },
  async mpsave() {
    const { m, cid } = st.mp || {};
    const c = S.get(cid);
    if (!m || !c) return;
    if (m.code && S.list("payment").some((p) => p.code === m.code && !p.voided)) return toast("Already saved.", true);
    await S.save("payment", { date: m.date, customer: c.id, amount: m.amount, pay: "mpesa", code: m.code, note: "From M-Pesa message" });
    // Learn their number when the message shows it in full.
    if (!c.phone && /^0\d{9}$/.test(m.phone)) await S.save("customer", { id: c.id, phone: m.phone });
    st.mp = null;
    toast("Payment saved · " + L.money(m.amount));
    go("#/customer/" + c.id);
  },
  setcol(el) {
    const it = st.sheet && itemsOf(st.sheet.t)[st.sheet.i];
    if (it) it.col = el.dataset.v === "1" ? undefined : false;
    render();
  },
  togglecol(el) {
    const it = st.draft?.items[Number(el.dataset.i)];
    if (it) it.col = it.col === false ? undefined : false;
    render();
  },
  async invoice(el) {
    el.disabled = true;
    try {
      const { statement } = await import("./pdf.js");
      const c = S.get(el.dataset.id);
      const blob = statement(invoiceSpec(c));
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "JonWin-invoice-" + c.name.replace(/[^\w]+/g, "-") + "-" + L.today() + ".pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 10000);
      toast("Invoice saved to Downloads");
    } finally {
      if (el.isConnected) el.disabled = false;
    }
  },
  closedue() {
    st.askDue = null;
    render();
  },
  duepick(el) {
    st.askDue.date = L.addDays(L.today(), Number(el.dataset.n));
    render();
  },
  async notifyon() {
    const r = await Notification.requestPermission();
    if (r === "granted") {
      toast("Reminders on");
      await watchDue(true);
    } else toast("Reminders are blocked. Allow notifications for this app in phone settings.", true);
    render();
  },
  closesheet() {
    st.sheet = null;
    render();
  },
  setdate(el) {
    st.draft.date = el.dataset.d;
    render();
  },
  async pdf(el) {
    const { mode, key } = salesPeriod(el.dataset.mode, el.dataset.key);
    el.disabled = true;
    el.textContent = "Making PDF…";
    try {
      const { statement } = await import("./pdf.js");
      const blob = statement(salesStatement(mode, key));
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "JonWin-sales-" + key + ".pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 10000);
      toast("PDF saved to Downloads");
    } finally {
      if (el.isConnected) {
        el.disabled = false;
        el.innerHTML = ic("download") + "Download PDF";
      }
    }
  },
  clearcart() {
    st.cart = [];
    st.cartCustomer = "";
    render();
  },
  async sell(el) {
    const pay = el.dataset.pay;
    if (!st.cart.length) return toast("Tap a product size first.", true);
    const name = st.cartCustomer.trim();
    if (pay === "later" && !name) return toast("Write the customer's name for pay later.", true);
    if (pay === "later" && !el.dataset.ok) {
      st.sheet = null;
      st.askDue = { act: "sell", name, total: L.itemsTotal(st.cart), date: L.addDays(L.today(), L.DUE_DAYS) };
      return render();
    }
    let cust = name ? L.findCustomer(name) : null;
    if (name && !cust) cust = await S.save("customer", { name, phone: "", place: st.cartPlace || "", note: "" });
    const items = cleanItems(st.cart);
    const total = L.itemsTotal(items);
    const due = pay === "later" ? st.askDue?.date || L.addDays(L.today(), L.DUE_DAYS) : undefined;
    await S.save("sale", { date: L.today(), time: L.nowTime(), items, total, pay, customer: cust?.id || "", place: st.cartPlace || "", ...(due ? { due } : {}) });
    st.askDue = null;
    st.cart = [];
    st.cartCustomer = "";
    st.sheet = null;
    toast("Saved · " + L.money(total) + " · " + PAY[pay]);
    render();
  },
  past() {
    st.showPast = !st.showPast;
    render();
  },
  async saveorder() {
    const id = await saveDraft();
    if (id) {
      toast("Order saved");
      st.draft = null;
      go("#/orders");
    }
  },
  async deliver(el) {
    const pay = el.dataset.pay;
    if (pay === "later" && !el.dataset.ok) {
      if (!st.draft?.name.trim()) return toast("Write the customer's name.", true);
      st.askDue = { act: "deliver", name: st.draft.name.trim(), total: L.itemsTotal(st.draft.items), date: L.addDays(L.today(), L.DUE_DAYS) };
      return render();
    }
    const due = pay === "later" ? st.askDue?.date || L.addDays(L.today(), L.DUE_DAYS) : undefined;
    st.askDue = null;
    const id = await saveDraft();
    if (!id) return;
    const o = S.get(id);
    const sale = await S.save("sale", {
      date: L.today(),
      time: L.nowTime(),
      items: o.items,
      total: L.itemsTotal(o.items),
      pay,
      customer: o.customer,
      place: o.place,
      order: o.id,
      ...(due ? { due } : {}),
    });
    await S.save("order", { id: o.id, status: "done", sale: sale.id, doneOn: L.today() });
    toast("Delivered · " + L.money(sale.total) + " · " + PAY[pay]);
    st.draft = null;
    go("#/orders");
  },
  async again(el) {
    const o = S.get(el.dataset.id);
    const date = o.place ? L.nextVisit(o.place, o.date > L.today() ? o.date : L.today()) : L.addDays(L.today(), 7);
    const n = await S.save("order", { date, customer: o.customer, place: o.place, items: o.items.map((i) => ({ ...i, price: i.price || L.priceOf(i.p, i.ml) })), total: L.itemsTotal(o.items), note: o.note || "", status: "booked" });
    toast("Booked for " + L.niceDate(date));
    st.draft = null;
    go("#/order/" + n.id);
  },
  async cancelorder() {
    if (!confirm("Cancel this order?")) return;
    await S.save("order", { id: st.draft.id, status: "cancelled", doneOn: L.today() });
    st.draft = null;
    go("#/orders");
  },
  async countstock(el) {
    const p = S.get(el.dataset.p);
    const have = L.stock()[p.id] || 0;
    const v = prompt(`How many litres of ${p.name} do you have now (bottled + not bottled)?`, L.num(have));
    if (v == null || v.trim() === "") return;
    const n = num(v);
    if (n < 0) return toast("Enter 0 or more.", true);
    await S.save("stockadj", { p: p.id, litres: n - have, date: L.today(), note: "Counted" });
    toast("Stock set to " + L.litres(n));
  },
  async delbatch(el) {
    if (!confirm("Delete this cooking record? Its litres and chemicals are put back.")) return;
    await S.remove(el.dataset.id);
  },
  async voidsale(el) {
    const why = prompt("Why cancel this sale? (It stays in the records, crossed out.)");
    if (!why) return;
    await S.save("sale", { id: el.dataset.id, voided: true, voidWhy: why.slice(0, 120) });
  },
  async voidpay(el) {
    if (!confirm("Cancel this payment? The money will show as owed again.")) return;
    await S.save("payment", { id: el.dataset.id, voided: true });
  },
  async delexp(el) {
    if (!confirm("Delete this expense?")) return;
    await S.remove(el.dataset.id);
  },
  syncnow() {
    S.sync().then(() => {
      const s = S.getMeta().status;
      toast(s === "synced" ? "All saved online" : s === "login" ? "Log in again to sync" : "No network. Records are safe on the phone.", s !== "synced");
      render();
    });
  },
  async install() {
    if (!installEvt) return;
    installEvt.prompt();
    await installEvt.userChoice.catch(() => {});
    installEvt = null;
    render();
  },
  backup() {
    const blob = new Blob([JSON.stringify(S.exportAll())], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "jonwin-backup-" + L.today() + ".json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  },
  async logout() {
    const w = S.waiting();
    if (w && !confirm(`${w} records are not sent yet. They stay on this phone and send after the next log in. Log out?`)) return;
    try {
      await api("/api/logout", {});
    } catch {
      /* offline: the phone forgets the login anyway */
    }
    await S.setMeta({ me: null });
    go("#/home");
  },
  async reset() {
    if (!isBoss()) return;
    const typed = prompt('This deletes all records on every phone. Type RESET to confirm.');
    if (typed == null) return;
    if (typed.trim().toUpperCase() !== "RESET") return toast("Not reset. You must type RESET.", true);
    if (!navigator.onLine) return toast("Needs internet.", true);
    try {
      await S.sync(); // send anything still on this phone first, so it is cleared too
      const r = await api("/api/reset", { confirm: "RESET" });
      await S.sync();
      st.cart = [];
      toast(r.cleared + " records cleared. Fresh start!");
      go("#/home");
    } catch (e) {
      toast(e.message, true);
    }
  },
  hidepw() {
    st.tempPw = "";
    render();
  },
  reloadpeople() {
    st.peopleErr = "";
    st.people = null;
    render();
  },
  async resetpw(el) {
    if (!confirm("Make a new temporary password for this person? Their phones will be logged out.")) return;
    try {
      const j = await api("/api/people", { action: "reset", id: el.dataset.id });
      st.tempPw = j.password;
      render();
    } catch (e) {
      toast(e.message, true);
    }
  },
  async setrole(el) {
    const p = st.people?.find((x) => x.id === el.dataset.id);
    const role = el.value;
    const msg = role === "boss" ? `Make ${p?.name || "this person"} a boss? They will be able to change prices, logins and reset all records.` : `Make ${p?.name || "this person"} ${ROLE_NAME[role]}? They will be logged out.`;
    if (!confirm(msg)) return render();
    try {
      await api("/api/people", { action: "role", id: el.dataset.id, role });
      toast("Role changed");
    } catch (e) {
      toast(e.message, true);
    }
    await loadPeople();
  },
  async delperson(el) {
    if (!confirm(`Delete ${el.dataset.name}'s login? They are logged out and can't log in again. Their sales and other records stay.`)) return;
    try {
      await api("/api/people", { action: "delete", id: el.dataset.id });
      toast("Login deleted");
      await loadPeople();
    } catch (e) {
      toast(e.message, true);
    }
  },
  async suspend(el) {
    const on = el.dataset.on === "1";
    if (on && !confirm("Block this person? Their phones stop syncing.")) return;
    try {
      await api("/api/people", { action: "suspend", id: el.dataset.id, on });
      await loadPeople();
    } catch (e) {
      toast(e.message, true);
    }
  },
};

async function loadPeople() {
  st.peopleLoading = true;
  try {
    st.people = (await api("/api/people")).people;
    st.peopleErr = "";
  } catch (e) {
    st.peopleErr = navigator.onLine ? e.message : "Needs internet.";
  }
  st.peopleLoading = false;
  if (route().name === "team") render();
}

function readMp(text) {
  const m = L.readMpesa(text);
  st.mp = { text, m, cid: m ? L.matchCustomer(m)?.id || "" : "" };
  render();
}

async function saveDraft() {
  const d = st.draft;
  const name = d.name.trim();
  if (!name) return toast("Write the customer's name.", true), null;
  if (!d.items.length) return toast("Add what they want.", true), null;
  if (!d.date) return toast("Pick the day.", true), null;
  let c = L.findCustomer(name);
  if (!c) c = await S.save("customer", { name, phone: d.phone.trim(), place: d.place, note: "" });
  else if ((d.phone.trim() && d.phone.trim() !== c.phone) || (d.place && !c.place)) c = await S.save("customer", { id: c.id, phone: d.phone.trim() || c.phone, place: c.place || d.place });
  const items = cleanItems(d.items);
  const rec = await S.save("order", {
    ...(d.id ? { id: d.id } : { status: "booked" }),
    date: d.date,
    customer: c.id,
    place: d.place,
    items,
    total: L.itemsTotal(items),
    note: d.note.trim(),
  });
  d.id = rec.id;
  return rec.id;
}

// ---------- Forms ----------
const FORMS = {
  async login(fd) {
    try {
      const j = await api("/api/login", { phone: fd.get("phone"), password: fd.get("password") });
      await S.setMeta({ me: j.me });
      location.hash = "#/home";
      render();
      await S.sync();
      await seedIfEmpty();
      render();
    } catch (e) {
      toast(navigator.onLine ? e.message : "No network. Logging in needs internet once.", true);
    }
  },
  async password(fd) {
    if (fd.get("next") !== fd.get("confirm")) return toast("The new passwords are not the same.", true);
    try {
      await api("/api/password", { current: fd.get("current"), next: fd.get("next") });
      await S.setMeta({ me: { ...me(), mustChangePassword: false } });
      toast("Password saved");
      go("#/home");
    } catch (e) {
      toast(e.message, true);
    }
  },
  async cook(fd) {
    const p = S.get(fd.get("p"));
    const n = Math.max(1, Math.round(num(fd.get("n"))));
    const litres = num(fd.get("litres"));
    await S.save("batch", { date: fd.get("date"), p: p.id, n, litres, note: String(fd.get("note")).trim() });
    toast(`Saved · ${p.name} +${L.litres(litres)}`);
    go("#/stock");
  },
  async chembuy(fd) {
    const qty = Math.round(num(fd.get("qty")));
    if (qty <= 0) return;
    await S.save("chemmove", { p: route().arg, qty, cost: Math.round(num(fd.get("cost"))), type: "buy", date: L.today() });
    toast("Added");
    render();
  },
  async chemcount(fd) {
    const id = route().arg;
    const have = L.chemLeft()[id] || 0;
    const n = Math.round(num(fd.get("qty")));
    await S.save("chemmove", { p: id, qty: n - have, cost: 0, type: "count", date: L.today() });
    toast("Count saved");
    render();
  },
  async customer(fd) {
    const name = String(fd.get("name")).trim();
    const id = fd.get("id") || undefined;
    const dup = L.findCustomer(name);
    if (dup && dup.id !== id) return toast("A customer with that name exists. Add something, e.g. the place.", true);
    const c = await S.save("customer", { ...(id ? { id } : {}), name, phone: String(fd.get("phone")).trim(), place: fd.get("place") || "", note: String(fd.get("note")).trim() });
    toast("Saved");
    go("#/customer/" + c.id);
  },
  async due(fd) {
    const due = String(fd.get("due"));
    const u = L.unpaid().find((x) => x.c.id === route().arg);
    if (!u || !/^\d{4}-\d{2}-\d{2}$/.test(due)) return;
    for (const o of u.open) await S.save("sale", { id: o.sale.id, due });
    toast("Pay by " + L.niceDate(due));
    render();
  },
  async payment(fd) {
    const amount = Math.round(num(fd.get("amount")));
    if (amount <= 0) return;
    await S.save("payment", { date: L.today(), customer: route().arg, amount, pay: fd.get("pay") });
    toast("Payment saved · " + L.money(amount));
    render();
  },
  async expense(fd, f) {
    const amount = Math.round(num(fd.get("amount")));
    if (amount <= 0) return;
    await S.save("expense", { date: fd.get("date"), cat: fd.get("cat"), amount, note: String(fd.get("note")).trim() });
    toast("Expense saved");
    f.reset();
    render();
  },
  async product(fd) {
    if (!isBoss()) return;
    const ml = fd.getAll("ml");
    const price = fd.getAll("price");
    const sizes = [];
    ml.forEach((m, i) => {
      const v = Math.round(num(m));
      if (v > 0 && !sizes.some((s) => s.ml === v)) sizes.push({ ml: v, price: Math.round(num(price[i])) });
    });
    sizes.sort((a, b) => a.ml - b.ml);
    const id = fd.get("id") || undefined;
    await S.save("product", {
      ...(id ? { id } : { order: L.products().length + 1 }),
      name: String(fd.get("name")).trim(),
      short: String(fd.get("short")).trim(),
      color: fd.get("color"),
      batchL: num(fd.get("batchL")) || 25,
      extraBatches: fd.get("extraBatches") === "auto" ? "auto" : Math.max(0, Math.round(num(fd.get("extraBatches")))),
      sizes,
      chemLow: Math.max(0, Math.round(num(fd.get("chemLow")))),
      off: fd.get("off") === "on",
    });
    toast("Saved");
    go("#/products");
  },
  async places(fd) {
    if (!isBoss()) return;
    const ids = fd.getAll("pid");
    const names = fd.getAll("pname");
    const days = fd.getAll("pday");
    for (let i = 0; i < ids.length; i++) {
      const name = String(names[i]).trim();
      const day = Number(days[i]) || 0;
      const old = ids[i] ? S.get(ids[i]) : null;
      if (old && !name) await S.remove(old.id);
      else if (old && (old.name !== name || (old.day || 0) !== day)) await S.save("place", { id: old.id, name, day });
      else if (!old && name) await S.save("place", { name, day });
    }
    toast("Saved");
    render();
  },
  async addperson(fd, f) {
    try {
      const j = await api("/api/people", { action: "add", name: fd.get("name"), phone: fd.get("phone") });
      st.tempPw = j.password;
      f.reset();
      await loadPeople();
    } catch (e) {
      toast(navigator.onLine ? e.message : "Needs internet.", true);
    }
  },
};

// ---------- First-time products (boss phone only, after the first sync) ----------
async function seedIfEmpty() {
  const m = S.getMeta();
  if (!isBoss() || m.seeded || m.status !== "synced" || S.list("product").length) return;
  const sizes = [500, 1000, 2000, 5000, 10000, 20000].map((ml) => ({ ml, price: 0 }));
  const P = [
    ["p-soap", "JonWin Liquid Soap", "Soap", "#16a34a"],
    ["p-bleach", "JonWin Bleach", "Bleach", "#2563eb"],
    ["p-antiseptic", "JonWin Antiseptic", "Antiseptic", "#d97706"],
    ["p-disinfectant", "JonWin Disinfectant", "Disinfectant", "#dc2626"],
  ];
  for (let i = 0; i < P.length; i++) {
    const [id, name, short, color] = P[i];
    await S.save("product", { id, name, short, color, order: i + 1, batchL: 25, extraBatches: 1, sizes, chemLow: 1, off: false });
  }
  const R = ["Brooke", "Ainamoi", "Kipsitet", "Kapsuser", "Kapsoit"];
  for (let i = 0; i < R.length; i++) await S.save("place", { id: "pl-" + (i + 1), name: R[i], day: i + 1 });
  await S.setMeta({ seeded: true });
}

// ---------- Events ----------
function setPath(path, v) {
  const keys = path.split(".");
  let o = st;
  for (let i = 0; i < keys.length - 1; i++) o = o[keys[i]];
  o[keys[keys.length - 1]] = v;
}

app.addEventListener("click", (e) => {
  const a = e.target.closest("[data-act]");
  if (!a) return;
  e.preventDefault();
  if (a.disabled) return;
  Promise.resolve(ACTS[a.dataset.act]?.(a)).catch((err) => toast(err.message || "Something went wrong", true));
});

app.addEventListener("submit", (e) => {
  const f = e.target.closest("form[data-form]");
  if (!f) return;
  e.preventDefault();
  const btn = f.querySelector("button:not([type=button])");
  if (btn) btn.disabled = true;
  Promise.resolve(FORMS[f.dataset.form]?.(new FormData(f), f))
    .catch((err) => toast(err.message || "Something went wrong", true))
    .finally(() => {
      if (btn && btn.isConnected) btn.disabled = false;
    });
});

app.addEventListener("input", (e) => {
  const el = e.target;
  editing = true;
  if (el.dataset.bind) setPath(el.dataset.bind, el.value);
  if (el.dataset.price) {
    const [t, i] = el.dataset.price.split(":");
    const items = itemsOf(t);
    if (items[i]) (items[i].price = Math.round(num(el.value))), (items[i].own = true);
    for (const x of document.querySelectorAll(`[data-tot="${t}"]`)) x.textContent = L.money(L.itemsTotal(items));
    const lt = document.querySelector(`[data-linetot="${t}:${i}"]`);
    if (lt && items[i]) lt.textContent = L.money(items[i].qty * (items[i].price || 0));
  }
  if (el.dataset.search) {
    const q = el.value.trim().toLowerCase();
    for (const r of app.querySelectorAll(el.dataset.search)) r.hidden = q && !r.dataset.s.includes(q);
  }
  if (el.name === "n" && el.dataset.litres) {
    const l = el.form.elements.litres;
    if (l) l.value = Math.max(1, Math.round(num(el.value))) * num(el.dataset.litres);
  }
});

app.addEventListener("change", (e) => {
  const el = e.target;
  if (el.dataset.bind) setPath(el.dataset.bind, el.value);
  if (el.dataset.bind === "cartCustomer" && reprice("cart")) render();
  const ch = el.dataset.change;
  if (ch === "ordcust") {
    reprice("draft");
    const c = L.findCustomer(el.value);
    if (c) {
      st.draft.phone = c.phone || st.draft.phone;
      if (c.place) {
        st.draft.place = c.place;
        st.draft.date = L.nextVisit(c.place);
      }
    }
    render();
  } else if (ch === "ordplace") {
    if (st.draft.place) st.draft.date = L.nextVisit(st.draft.place);
    render();
  } else if (ch === "redraw") render();
  else if (ch === "cookp") go("#/cook/" + el.value);
  else if (ch === "role") ACTS.setrole(el).catch((err) => toast(err.message || "Something went wrong", true));
});

window.addEventListener("hashchange", () => {
  st.sheet = null;
  if (route().name !== "mpesa") st.mp = null;
  st.askDue = null;
  render();
  window.scrollTo(0, 0);
});

// Records arriving from other phones: redraw, unless someone is typing.
let redrawTimer = 0;
S.onChange(() => {
  const pill = document.getElementById("sync");
  if (pill) pill.outerHTML = syncPill();
  clearTimeout(redrawTimer);
  redrawTimer = setTimeout(() => {
    const a = document.activeElement;
    if (editing || (a && /INPUT|SELECT|TEXTAREA/.test(a.tagName))) return;
    const y = window.scrollY;
    render();
    window.scrollTo(0, y);
  }, 300);
});

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  installEvt = e;
  if (["home", "account"].includes(route().name) && !editing) render();
});
window.addEventListener("online", () => S.sync());
window.addEventListener("offline", () => S.sync());
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") S.sync().then(() => watchDue().catch(() => {}));
});
setInterval(() => {
  if (document.visibilityState === "visible") S.sync().then(seedIfEmpty);
}, 60000);

// ---------- Reminders ----------
// Once a day: money due today or late (not for Production), and chemicals down to 1 batch.
// The app checks when it opens;
// installed on the home screen, Chrome also wakes the app about once a day to check (sw.js).
async function watchDue(force) {
  if (!("Notification" in window) || Notification.permission !== "granted" || !navigator.serviceWorker) return;
  const reg = await navigator.serviceWorker.ready;
  if (reg.periodicSync) reg.periodicSync.register("due", { minInterval: 12 * 3600 * 1000 }).catch(() => {});
  const t = L.today();
  let last = "";
  try {
    last = localStorage.getItem("jw-due-told") || "";
  } catch {
    /* private mode */
  }
  if (last === t && !force) return;
  const due = isProd() ? [] : L.unpaid().filter((u) => u.due <= t);
  const low = L.chemLasts().filter((x) => x.left <= 1);
  if (!due.length && !low.length) return;
  if (due.length) {
    const total = due.reduce((a, u) => a + u.owed, 0);
    await reg.showNotification(`${L.money(total)} due from ${due.length} customer${due.length > 1 ? "s" : ""}`, {
      body: due.map((u) => `${u.c.name} ${L.money(u.owed)}${u.due < t ? " (late)" : ""}`).join(", "),
      tag: "due",
      icon: "/icon-192.png",
      data: { url: "/#/home" },
    });
  }
  if (low.length)
    await reg.showNotification("Chemicals running out", {
      body: low.map((x) => `${x.p.short || x.p.name}: ${x.left} batch${x.left === 1 ? "" : "es"} left`).join(", "),
      tag: "chem",
      icon: "/icon-192.png",
      data: { url: "/#/chems" },
    });
  try {
    localStorage.setItem("jw-due-told", t);
  } catch {
    /* private mode */
  }
}

// ---------- Start ----------
(async () => {
  try {
    await S.open();
  } catch {
    app.innerHTML = `<div class="auth"><h1>Storage blocked</h1><p>This browser won't let the app save records. Open it in Chrome (not private mode).</p></div>`;
    return;
  }
  render();
  if (navigator.storage?.persist) navigator.storage.persist().catch(() => {});
  await S.sync();
  await seedIfEmpty();
  watchDue().catch(() => {});
})();

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js").catch(() => {});
  // Only an update (not the very first install) needs a reload.
  const hadWorker = !!navigator.serviceWorker.controller;
  let reloaded = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (reloaded || !hadWorker) return;
    reloaded = true;
    const t = document.getElementById("toast");
    t.innerHTML = 'New version ready. <button class="btn sm">Reload</button>';
    t.className = "toast show";
    t.querySelector("button").onclick = () => location.reload();
  });
}
