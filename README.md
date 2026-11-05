# JonWin Clean

Shop and business manager for JonWin Clean: sales, stock, owed money, expenses and charts.
Full feature plan: [SPEC.md](SPEC.md).

**Built so far (stage 1 of 4):** admin core (logins and roles, products and prices, stock, walk-in sales,
owed money, expenses, customers, staff, activity log, dashboard charts).
**Coming next:** production (stage 2), online shop (stage 3), deliveries (stage 4).

## Run it locally

Needs Node.js 20+. No database account needed: locally it uses an embedded Postgres stored in `./.data`.

```bash
npm install
npm run setup                                      # create tables + add the 4 products in 6 sizes
npm run create-boss -- "Full Name" 0712345678      # prints a one-time temporary password
npm run dev                                        # http://localhost:3000
```

Log in with the phone number and temporary password. You'll be asked to choose your own password.

On Termux (Android), `npm run …` scripts call `node` directly because Termux has no `/usr/bin/env`.

Only one program can open the local database at a time: stop `npm run dev` before running
`setup` or `create-boss`.

## Deploy to Vercel

1. Push this folder to a GitHub repository and import it in Vercel.
2. In the Vercel project → **Storage**, add **Neon Postgres**. This sets `DATABASE_URL`.
3. Optional but recommended → **Storage**: add **Upstash Redis** for rate limiting across servers
   (sets `KV_REST_API_URL` / `KV_REST_API_TOKEN`). Without it, limits only apply per server instance.
4. Add the other environment variables from [.env.example](.env.example).
5. Create the tables and the boss account against the live database, from your computer:
   ```bash
   DATABASE_URL="postgres://…" npm run setup
   DATABASE_URL="postgres://…" npm run create-boss -- "Full Name" 0712345678 email@example.com
   ```
6. Deploy. Free address: `https://<project>.vercel.app`. A custom domain can be added later under
   **Settings → Domains**.

## How the records stay safe

- **Money records can't be changed.** Database triggers block editing or deleting payments, sale lines,
  stock movements and the activity log. Sales and expenses can only be *voided* (once, by the boss, with
  a reason). Voiding a sale returns its bottles to stock and records a refund.
- **Every change is logged** in Admin → Activity log: who, what, and when.
- **Walk-in sales survive bad network.** If the phone is offline, the sale is kept on the phone and sent
  automatically when the network is back. Each sale has a unique id, so a retry is never saved twice.

## Security

Following the OWASP Top 10:

| Risk | What the app does |
|---|---|
| Broken access control | Every page and every server action checks the user's role on the server (`requireUser`). Suspended users are logged out everywhere. |
| Cryptographic failures | Passwords hashed with scrypt (N=2¹⁷). Session tokens and reset tokens are random 256-bit values; only their SHA-256 is stored. HTTPS forced with HSTS. |
| Injection | All database access goes through Drizzle with parameters; all input is validated with zod. |
| Insecure design | Append-only money records, void-not-delete, idempotent sales, boss can't suspend or demote themselves. |
| Security misconfiguration | Strict Content Security Policy with per-request nonce, `X-Frame-Options: DENY`, `nosniff`, no `X-Powered-By`, minimal permissions policy. |
| Vulnerable components | Small dependency set; run `npm audit` regularly. |
| Authentication failures | Rate-limited login (5 per 15 min), account lock after 5 wrong passwords, generic error messages, temporary passwords must be changed, password reset links expire in 30 min and work once. |
| Integrity failures | Server actions are origin-checked by Next.js; cookies are `HttpOnly`, `Secure`, `SameSite=Lax`, `__Host-` prefixed. |
| Logging & monitoring | Activity log of logins, lockouts, sales, voids, price changes and account changes. |
| SSRF | The server makes no requests to user-supplied URLs. |

The site is **not listed on search engines** on purpose (`noindex` on every page). Anyone with the link can
still open it.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Start the app for development |
| `npm run build` / `npm start` | Production build / run |
| `npm run typecheck` / `npm run lint` | Check the code |
| `npm run db:generate` | Create a migration after changing `src/db/schema.ts` |
| `npm run db:migrate` | Apply migrations |
| `npm run db:seed` | Add the starting products (safe to repeat) |
| `npm run create-boss` | Create or reset the boss account |

## Project layout

```
src/app/(auth)        login, forgot/reset password
src/app/account       change password
src/app/admin         dashboard, sell, sales, owed, products, stock, expenses, customers, staff, activity log
src/components        forms, charts
src/db                schema and connection
src/lib               auth, sales logic, reports, rate limiting, audit log
drizzle/              database migrations (incl. append-only triggers)
scripts/              setup, seed, create-boss
```
