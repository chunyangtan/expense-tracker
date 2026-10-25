# Decisions

Why this project is built the way it is. `ROADMAP.md` covers what is being built and when; this file covers why. Add an entry whenever a choice is made, while the reasons are fresh, so later sessions read the real reasons instead of guessing them from the code. Newest first.

Each entry gives the choice, the alternatives and the reasons. If a reason was reconstructed after the fact and not recorded at the time, say so.

## 2026-10-25: separate Japan and Malaysia books

- **Choice:** keep two books, Japan (JPY) and Malaysia (MYR), each with its own transactions, totals and, later, accounts and net worth. A book switch sits at the top of Home, Transactions and Add. Money between them is a transfer with two sides, one in each currency. An entry belongs to the book whose money paid for it.
- **Alternatives:**
  - One book with a home currency, converting MYR to JPY at a daily rate (what most apps, including Money Forward ME, do with foreign accounts).
  - One book with per-currency subtotals side by side on every screen.
  - Two completely separate apps or logins.
- **Why:**
  - I run my Japanese and Malaysian money as two separate households, not as one pot measured in yen. Converted totals would move with the exchange rate even when nothing was spent, and would hide what each side actually costs.
  - Side-by-side subtotals everywhere (the first mockup's `RM 86.50 in MYR` line) cluttered every screen with a second currency I only care about when I'm dealing with that side.
  - Separate apps would lose transfers between the two, which are real events (Wise transfers) with a real rate worth seeing.
  - It extends data-model rule 2 (never add currencies) rather than adding a new idea, and needs no schema change until accounts arrive in M8.

## 2026-10-25: everyday UI

- **Choice:** a phone-first app shell with a bottom tab bar (Home, Transactions, ＋, Ask, More), Home as the landing page instead of the chat, an amount-first Add screen, and an Edit screen with a Counts as switch (Expense / Refund / Transfer). The full design is in `docs/ui.md`, with a clickable mockup linked from there. Only the skeleton is designed now. Budgets, recurring costs and the other settings are designed when they're built.
- **Alternatives:**
  - Keep the current pages and polish them (header text links, `/` as chat, one long expense list).
  - Copy one app's layout outright (Money Forward ME or Zaim).
  - Design every screen, budgets and settings included, before building anything.
- **Why:**
  - The goal is to use the app every day instead of AppSheet. The current pages are read-only for entries, the nav is small text links, and the list shows every row at once. Each of those makes daily use on a phone harder.
  - The tab bar, Home summary, month switcher, list/calendar toggle and category grid are what Money Forward ME, Zaim and the smaller 家計簿 apps share (surveyed 2026-10-24), so they're familiar patterns rather than inventions. Bank sync, assets and family sharing are left out because they don't fit a single user who imports statements.
  - Amount first with one tap for the category is how the fast apps get an entry to a few seconds. The native decimal keyboard does the job without building a custom keypad.
  - Home leads because "where did this month go" is the most common question. The chat is still one tap away as Ask.
  - The Counts as switch exposes `kind`, which the import already sets but nothing could change by hand. Transfers and refunds have to be fixable for the totals to be trusted.
  - The tab and route are called Transactions rather than History or Expenses because the app grows into a finance tracker (M8), and the same list will hold income and transfers. Naming it now avoids renaming a route and a tab later. The rest of that growth path is in `docs/ui.md`.
  - Designing only the screens needed to stop using AppSheet keeps this from turning into a long design phase. The rest is cheaper to design once I've used the basics for a week.

## 2026-10-24: Vercel MCP server only, not the Vercel plugin

- **Choice:** add the Vercel MCP server (`mcp.vercel.com`) to this project's `.mcp.json`, so Claude Code can read deployments, logs and environment variables.
- **Alternatives:** the full `vercel/vercel-plugin`; the Vercel CLI only (`npx vercel` after `vercel login`).
- **Why:**
  - Reading production logs and deployment status is the one thing Claude Code couldn't do after deploy.
  - The full plugin adds session-start hooks that run in every Next.js project and add a map of Vercel's products to the context on every task, plus 37 mostly irrelevant skills, telemetry on by default, and a Bun dependency.
  - The MCP server alone gives the useful part, scoped to this repo.
  - The CLI also works, and stays as the fallback.

## 2026-10-24: auth checked on the server, data stays server-only

- **Choice:**
  - Supabase Auth with email and password, sign-ups turned off, and a single `ALLOWED_EMAIL`.
  - Every page, Server Action and route checks the session on the server. Data access stays on the server with the secret key.
  - Row-level security stays on with no policies.
- **Alternatives:**
  - RLS policies tied to the logged-in user (a `user_id` column), with queries running as that user.
  - Magic-link login.
  - Relying on `proxy.ts` alone.
- **Why:**
  - The browser never talks to Supabase directly; everything goes through Server Components, Server Actions and the chat route. So RLS's job is to block the public API completely, which "on, no policies" already does. Per-user policies would add a column and a second client to protect one user from themselves.
  - The `ALLOWED_EMAIL` check means an account created by mistake still sees nothing.
  - A password works with a password manager on the phone. Magic links rely on Supabase's rate-limited default email and open a new browser tab on the phone.
  - Next.js 16 documents Proxy as an optimistic check only, not authorisation, so the real check sits next to the data access.

## 2026-10-24: change history by trigger, backups by CSV

- **Choice:** a database trigger copies every insert, update and delete on `expenses` into `expenses_history`, with the old and new row as JSON. `npm run backup` writes a dated CSV of the whole table, kept in Google Drive.
- **Alternatives:** Supabase's request logs; the `supa_audit` extension; point-in-time recovery or daily backups on the Pro plan; recording changes in the app code.
- **Why:**
  - Supabase is the only complete copy of the data (cash entries exist nowhere else), and the free plan's logs are short-lived and don't show before/after values.
  - A trigger records edits from every path, including the Supabase dashboard, which app-level logging would miss.
  - A plain table and trigger is a few lines of SQL with no extension to learn. Pro-plan backups cost money this project doesn't need yet.
  - A CSV opens anywhere, and Drive is where personal files already live.
  - History started after the first Rakuten Card import, so it opens with a baseline snapshot of every row.

## 2026-10-24: Rakuten Card import rules

- **Choice:**
  - 楽天キャッシュ チャージ (Rakuten Pay top-ups) count as spending, under Variable / Rakuten Pay (unsplit), until Rakuten Pay history is imported (M5). Then they become `kind = 'transfer'`.
  - Suica top-ups count as Variable / Transportation.
  - Payments to a municipality (e.g. 茨城県境町) are Special / ふるさと納税.
  - A statement row with the same date and amount as an earlier non-cash entry merges into it. The statement's name wins, the existing category stays, and the old name goes into notes.
  - `original_amount` / `original_currency` were dropped from the plan.
- **Alternatives:**
  - Mark top-ups as transfers now, or pull Rakuten Pay history into Phase 1.
  - Keep the AppSheet name on merged rows, or skip merging and let the reviewer untick duplicates.
- **Why:**
  - Top-ups are about a third of the statement rows, and the Rakuten Pay purchases behind them aren't on the card statement. Marking them as transfers now would drop that spending until M5. Counting the top-ups keeps the monthly totals right, just less detailed.
  - Per-ride Suica detail isn't worth chasing.
  - The statement name is the record that matches the bank. Hand-entered names are kept in notes, so nothing is lost.
  - The statement's foreign-purchase line gives the local amount and rate but not the currency, so dedicated columns couldn't be filled reliably. It's kept in `raw_description` instead.

## 2026-10-24: card data comes from statement CSVs, cash by hand

- **Choice:** most spending is digital (Rakuten Card, Rakuten Pay, PayPay, Wise, SMBC Card), so only cash is entered by hand (M2) and card data comes from each source's statement CSV. A Rakuten Card–only import (M3) moves into Phase 1, before AppSheet is dropped (M4). Milestones were renumbered: deploy is now M4, other sources M5, history M6, analysis tools M7.
- **Alternatives:** export from Rakuten 家計簿, which already aggregates these accounts; keep entering card spending by hand until a later import milestone; keep Rakuten 家計簿 for cards and only move cash here.
- **Why:**
  - Rakuten 家計簿 has no CSV export or public API (checked its help page on 2026-10-24), and scraping the app would be fragile.
  - Statement CSVs are the original records, and each source offers them (Rakuten Card via e-NAVI on the PC site).
  - With the import after Phase 1, stopping AppSheet would leave card spending unrecorded. Rakuten Card is the biggest source, so importing just that is the smallest step that keeps the data complete.
  - Wallets topped up from a card show each purchase twice, so each payment flow is counted from one source only and top-ups are marked as transfers.

## 2026-10-24: schema additions for statement import

- **Choice:** in M3, add `external_id` (unique with `source`) and `kind` (`expense` / `refund` / `transfer`, refunds negative). Nothing changes for M2. (`original_amount` / `original_currency` were planned too, then dropped; see the import rules entry.)
- **Alternatives:** dedupe by matching date + amount at insert time; separate tables for refunds and transfers; lookup tables for categories and payment methods.
- **Why:** re-uploading a statement must add nothing, which needs a stored key. Card payments and top-ups appear on statements but aren't spending, so they need a flag rather than deletion. Foreign purchases are billed in JPY but bought in another currency, and both amounts matter. Categories stay free text, picked from existing values, because lookup tables add work without a current need.

## 2026-10-24: bank accounts after Phase 1 (M8)

- **Choice:** accounts, balances and income come after Phase 1, after statement import, as M8.
- **Alternatives:** add them in Phase 1; make them a separate project.
- **Why:** bank statements reuse the M3/M5 import flow, and balances are more sensitive than expenses, so M4's auth and RLS must exist first. It stays in this app because it's the same data. Only account names and balances are stored, never credentials or full account numbers.

## 2026-10-24: Vercel for hosting

- **Choice:** host the app on Vercel's Hobby plan, deployed from GitHub, so every push to `main` deploys to production.
- **Alternatives:** Netlify, Cloudflare (via the OpenNext adapter), Railway / Render / Fly, a VPS running `next start`.
- **Why:**
  - Vercel makes Next.js, so Server Actions, `proxy.ts` and streaming work with no setup. Cloudflare needs an adapter with gaps in Node.js support (the statement parser uses `node:crypto`). Netlify's Next.js runtime trails new releases.
  - It bills per request. Railway, Render and Fly run a container all the time, which means paying monthly or a sleeping free tier whose first load takes seconds, too slow for logging a purchase in 15 seconds. A VPS means maintaining the OS, TLS and deploys.
  - The Hobby plan covers personal, non-commercial use, which one user's traffic fits easily. You get push-to-deploy, preview URLs and environment variables in a dashboard.
  - Downsides: Hobby is non-commercial only, and server functions have time limits, which matters if an import or chat ever runs long. Lock-in is low, since `next start` runs the same app anywhere.
- **Region:** functions run in Singapore (`sin1`, set in `vercel.json`), next to the Supabase project (`ap-southeast-1`). Each page makes several database queries, which stay inside Singapore. A request from Japan crosses to Singapore once (about 70 ms), and Malaysia is close. Moving Supabase to Tokyo would need a new project and a data migration, which isn't worth it.
- **Note:** the stack was chosen before 2026-05-23, but the comparison wasn't written down. These reasons were reconstructed on 2026-10-24 and confirmed by me.

## 2026-10-24: Supabase for data, auth and storage

- **Choice:** Supabase (hosted Postgres) as the database from M1, and later for auth (M4) and receipt storage.
- **Alternatives:** Firebase, Neon / PlanetScale / Vercel Postgres, SQLite or Turso, keeping Google Sheets or AppSheet.
- **Why:**
  - Over Firebase: real Postgres and SQL. Spending data is relational (totals by category, month, currency), which is awkward in a document store. No lock-in, since a `pg_dump` takes the data anywhere.
  - Over Neon, PlanetScale or Vercel Postgres: those are only databases. Supabase also gives auth, row-level security and file storage, which M4 and receipt photos need, without adding separate services for each.
  - Over SQLite or Turso: Vercel's filesystem doesn't keep files between requests, so a local SQLite file won't work there. Turso fixes that but has no auth or storage.
  - Over Google Sheets or AppSheet: those are what this app replaces. They're slow to query, have no real types, and are clunky to write to from an app.
  - Overall: the free tier is enough for one user, the client is TypeScript, and it's widely used with Next.js and Vercel.
- **Note:** the stack was chosen before 2026-05-23, but the comparison wasn't written down. These reasons were reconstructed on 2026-10-24 and confirmed by me.

## 2026-05-23: the project and its goal

- **Choice:** build an AI-powered personal expense tracker as the Phase 1 project of my AI builder roadmap. It starts as a chat over my real expense data and grows into a full tracker with cash input, statement import and spending analysis.
- **Why:**
  - Practical: my expense data is spread across AppSheet, Google Sheets and Excel. I want one place for JPY and MYR, cash and card.
  - Learning: Phase 1's goal is one real personal tool that I ship and use every day. Building something I use daily is the fastest way to learn the stack properly.
- **Alternatives:** an AI job application agent and a CV/portfolio site with AI chat. Both are kept as Phase 2 candidates, not replacements.

## 2026-05-23: CSV in the prompt, no database in v1

- **Choice:** put the whole expense CSV in the prompt and let Claude answer.
- **Alternative:** set up a database (Supabase) from the start.
- **Why:** it's the simplest path to a working app, with no schema migrations, ORM or infrastructure, and it's cheap for a small personal dataset. Move to Supabase once cash input and statement import arrive (M1). When the data gets too big for the prompt, give Claude query tools rather than building a RAG pipeline (M7).

## 2026-05-23: Haiku for development

- **Choice:** Claude Haiku while iterating, Sonnet in production.
- **Alternative:** Sonnet from the start.
- **Why:** Haiku is the fastest and cheapest model for iteration. Switch to Sonnet for production, or earlier if queries get too complex for Haiku.

## 2026-05-23: leave out the 2017–2019 data

- **Choice:** don't import the 2017–2019 expense files.
- **Why:** they're monthly category totals, not row-level transactions, so importing them would create fake precision. The 2020 and 2023 files are row-level and get imported in M6.

## 2026-05-23: the AppSheet schema is the target schema

- **Choice:** use the AppSheet columns as the base schema, plus currency and import-source fields (see `docs/data-model.md`).
- **Why:** the 2026 AppSheet data was already well structured, so it's the base that everything else maps into.
