# JonWin Clean

The family's records app, replacing the notebook. It covers sales, orders booked for each route day, the cooking
plan, chemicals left, money owed, and expenses.

**It works offline and installs like an app.** It's plain JavaScript with no framework, so it stays quick on a
cheap phone. Records are saved on the phone first and sent to the server whenever there's network. Every
team phone sees the same records.

## Her week

| Day | Place |
|---|---|
| Monday | Brooke |
| Tuesday | Ainamoi |
| Wednesday | Kipsitet |
| Thursday | Kapsuser |
| Friday | Kapsoit |

(Change these in More → Route days.)

- **Orders**: book a customer's order for a day. The app picks the next visit to their place.
- **Cooking plan** (Home and Orders): for each coming day it adds up the litres booked, takes off what's in stock,
  and says how many batches to cook the day before. It warns when chemicals won't be enough.
- **Sell**: tap product and size, then Cash, M-Pesa or Pay later. The day's place is chosen automatically. Good for the
  500 ml bottles she sells along the way.
- **Stock**: litres of each product (cooking adds, sales take off) and chemicals left (buying adds, cooking takes off by
  the recipe).
- **More**: sales by day, money owed, customers, expenses, monthly report, products & prices, route days, team logins.

## Install on the phone

1. Open the site in **Chrome** with network and log in (phone number + password).
2. Tap **📲 Install the app** on Home, or Chrome menu ⋮ → **Add to Home screen / Install app**.
3. From now on open it from the home screen icon. No network is needed. The pill at the top shows whether records
   are sent ("Saved online") or waiting on the phone.

The phone stays logged in for a year. Only logging in needs network.

## How it's built

```
public/index.html, public/app/   the app (store.js = phone storage + sync, logic.js = sums, main.js = screens)
public/sw.js                     keeps the app on the phone for offline use. Bump VERSION when app files change.
src/app/api/sync                 phones send their changes and get everyone else's (newest change wins)
src/app/api/login|logout|me|password|people   logins (same accounts table as before)
src/lib/server                   session + sync table (created automatically on first sync)
```

Each record (sale, order, customer…) is one row in the `sync_records` table, so new kinds of record need no
database change.

Who can do what: everyone on the team can sell, book orders, record cooking, chemicals and expenses. Only the
boss can change prices, products and route days (the server refuses these from others), cancel sales, delete
records, and add or block helpers.

## Setup

Needs Node.js 20+. Locally it uses an embedded Postgres stored in `./.data`. On Vercel it uses `DATABASE_URL` (Neon).

```bash
npm install
npm run db:migrate                                  # accounts tables
npm run create-boss -- "Full Name" 0712345678      # prints a one-time temporary password
npm run dev                                         # http://localhost:3000
```

The first time the boss logs in, the app adds the 4 products (prices 0, set them in More → Products & prices) and
the 5 route days. Add helpers in More → Team logins. Each helper gets a temporary password and chooses their own.
