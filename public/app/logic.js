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
  (items || []).map((i) => i.qty + "×" + size(i.ml) + " " + (get(i.p)?.short || productName(i.p))).join(", ");

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
/** Products whose chemicals are at or below their warning level (default 1 batch). */
export function chemLow(left = chemLeft()) {
  return products().filter((p) => (left[p.id] || 0) <= (p.chemLow ?? 1));
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
    for (const o of orders) for (const it of o.items || []) need[it.p] = (need[it.p] || 0) + (it.qty * it.ml) / 1000;
    const rows = [];
    for (const p of products()) {
      const n = need[p.id] || 0;
      if (!n) continue;
      const have = avail[p.id] || 0;
      const short = Math.max(0, n - have);
      const batchL = p.batchL || 25;
      const forOrders = Math.ceil(short / batchL - 1e-9);
      // On top of the orders, extra batches for her to sell along the way. Those litres get sold,
      // so they are not counted as stock for later days.
      const extra = extraBatches(p);
      avail[p.id] = have + forOrders * batchL - n;
      rows.push({ p, need: n, have, forOrders, extra, batches: forOrders + extra });
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
