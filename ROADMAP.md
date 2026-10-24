# Roadmap

What this app is for: one place for all my spending (JPY and MYR, cash and card) that replaces AppSheet, Google Sheets and Excel, with Claude answering questions about it. Phase 1 of the AI builder roadmap counts as done when I use the app every day instead of AppSheet.

The stack is fixed: Next.js + TypeScript + Tailwind, Claude API, Supabase, Vercel. Don't switch tools before Phase 3.

The reasons behind decisions live in `DECISIONS.md`. This file holds the plan and the technical details.

## Done

- **v1 (2026-05-23):** chat over `data/expenses.csv`. The whole CSV goes into the prompt, Haiku answers. `data/` is gitignored because it's personal data.

## Phase 1: in daily use

Each milestone ships on its own. Do them in order.

### M1: move the data to Supabase

- [ ] Create a Supabase project. Put `SUPABASE_URL` and the key in `.env.local`
- [ ] Create an `expenses` table using the schema below
- [ ] Write a one-off script that imports `data/expenses.csv` (strip `¥` and commas from amounts, set `currency = 'JPY'`, `source = 'appsheet'`)
- [ ] Make `app/api/chat/route.ts` read rows from Supabase instead of the file
- [ ] Update the Haiku model ID (the code still uses `claude-haiku-4-5-20251001`)

Done when the chat gives the same answers as before, with the data coming from the database.

### M2: add expenses by hand (cash)

- [ ] Add-expense form: date, item, category, sub-category, payment method, amount, currency (JPY/MYR), notes
- [ ] Pick categories and payment methods from the values already in the data
- [ ] Show recent expenses in a list so I can check what I entered

Done when I can log a cash purchase in under 15 seconds.

### M3: deploy and use it on my phone

- [ ] Supabase auth, single user (me), with row-level security on `expenses`
- [ ] Deploy to Vercel and set the environment variables
- [ ] Make the form work at phone width
- [ ] Stop entering expenses in AppSheet

Done when a week of spending is logged here and not in AppSheet. That closes Phase 1.

## After Phase 1

- **M4, statement import:** upload a bank or credit card CSV, map its columns to `expenses`, keep the original text in `raw_description`, let Claude suggest the category, review the rows, then insert. Skip duplicates.
- **M5, history:** import the row-level 2020 and 2023 files. Leave out 2017–2019, because those files only have monthly category totals.
- **M6, better analysis:** once the data is too big to put the whole table in the prompt, give Claude tools (query by date, category or currency) in place of the full dump. Use Sonnet in production.
- **Later:** receipt photos (`receipt_url`, Supabase storage), tags, monthly summaries.

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
