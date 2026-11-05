# JonWin Clean — Product Spec

Shop + business management system for JonWin Clean, a family business that makes and
sells cleaning products (liquid soap, bleach, antiseptic, disinfectant).

Agreed: 2026-11-04.

## 1. Products

| Product | Notes |
|---|---|
| JonWin Liquid Soap | |
| JonWin Bleach | |
| JonWin Antiseptic | |
| JonWin Disinfectant | |

- Do not use third-party brand names (Jik, Dettol, Kerol) anywhere public.
- Sizes: 500ml, 1L, 2L, 5L, 10L, 20L. Each product × size has its own buying cost and selling price.
- Admin can add/rename products and sizes.

## 2. Roles

| Role | Who | Access |
|---|---|---|
| Boss | Mum | Everything, incl. prices, staff, money, reports, suspensions |
| Helper | Son, Dad | Orders, walk-in sales, production, support. Cannot delete records, change prices, or manage staff |
| Cook | Son, Dad | Production page |
| Rider | Future drivers | Delivery page, own deliveries only |
| Customer | Buyers | Shop, own orders, own transactions, settings |

A person can hold more than one role (e.g. Helper + Cook).

## 3. Admin

- Dashboard with charts (see §6).
- Orders: Pending → Paid → Assigned → Out for delivery → Delivered (or Cancelled).
- Products, sizes, prices (Boss only for prices).
- Finished-goods stock per product × size, low-stock alerts.
- Walk-in sales: 3-tap phone screen, payment = cash / M-Pesa / pay later. Works offline, syncs later.
- Pay later ("Owed money"): only Boss/Helper can record it, never offered on the website. List shows who owes, amount,
  days overdue, partial payments. Records, doesn't promote.
- Expenses with categories (transport, containers, rent, labels, tips, chemicals, other).
- Customers: list, total purchases, "Trusted" flag (enables cash on delivery), suspend.
- Staff/riders: invite, assign roles, suspend.
- Delivery areas with a fee per area.
- Rider cash handover: collected → handed over → confirmed by Boss.
- Support & complaints: tickets with status open → in progress → solved, linked to order/customer.
- Admin can reset a customer's password (for customers without email).
- Audit log: who changed what, when. Visible to Boss.
- Bulk entry / import for old book records.

## 4. Production

- Chemicals stock: name, unit, quantity on hand, cost per unit, low-stock threshold.
- Per product: list of chemicals + amount used per batch (entered by Boss). Batch size default 25 L, per product.
- "Enough for X batches" per product = min over its chemicals (on hand ÷ per batch).
- Batch planner: litres needed = pending order litres − finished stock; batches = ceil(litres ÷ batch size).
  Example: 3 × 20 L = 60 L, 0 in stock → 3 batches = 75 L, 15 L extra for sale.
- Schedule: assign cook, product, number of batches, date.
- Batch record: cook, product, litres, date. Recording deducts chemicals and adds finished stock.
- Boss rates each batch's quality (1–5 + notes) and can record a tip (also logged as an expense).

## 5. Shop (public)

- Catalog, product pages, size picker, cart, checkout.
- Checkout: name, phone, delivery area, map pin (Leaflet + OpenStreetMap).
- Payments: online gateway (user has API docs; integrate behind a swappable adapter) + cash on delivery for Trusted
  customers only.
- Customer account: order history, transaction records (append-only, cannot be edited or deleted by anyone;
  corrections are new reversing entries), total purchases, ratings.
- Ratings: when placing a new order, customer is asked to rate each product from their previous delivery (1–5).
  Ratings are stored per delivery.
- Settings: change password, saved delivery location.
- Forgot password: email reset link via Resend. (WhatsApp codes possible later; paid API.)
- Pages: Terms & Conditions, Privacy Policy (Kenya Data Protection Act 2019), Delivery & Refund Policy.

## 6. Reports & charts

- Sales & profit by day / week / month / year.
- Income vs expenses per month; expenses by category.
- Best-selling products and sizes.
- Stock levels (finished goods + chemicals).
- Owed money over time.
- Batches per cook, average quality per cook.
- Deliveries by day / week / month / year: count, money, per rider.
- Ratings per product over time.
- Date-range filters; export to Excel and PDF.

## 7. Deliveries (riders)

- List of unassigned orders; rider picks orders.
- Each order: buyer name + tap-to-call phone, area, delivery fee, items and quantities, map pin.
- Live map: rider's live position → customer pin, route drawn (Leaflet + OSRM, same as CivCare) + "Open in Google
  Maps" fallback.
- Status updates: picked → on the way → delivered. Cash collected recorded for COD.

## 8. Non-functional

- Security: OWASP Top 10 — hashed passwords (scrypt), httpOnly/secure/SameSite session cookies, role checks on every
  server action, input validation (zod), parameterised queries (Drizzle), CSRF protection via same-site cookies + origin
  checks, security headers (CSP, HSTS, X-Frame-Options, etc.), no secrets in client code, audit log, account lockout.
- Rate limiting: login, signup, password reset, checkout, payment callbacks.
- Performance: mobile-first, fast on cheap phones, optimized images, installable PWA.
- Not listed on Google (owner's choice): `noindex, nofollow` on every page, robots.txt disallows all, no sitemap.
  Open Graph tags kept so shared links preview nicely on WhatsApp. Anyone with the link can still open the site.
- Responsive on phone, tablet, desktop.
- Docs: README (setup, env vars, deploy), legal pages.

## 9. Tech

- Next.js (App Router, TypeScript), Tailwind CSS.
- Neon Postgres (via Vercel Marketplace) + Drizzle ORM.
- Vercel Blob for product photos.
- Resend for email.
- Recharts for charts.
- Leaflet + react-leaflet + OSRM for maps.
- Hosting: Vercel. Free address to start (e.g. jonwin-clean.vercel.app); domain later (jonwinclean.shop: $2.99
  first year, $38.39/yr renewal on Vercel).

## 10. Build order

1. Admin core: auth & roles, products, stock, walk-in sales, owed money, expenses, customers, dashboard charts, audit log.
2. Production: chemicals, batch planner, schedule, batch records, quality, tips.
3. Shop: catalog, checkout, payments, trusted COD, accounts, ratings, support, no-index, legal pages.
4. Deliveries: rider page, maps, live tracking, cash handover, delivery charts.
