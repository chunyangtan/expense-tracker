# Decisions

Why this project is built the way it is. `ROADMAP.md` covers what is being built and when; this file covers why. Add an entry whenever a choice is made, while the reasons are fresh, so later sessions read the real reasons instead of guessing them from the code. Newest first.

Each entry gives the choice, the alternatives and the reasons. If a reason was reconstructed after the fact and not recorded at the time, say so.

## 2026-10-24: Supabase for data, auth and storage

- **Choice:** Supabase (hosted Postgres) as the database from M1, and later for auth (M3) and receipt storage.
- **Alternatives:** Firebase, Neon / PlanetScale / Vercel Postgres, SQLite or Turso, keeping Google Sheets or AppSheet.
- **Why:**
  - Over Firebase: real Postgres and SQL. Spending data is relational (totals by category, month, currency), which is awkward in a document store. No lock-in, since a `pg_dump` takes the data anywhere.
  - Over Neon, PlanetScale or Vercel Postgres: those are only databases. Supabase also gives auth, row-level security and file storage, which M3 and receipt photos need, without adding separate services for each.
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
- **Why:** it's the simplest path to a working app, with no schema migrations, ORM or infrastructure, and it's cheap for a small personal dataset. Move to Supabase once cash input and statement import arrive (M1). When the data gets too big for the prompt, give Claude query tools rather than building a RAG pipeline (M6).

## 2026-05-23: Haiku for development

- **Choice:** Claude Haiku while iterating, Sonnet in production.
- **Alternative:** Sonnet from the start.
- **Why:** Haiku is the fastest and cheapest model for iteration. Switch to Sonnet for production, or earlier if queries get too complex for Haiku.

## 2026-05-23: leave out the 2017–2019 data

- **Choice:** don't import the 2017–2019 expense files.
- **Why:** they're monthly category totals, not row-level transactions, so importing them would create fake precision. The 2020 and 2023 files are row-level and get imported in M5.

## 2026-05-23: the AppSheet schema is the target schema

- **Choice:** use the AppSheet columns as the base schema, plus currency and import-source fields (see Schema in `ROADMAP.md`).
- **Why:** the 2026 AppSheet data was already well structured, so it's the base that everything else maps into.
