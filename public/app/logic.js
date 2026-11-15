// Numbers worked out from the records: stock, chemicals, money owed, and the cooking plan.
import { list, get } from "./store.js";

// ---------- Dates (all "YYYY-MM-DD" in phone time) ----------
const pad = (n) => (n < 10 ? "0" : "") + n;
export const ymd = (d) => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
export const today = () => ymd(new Date());
export const parse = (s) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d, 12);
};
export const addDays = (s, n) => {
  const d = parse(s);
  d.setDate(d.getDate() + n);
  return ymd(d);
};
/** 1 = Monday … 7 = Sunday */
export const weekday = (s) => parse(s).getDay() || 7;
export const DAYS = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export function niceDate(s) {
  const d = parse(s);
  const t = today();
  if (s === t) return "Today";
  if (s === addDays(t, 1)) return "Tomorrow";
  if (s === addDays(t, -1)) return "Yesterday";
  return DAYS[weekday(s)].slice(0, 3) + " " + d.getDate() + " " + MON[d.getMonth()];
}
export const nowTime = () => {
  const d = new Date();
  return pad(d.getHours()) + ":" + pad(d.getMinutes());
};

// ---------- Formatting ----------
export const money = (n) => "KSh " + Math.round(n || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
export const litres = (n) => (Math.round((n || 0) * 10) / 10).toString() + " L";
export const size = (ml) => (ml >= 1000 ? ml / 1000 + "L" : ml + "ml");
export const num = (n) => Math.round((n || 0) * 100) / 100;

// ---------- Products & places ----------
export const products = () =>
  list("product")
    .filter((p) => !p.off)
    .sort((a, b) => (a.order || 0) - (b.order || 0) || a.name.localeCompare(b.name));
export const places = () => list("place").sort((a, b) => (a.day || 9) - (b.day || 9) || a.name.localeCompare(b.name));
export const placeName = (id) => get(id)?.name || "";
export const placeFor = (date) => places().filter((p) => p.day === weekday(date));
export const productName = (id) => get(id)?.name || "?";
export const priceOf = (pid, ml) => get(pid)?.sizes?.find((s) => s.ml === ml)?.price || 0;

/** Next date (from tomorrow) that the place is visited. */
export function nextVisit(placeId, from = today()) {
  const p = get(placeId);
  if (!p?.day) return addDays(from, 1);
  for (let i = 1; i <= 7; i++) {
    const d = addDays(from, i);
    if (weekday(d) === p.day) return d;
  }
  return addDays(from, 1);
}

export const itemsLitres = (items) => (items || []).reduce((t, i) => t + (i.qty * i.ml) / 1000, 0);
export const itemsTotal = (items) => (items || []).reduce((t, i) => t + i.qty * (i.price || 0), 0);
export const itemsText = (items) =>
  (items || []).map((i) => i.qty + "×" + size(i.ml) + " " + (get(i.p)?.short || productName(i.p)) + (i.col === false ? " (no colour)" : "")).join(", ");
/** Only liquid soap gets a batch to sell every route day; the rest are made only for orders. */
export const isSoap = (p) => !!p && (p.id === "p-soap" || /soap/i.test(p.name || ""));

// ---------- Stock (litres per product) ----------
export function stock() {
  const s = {};
  for (const p of list("product")) s[p.id] = 0;
  for (const b of list("batch")) s[b.p] = (s[b.p] || 0) + (b.litres || 0);
  for (const a of list("stockadj")) s[a.p] = (s[a.p] || 0) + (a.litres || 0);
  for (const sale of list("sale")) {
    if (sale.voided) continue;
    for (const i of sale.items || []) s[i.p] = (s[i.p] || 0) - (i.qty * i.ml) / 1000;
  }
  return s;
}

// ---------- Chemicals ----------
// Counted per product in batches: "Liquid soap chemicals: enough for 3 batches".
// Buying adds batches (chemmove { p, qty }), cooking takes off the batches cooked.
export function chemLeft() {
  const s = {};
  for (const p of list("product")) s[p.id] = 0;
  for (const m of list("chemmove")) if (m.p) s[m.p] = (s[m.p] || 0) + (m.qty || 0);
  for (const b of list("batch")) s[b.p] = (s[b.p] || 0) - (b.n || 0);
  return s;
}
/** Products with 1 batch of chemicals or less. */
export function chemLow(left = chemLeft()) {
  return products().filter((p) => (left[p.id] || 0) <= 1);
}

/**
 * How long each product's chemicals last, going through the plan for the next 30 days.
 * until: the last day fully covered; out: the first day there isn't enough (null if none in 30 days).
 */
export function chemLasts() {
  const left = chemLeft();
  const use = {};
  const out = {};
  const until = {};
  for (const d of plan(30))
    for (const r of d.rows) {
      if (!r.batches) continue;
      const id = r.p.id;
      use[id] = (use[id] || 0) + r.batches;
      if (out[id]) continue;
      if (use[id] > Math.max(0, left[id] || 0)) out[id] = d.date;
      else until[id] = d.date;
    }
  return products().map((p) => ({ p, left: Math.max(0, left[p.id] || 0), until: until[p.id] || null, out: out[p.id] || null, used: use[p.id] || 0 }));
}

// ---------- Money owed ----------
export function balances() {
  const b = {};
  for (const s of list("sale")) if (s.pay === "later" && !s.voided && s.customer) b[s.customer] = (b[s.customer] || 0) + s.total;
  for (const p of list("payment")) if (!p.voided) b[p.customer] = (b[p.customer] || 0) - p.amount;
  return b;
}

export const customers = () => list("customer").sort((a, b) => a.name.localeCompare(b.name));
export function findCustomer(name) {
  const n = name.trim().toLowerCase();
  return n ? list("customer").find((c) => c.name.trim().toLowerCase() === n) || null : null;
}

// ---------- Orders & plan ----------
export const booked = () => list("order").filter((o) => o.status === "booked");

/**
 * The next `days` days that have a route stop or a booked order, with what to cook for each.
 * Stock is shared out day by day, so stock used on Tuesday isn't counted again on Wednesday.
 */
export function plan(days = 8) {
  const t = today();
  const st = stock();
  const avail = {};
  for (const p of products()) avail[p.id] = Math.max(0, st[p.id] || 0);
  const open = booked();
  const out = [];
  for (let i = 0; i < days; i++) {
    const d = addDays(t, i);
    const stops = placeFor(d);
    // Late orders are counted with today.
    const orders = open.filter((o) => (i === 0 ? o.date <= d : o.date === d));
    if (!stops.length && !orders.length) continue;
    const need = {};
    const plain = {}; // litres ordered with no colour: always made fresh
    for (const o of orders)
      for (const it of o.items || []) {
        const l = (it.qty * it.ml) / 1000;
        need[it.p] = (need[it.p] || 0) + l;
        if (it.col === false) plain[it.p] = (plain[it.p] || 0) + l;
      }
    const rows = [];
    for (const p of products()) {
      const n = need[p.id] || 0;
      if (!n) {
        // No order for this product, but on a route day she still sells: cook the extra batches
        // unless the stock already covers them.
        if (!stops.length) continue;
        const e = extraBatches(p);
        if (!e) continue;
        const bl = p.batchL || 25;
        const have = avail[p.id] || 0;
        const cook = Math.max(0, Math.ceil((e * bl - have) / bl - 1e-9));
        avail[p.id] = Math.max(0, have - e * bl);
        rows.push({ p, need: 0, have, forOrders: 0, extra: cook, batches: cook, col: cook, plain: 0, sellOnly: true });
        continue;
      }
      const have = avail[p.id] || 0;
      const batchL = p.batchL || 25;
      // Stock is coloured, so it only covers coloured orders; no-colour orders are made fresh.
      const nPlain = plain[p.id] || 0;
      const nCol = n - nPlain;
      const forCol = Math.ceil(Math.max(0, nCol - have) / batchL - 1e-9);
      const forPlain = Math.ceil(nPlain / batchL - 1e-9);
      // On top of the orders, extra (coloured) batches for her to sell along the way. Those litres
      // get sold, so they are not counted as stock for later days.
      const extra = extraBatches(p);
      avail[p.id] = Math.max(0, have + forCol * batchL - nCol);
      rows.push({ p, need: n, have, forOrders: forCol + forPlain, extra, batches: forCol + forPlain + extra, col: forCol + extra, plain: forPlain });
    }
    out.push({ date: d, stops, orders, rows, total: orders.reduce((s, o) => s + itemsTotal(o.items), 0) });
  }
  return out;
}

/**
 * Her own sales (not booked orders) of a product over the last 4 weeks:
 * litres per day she sold on, and the most common bottles.
 */
export function walkIn(p, weeks = 4) {
  const from = addDays(today(), -7 * weeks);
  const days = new Set();
  let litres = 0;
  const bottles = {};
  for (const s of list("sale")) {
    if (s.voided || s.order || s.date < from) continue;
    days.add(s.date);
    for (const i of s.items || []) {
      if (i.p !== p.id) continue;
      litres += (i.qty * i.ml) / 1000;
      bottles[i.ml] = (bottles[i.ml] || 0) + i.qty;
    }
  }
  const n = days.size;
  return {
    days: n,
    perDay: n ? litres / n : 0,
    bottlesPerDay: Object.entries(bottles)
      .map(([ml, q]) => ({ ml: Number(ml), q: q / n }))
      .sort((a, b) => b.q - a.q),
  };
}

/** Extra batches to cook for her own selling: a fixed number, or worked out from her sales ("auto"). */
export function extraBatches(p) {
  if (!isSoap(p)) return 0;
  const e = p.extraBatches ?? 1;
  if (e !== "auto") return Number(e) || 0;
  const w = walkIn(p);
  if (w.days < 3) return 1; // not enough sales yet to tell
  return Math.max(0, Math.ceil(w.perDay / (p.batchL || 25) - 0.15));
}

/** Products whose chemicals are not enough for the batches in a plan. */
export function chemShortfall(planDays) {
  const need = {};
  for (const d of planDays) for (const r of d.rows) need[r.p.id] = (need[r.p.id] || 0) + r.batches;
  const left = chemLeft();
  return Object.keys(need)
    .filter((id) => need[id] > (left[id] || 0))
    .map((id) => ({ p: get(id), need: need[id], have: left[id] || 0 }))
    .filter((x) => x.p);
}

// ---------- Sales summaries ----------
export function salesOn(date) {
  return list("sale")
    .filter((s) => s.date === date)
    .sort((a, b) => (b.time || "").localeCompare(a.time || ""));
}
export function sumSales(sales) {
  const r = { total: 0, cash: 0, mpesa: 0, later: 0, count: 0, litres: 0 };
  for (const s of sales) {
    if (s.voided) continue;
    r.total += s.total;
    r[s.pay] = (r[s.pay] || 0) + s.total;
    r.count++;
    r.litres += itemsLitres(s.items);
  }
  return r;
}

export const EXPENSE_CATS = ["Chemicals", "Containers", "Labels", "Transport", "Rent", "Tips", "Food", "Other"];

// ---------- Profit ----------
/**
 * Sales (pay-later included, cancelled ones not) minus every expense and chemicals bought,
 * for dates starting with `prefix` ("2026-11" for a month, "" for everything).
 */
export function profit(prefix = "") {
  const sales = sumSales(list("sale").filter((s) => s.date.startsWith(prefix))).total;
  const exp = list("expense")
    .filter((e) => e.date.startsWith(prefix))
    .reduce((a, e) => a + (e.amount || 0), 0);
  const chem = list("chemmove")
    .filter((x) => x.type === "buy" && x.date.startsWith(prefix))
    .reduce((a, x) => a + (x.cost || 0), 0);
  return { sales, costs: exp + chem, profit: sales - exp - chem };
}

// ---------- Pay later: what is still unpaid, and when ----------
export const DUE_DAYS = 7;
/** The day a pay-later sale should be paid (older sales without one: a week after). */
export const dueOf = (s) => s.due || addDays(s.date, DUE_DAYS);

/**
 * Customers who owe money, with the sales not yet paid (payments pay off the oldest sales first)
 * and the earliest due day among them. Sorted by due day.
 */
export function unpaid() {
  const bal = balances();
  const by = {};
  for (const s of list("sale")) if (s.pay === "later" && !s.voided && s.customer) (by[s.customer] ||= []).push(s);
  const out = [];
  for (const [cid, sales] of Object.entries(by)) {
    const owed = Math.max(0, bal[cid] || 0);
    const c = get(cid);
    if (!owed || !c) continue;
    sales.sort((a, b) => b.date.localeCompare(a.date) || b.u - a.u); // newest first
    let left = owed;
    const open = [];
    for (const s of sales) {
      if (left <= 0) break;
      const o = Math.min(s.total, left);
      left -= o;
      open.push({ sale: s, owed: o });
    }
    const due = open.map((o) => dueOf(o.sale)).sort()[0] || today();
    out.push({ c, owed, due, open });
  }
  return out.sort((a, b) => a.due.localeCompare(b.due));
}

/**
 * Of the pay-later sales made on `date`, how much has since been paid back, split by how it was paid.
 * Today's card moves that money from "Pay later" to Cash / M-Pesa.
 */
export function paidBack(date) {
  const still = new Map();
  for (const u of unpaid()) for (const o of u.open) still.set(o.sale.id, o.owed);
  const per = {};
  for (const s of list("sale")) {
    if (s.date !== date || s.pay !== "later" || s.voided || !s.customer) continue;
    const paid = s.total - (still.get(s.id) || 0);
    if (paid > 0) per[s.customer] = (per[s.customer] || 0) + paid;
  }
  const r = { cash: 0, mpesa: 0, total: 0 };
  for (const [cid, paid] of Object.entries(per)) {
    const pays = list("payment").filter((p) => p.customer === cid && !p.voided && p.date >= date);
    const cash = pays.filter((p) => p.pay !== "mpesa").reduce((a, p) => a + p.amount, 0);
    const mp = pays.filter((p) => p.pay === "mpesa").reduce((a, p) => a + p.amount, 0);
    const c = cash + mp ? (paid * cash) / (cash + mp) : paid;
    r.cash += c;
    r.mpesa += paid - c;
    r.total += paid;
  }
  return r;
}

// ---------- Prices per customer ----------
/** The price this customer last got for this product and size (sales and orders), or 0. */
export function customerPrice(cid, p, ml) {
  if (!cid) return 0;
  let best = null;
  for (const r of [...list("sale"), ...list("order")]) {
    if (r.customer !== cid || r.voided || r.status === "cancelled") continue;
    const it = (r.items || []).find((i) => i.p === p && i.ml === ml && i.price);
    if (!it) continue;
    if (!best || r.date > best.date || (r.date === best.date && r.u > best.u)) best = { date: r.date, u: r.u, price: it.price };
  }
  return best?.price || 0;
}
