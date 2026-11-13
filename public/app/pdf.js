// Makes invoice-style PDF statements on the phone, offline, with no library.
// Uses the built-in PDF fonts (Helvetica), so files stay small.

const W = 595; // A4 in points
const H = 842;
const M = 36; // margin
const GREEN = [0.043, 0.541, 0.42];
const SOFT = [0.906, 0.957, 0.937];
const GREY = [0.42, 0.45, 0.44];
const LINE = [0.85, 0.88, 0.87];
const INK = [0.09, 0.13, 0.11];
const WHITE = [1, 1, 1];

// Helvetica character widths (per 1000), for right-aligning amounts and cutting long text.
const WIDTHS =
  "278,278,355,556,556,889,667,191,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,1015,667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,611,722,667,944,667,667,611,278,278,278,469,556,333,556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,556,556,333,500,278,556,500,722,500,500,500,334,260,334,584"
    .split(",")
    .map(Number);
function textWidth(s, size, bold) {
  let w = 0;
  for (const ch of s) {
    const c = ch.charCodeAt(0);
    w += c >= 32 && c <= 126 ? WIDTHS[c - 32] : 556;
  }
  return (w * size * (bold ? 1.06 : 1)) / 1000;
}
function fit(s, size, max, bold) {
  s = String(s ?? "");
  if (textWidth(s, size, bold) <= max) return s;
  while (s.length > 1 && textWidth(s + "…", size, bold) > max) s = s.slice(0, -1);
  return s + "…";
}

// PDF strings use WinAnsi: a few common symbols have their own codes, the rest of Unicode becomes "?".
const WIN = { "…": 0x85, "—": 0x97, "–": 0x96, "’": 0x92, "‘": 0x91, "“": 0x93, "”": 0x94, "•": 0x95, "€": 0x80 };
function pdfStr(s) {
  let out = "";
  for (const ch of String(s)) {
    let c = ch.charCodeAt(0);
    if (WIN[ch]) c = WIN[ch];
    else if (c > 255) c = 63;
    const x = String.fromCharCode(c);
    out += x === "(" || x === ")" || x === "\\" ? "\\" + x : x;
  }
  return "(" + out + ")";
}
const rgb = (c) => c.map((v) => v.toFixed(3)).join(" ");

class Doc {
  constructor() {
    this.pages = [];
    this.newPage();
  }
  newPage() {
    this.ops = [];
    this.pages.push(this.ops);
  }
  // All y values are measured from the top of the page.
  rect(x, y, w, h, color) {
    this.ops.push(`${rgb(color)} rg ${x.toFixed(1)} ${(H - y - h).toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)} re f`);
  }
  line(x1, y, x2, color = LINE, width = 0.7) {
    this.ops.push(`${rgb(color)} RG ${width} w ${x1} ${(H - y).toFixed(1)} m ${x2} ${(H - y).toFixed(1)} l S`);
  }
  text(x, y, s, { size = 10, bold = false, color = INK, align = "left", max } = {}) {
    let str = String(s ?? "");
    if (max) str = fit(str, size, max, bold);
    let tx = x;
    if (align === "right") tx = x - textWidth(str, size, bold);
    else if (align === "center") tx = x - textWidth(str, size, bold) / 2;
    this.ops.push(`BT /${bold ? "F2" : "F1"} ${size} Tf ${rgb(color)} rg ${tx.toFixed(1)} ${(H - y).toFixed(1)} Td ${pdfStr(str)} Tj ET`);
  }
  strike(x1, x2, y) {
    this.line(x1, y, x2, GREY, 0.6);
  }
  build() {
    const objs = [];
    const add = (s) => objs.push(s) && objs.length;
    add("<< /Type /Catalog /Pages 2 0 R >>");
    add("PAGES");
    add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");
    add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>");
    const kids = [];
    for (const ops of this.pages) {
      const body = ops.join("\n");
      const content = add(`<< /Length ${body.length} >>\nstream\n${body}\nendstream`);
      kids.push(
        add(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${content} 0 R >>`),
      );
    }
    objs[1] = `<< /Type /Pages /Kids [${kids.map((k) => k + " 0 R").join(" ")}] /Count ${kids.length} >>`;
    let out = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";
    const offs = [];
    objs.forEach((o, i) => {
      offs.push(out.length);
      out += `${i + 1} 0 obj\n${o}\nendobj\n`;
    });
    const xref = out.length;
    out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
    for (const o of offs) out += String(o).padStart(10, "0") + " 00000 n \n";
    out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
    const bytes = new Uint8Array(out.length);
    for (let i = 0; i < out.length; i++) bytes[i] = out.charCodeAt(i) & 255;
    return new Blob([bytes], { type: "application/pdf" });
  }
}

/**
 * An invoice-style statement.
 * spec = { title, number, period, issued, by, summary: [[label, value]], tables: [{ title, cols: [{ h, w, align }], rows: [{ cells, struck }], total }], note }
 */
export function statement(spec) {
  const d = new Doc();
  const right = W - M;
  const TOP = 60; // space kept at the top of continued pages
  let y = 0;

  // Header band
  d.rect(0, 0, W, 92, GREEN);
  d.text(M, 42, "JonWin Clean", { size: 24, bold: true, color: WHITE });
  d.text(M, 62, "Liquid soap · Bleach · Antiseptic · Disinfectant", { size: 9, color: WHITE });
  d.text(right, 40, spec.title, { size: 15, bold: true, color: WHITE, align: "right" });
  d.text(right, 60, "No. " + spec.number, { size: 9, color: WHITE, align: "right" });

  // Details
  y = 122;
  d.text(M, y, "PERIOD", { size: 8, bold: true, color: GREY });
  d.text(M, y + 16, spec.period, { size: 13, bold: true });
  d.text(right - 150, y, "DATE ISSUED", { size: 8, bold: true, color: GREY });
  d.text(right - 150, y + 16, spec.issued, { size: 10 });
  d.text(right - 150, y + 34, "PREPARED BY", { size: 8, bold: true, color: GREY });
  d.text(right - 150, y + 48, spec.by || "-", { size: 10 });
  y += 70;

  // Summary boxes
  const n = spec.summary.length;
  const gap = 8;
  const bw = (right - M - gap * (n - 1)) / n;
  spec.summary.forEach(([label, value], i) => {
    const x = M + i * (bw + gap);
    d.rect(x, y, bw, 46, i === 0 ? GREEN : SOFT);
    d.text(x + 8, y + 16, label.toUpperCase(), { size: 7, bold: true, color: i === 0 ? WHITE : GREY, max: bw - 16 });
    d.text(x + 8, y + 35, value, { size: 12, bold: true, color: i === 0 ? WHITE : INK, max: bw - 16 });
  });
  y += 66;

  const ROW = 18;
  const BOTTOM = H - 60;
  for (const t of spec.tables) {
    const cols = t.cols;
    const fixed = cols.reduce((a, c) => a + (c.w || 0), 0);
    const flex = cols.filter((c) => !c.w).length;
    const widths = cols.map((c) => c.w || (right - M - fixed) / Math.max(1, flex));
    const xs = [];
    let x = M;
    for (const w of widths) {
      xs.push(x);
      x += w;
    }
    const head = () => {
      d.rect(M, y, right - M, 20, INK);
      cols.forEach((c, i) => {
        const tx = c.align === "right" ? xs[i] + widths[i] - 6 : xs[i] + 6;
        d.text(tx, y + 13.5, c.h, { size: 8, bold: true, color: WHITE, align: c.align || "left", max: widths[i] - 12 });
      });
      y += 20;
    };
    if (y + 60 > BOTTOM) {
      d.newPage();
      y = TOP;
    }
    if (t.title) {
      d.text(M, y + 4, t.title, { size: 11, bold: true });
      y += 14;
    }
    head();
    t.rows.forEach((r, ri) => {
      if (y + ROW > BOTTOM) {
        d.newPage();
        y = TOP;
        head();
      }
      if (ri % 2 === 1) d.rect(M, y, right - M, ROW, [0.965, 0.975, 0.97]);
      r.cells.forEach((v, i) => {
        const c = cols[i];
        const tx = c.align === "right" ? xs[i] + widths[i] - 6 : xs[i] + 6;
        d.text(tx, y + 12.5, v, { size: 8.5, color: r.struck ? GREY : INK, align: c.align || "left", max: widths[i] - 12 });
      });
      if (r.struck) d.strike(M + 4, right - 4, y + 9.5);
      y += ROW;
    });
    if (!t.rows.length) {
      d.text(M + 6, y + 13, "No sales.", { size: 9, color: GREY });
      y += ROW;
    }
    if (t.total) {
      if (y + 26 > BOTTOM) {
        d.newPage();
        y = TOP;
      }
      d.line(M, y + 2, right, INK, 1);
      t.total.forEach((v, i) => {
        if (v == null || v === "") return;
        const c = cols[i];
        const tx = c.align === "right" ? xs[i] + widths[i] - 6 : xs[i] + 6;
        d.text(tx, y + 17, v, { size: 9.5, bold: true, align: c.align || "left", max: widths[i] - 12 });
      });
      y += 26;
    }
    y += 18;
  }

  if (spec.note) {
    if (y + 20 > BOTTOM) {
      d.newPage();
      y = TOP;
    }
    d.text(M, y, spec.note, { size: 8, color: GREY, max: right - M });
  }

  // Footer on every page
  const total = d.pages.length;
  d.pages.forEach((ops, i) => {
    d.ops = ops;
    d.line(M, H - 40, right, LINE);
    d.text(M, H - 26, "JonWin Clean · " + spec.title.toLowerCase() + " · " + spec.period, { size: 8, color: GREY });
    d.text(right, H - 26, `Page ${i + 1} of ${total}`, { size: 8, color: GREY, align: "right" });
  });
  return d.build();
}
