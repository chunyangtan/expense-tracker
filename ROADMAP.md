# Roadmap

What this app is for: one place for all my spending (JPY and MYR, cash and card) that replaces AppSheet, Google Sheets and Excel, with Claude answering questions about it. Phase 1 of the AI builder roadmap counts as done when I use the app every day instead of AppSheet.

The stack is fixed: Next.js + TypeScript + Tailwind, Claude API, Supabase, Vercel. Don't switch tools before Phase 3.

The reasons behind decisions live in `DECISIONS.md`. This file holds the plan and the technical details.

## Done

- **v1 (2026-05-23):** chat over `data/expenses.csv`. The whole CSV goes into the prompt, Haiku answers. `data/` is gitignored because it's personal data.
- **M1 (2026-10-24):** data moved to Supabase. 21 AppSheet rows imported, the chat reads from the `expenses` table, Haiku 5.5. Schema changes go through `supabase/migrations/` and `npx supabase db push`.
- **Overview page (2026-10-24):** `/dashboard` shows the latest month, the month before, monthly totals and a category breakdown, per currency. Plain HTML/CSS bars, no chart library.
- **Expense list (2026-10-24):** `/expenses` lists every expense, newest first, grouped by day.
- **M2 (2026-10-24):** `/add` logs cash expenses, defaulting to today, Cash and JPY, with the last 10 entries below. A real entry saved in about a second.

## Phase 1: in daily use

Each milestone ships on its own. Do them in order.

### M1: move the data to Supabase

- [x] Create a Supabase project. Put `SUPABASE_URL` and the key in `.env.local`
- [x] Create an `expenses` table using the schema below
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

The smallest statement import, so card spending doesn't go unrecorded once AppSheet stops. Rakuten 家計簿 has no export or API, so data comes from each source's own statement CSV. Rakuten Card's comes from e-NAVI (PC site only).

- [ ] Schema additions (see Schema): `external_id`, `kind`, `original_amount`, `original_currency`
- [ ] Upload a Rakuten Card CSV, parse it, keep the original text in `raw_description`, set `source = 'statement:rakuten-card'`
- [ ] Claude suggests category and sub-category from the existing values
- [ ] Review the rows, then insert. Skip rows whose `(source, external_id)` already exists

Done when a month's Rakuten Card statement is in the table with categories, and re-uploading it adds nothing.

### M4: deploy and use it on my phone

- [ ] Supabase auth, single user (me), with row-level security on `expenses`
- [ ] Deploy to Vercel and set the environment variables
- [ ] Make the form work at phone width
- [ ] Stop entering expenses in AppSheet

Done when a week of spending is logged here (cash by hand, Rakuten Card by import) and not in AppSheet. That closes Phase 1.

## After Phase 1

- **M5, more statement sources:** one parser per source, reusing M3's review and dedup flow: SMBC Card (Vpass), PayPay, Rakuten Pay, Wise. Count each payment flow once: if a wallet is topped up from a card, import the purchases from one side only and mark top-ups as `kind = 'transfer'`.
- **M6, history:** import the row-level 2020 and 2023 files. Leave out 2017–2019, because those files only have monthly category totals.
- **M7, better analysis:** once the data is too big to put the whole table in the prompt, give Claude tools (query by date, category or currency) in place of the full dump. Use Sonnet in production.
- **M8, accounts and balances:** grow into a personal finance tracker. An `accounts` table (name, institution, type, currency), balance snapshots, income, and bank statement import through the M3/M5 flow. Needs M4's auth and RLS first. Store account names and balances only, never login credentials or full account numbers.
- **Later:** receipt photos (`receipt_url`, Supabase storage, merged with `photos`), tags, monthly summaries.

## Schema

The base is the AppSheet columns, which were already well structured:

| Column | Type | Notes |
|---|---|---|
| id | uuid | generated; the AppSheet Row ID is a plain counter and isn't kept |
| date | date | |
| item_name | text | |
| category | text | e.g. `Variable (変動費)` |
| sub_category | text | |
| payment_method | text | |
| amount | numeric | no currency sign |
| notes | text | |
| photos | text | carried over from AppSheet |
| created_at, modified_at | timestamptz | |

New columns: `currency` (`JPY` or `MYR`), `source` (`appsheet`, `manual`, `statement:<bank>`), `raw_description`, `receipt_url`, `tags` (text[]). Month-Year isn't stored, because it can be worked out from `date`.

Added in M3, for statement import:

| Column | Type | Notes |
|---|---|---|
| external_id | text | the statement's own ID, or a hash of date + amount + raw description; unique together with `source` |
| kind | text | `expense` (default), `refund`, `transfer`. Refunds are negative amounts. Transfers (card payments, wallet top-ups) aren't spending |
| original_amount, original_currency | numeric, text | for foreign purchases billed in another currency, e.g. a MYR purchase on a JPY card |

The `currency` check may need to allow more than JPY and MYR once Wise is imported (M5).
