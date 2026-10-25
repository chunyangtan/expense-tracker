# Roadmap

What this app is for: one place for all my spending (JPY and MYR, cash and card) that replaces AppSheet, Google Sheets and Excel, with Claude answering questions about it. Phase 1 of the AI builder roadmap counts as done when I use the app every day instead of AppSheet.

The stack is fixed: Next.js + TypeScript + Tailwind, Claude API, Supabase, Vercel. Don't switch tools before Phase 3.

The reasons behind decisions live in `DECISIONS.md`. This file holds the plan and the technical details.

## Done

- **v1 (2026-05-23):** chat over `data/expenses.csv`. The whole CSV goes into the prompt, Haiku answers. `data/` is gitignored because it's personal data.
- **M1 (2026-10-24):** data moved to Supabase. 21 AppSheet rows imported, the chat reads from the `expenses` table, Haiku 5.5. Schema changes go through `supabase/migrations/` and `npx supabase db push`.
- **Overview page (2026-10-24):** `/dashboard` shows the latest month, the month before, monthly totals and a category breakdown, per currency. Plain HTML/CSS bars, no chart library.
- **Expense list (2026-10-24):** `/expenses` lists every expense, newest first, grouped by day.
- **Change history and backups (2026-10-24):** a trigger writes every insert, update and delete on `expenses` to `expenses_history` (old and new row as JSON), starting from a baseline snapshot of all 531 rows. A second trigger sets `modified_at`. `npm run backup` writes `data/backups/expenses-YYYY-MM-DD.csv`.
- **M2 (2026-10-24):** `/add` logs cash expenses, defaulting to today, Cash and JPY, with the last 10 entries below. A real entry saved in about a second.

## Phase 1: in daily use

Each milestone ships on its own. Do them in order.

### M1: move the data to Supabase

- [x] Create a Supabase project. Put `SUPABASE_URL` and the key in `.env.local`
- [x] Create an `expenses` table (see `docs/data-model.md`)
- [x] Write a one-off script that imports `data/expenses.csv` (strip `¥` and commas from amounts, set `currency = 'JPY'`, `source = 'appsheet'`)
- [x] Make `app/api/chat/route.ts` read rows from Supabase instead of the file
- [x] Update the Haiku model ID (now `claude-haiku-5-5`)

Done when the chat gives the same answers as before, with the data coming from the database.

### M2: add cash expenses by hand (done)

Most spending is already digital (Rakuten Card, Rakuten Pay, PayPay, Wise, SMBC Card) and comes in through statement import (M3). The form is for cash.

- [x] Add-expense form: date, item, category, sub-category, payment method, amount, currency (JPY/MYR), notes
- [x] Defaults: today, `Cash`, `JPY`, so a typical entry is item, category and amount
- [x] Pick categories and payment methods from the values already in the data
- [x] Show recent expenses in a list so I can check what I entered (`/add` shows the last 10 added)

Done when I can log a cash purchase in under 15 seconds.

### M3: import Rakuten Card statements

The smallest statement import, so card spending doesn't go unrecorded once AppSheet stops. Rakuten 家計簿 has no export or API, so data comes from each source's own statement CSV. Rakuten Card's comes from e-NAVI (PC site only). The CSVs are kept in Google Drive under `Finance/Credit Card - Rakuten`.

- [x] Schema additions: `external_id`, `kind`
- [x] `/import`: upload one or more CSVs, parse them (`lib/statements/rakuten-card.ts`), keep the original text in `raw_description`, set `source = 'statement:rakuten-card'`
- [x] Fixed rules for 楽天キャッシュ チャージ, Suica top-ups and ふるさと納税; Claude suggests the rest from the existing values (`lib/statements/categorise.ts`)
- [x] A row with the same date and amount as an earlier non-cash entry merges into it: the statement's name, the existing category, the old name kept in notes
- [x] Review the rows, then insert. Rows whose `(source, external_id)` already exists are skipped
- [x] Import the 12 months in Drive (2025-09 to 2026-10): 513 rows, 4 merged into AppSheet entries
- [ ] Check a month's total against e-NAVI, and categorise the 2 rows left without one

Done when a month's Rakuten Card statement is in the table with categories, and re-uploading it adds nothing.

### M4: deploy and use it on my phone

- [x] Supabase auth, single user (me), with row-level security on `expenses`: email and password, sign-ups off, `ALLOWED_EMAIL` checked on every page, Server Action and route (`lib/auth.ts`), `proxy.ts` refreshes the session
- [x] Deploy to Vercel and set the environment variables: https://expense-tracker-alpha-murex-98.vercel.app (functions in Singapore)
- [x] Make the form work at phone width
- [ ] Stop entering expenses in AppSheet

Done when a week of spending is logged here (cash by hand, Rakuten Card by import) and not in AppSheet. That closes Phase 1.

### M4.5: everyday UI

The screens in `docs/ui.md`, built in this order so each step is usable on its own.

- [x] Design the core screens (`docs/ui.md`, mockup linked there)
- [ ] App shell: bottom tab bar, Home at `/`, chat moves to `/ask`, More page
- [ ] Edit and delete: `/transactions/[id]`, opened from any row, using the same entry form as Add
- [ ] Transactions (`/transactions`, `/expenses` redirects): month switcher, day totals, search and filter chips, then the calendar view
- [ ] Entry form (Add and Edit): amount and type, item that fills its category and payment method, most-used category chips and a searchable sheet, any payment method, date chips, Undo toast
- [ ] To check: `confirmed_at` column (backfill existing rows), import inserts rows unconfirmed instead of a review step before insert, `/to-check` queue with ✓ per row and Confirm all, Home banner, Transactions filter
- [ ] Home: this month's total, change from last month, category breakdown, 6-month bars, latest entries

Done when I can add, fix and review a day's spending on my phone without opening Supabase.

## After Phase 1

- **M5, more statement sources:** one parser per source, reusing M3's review and dedup flow: SMBC Card (Vpass), PayPay, Rakuten Pay, Wise. Count each payment flow once: if a wallet is topped up from a card, import the purchases from one side only and mark top-ups as `kind = 'transfer'`.
- **M6, history:** import the row-level 2020 and 2023 files. Leave out 2017–2019, because those files only have monthly category totals.
- **M7, better analysis:** the pages and the chat read the table in one request, and the API returns at most 1000 rows per request, so they need paging or aggregate queries before the table passes 1000 rows (531 on 2026-10-24, roughly 45 a month). Once the data is too big to put the whole table in the prompt, give Claude tools (query by date, category or currency) in place of the full dump. Use Sonnet in production.
- **M8, accounts and balances:** grow into a personal finance tracker. An `accounts` table (name, institution, type, currency), balance snapshots, income, and bank statement import through the M3/M5 flow. Needs M4's auth and RLS first. Store account names and balances only, never login credentials or full account numbers.
- **Later:** receipt photos (`receipt_url`, Supabase storage, merged with `photos`), tags, monthly summaries.

## Data model

Tables, columns and the rules every feature follows are in `docs/data-model.md`.
