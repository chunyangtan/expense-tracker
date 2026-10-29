# expense-tracker

A personal expense tracker: a Claude chat over my own spending data (JPY and MYR, cash and card), growing toward replacing AppSheet for daily entry. `ROADMAP.md` has the plan and current milestone. Update it when a milestone task lands. `docs/data-model.md` has the tables and the rules every feature follows, such as leaving transfers out of totals. Read it before touching data, and update it when a rule changes. `DECISIONS.md` has the reasons behind each choice.

## Next.js here is newer than your training data

This is Next.js 16 with React 19 and Tailwind 4. APIs, conventions and file structure may differ from what you know. Before writing Next.js code, read the relevant guide in `node_modules/next/dist/docs/` (`01-app/` covers the App Router) and heed deprecation notices.

## Commands

- `npm run dev`: dev server at http://localhost:3000
- `npm run lint` and `npx tsc --noEmit`: run both before calling a change done
- `npm run build`: production build check
- `npm run backup`: dated CSV of all expenses in `data/backups/`. Monthly, upload it to Google Drive under `Finance/Expense Tracker Backups`

## Layout

- `app/(tabs)/`: pages with the bottom tab bar (`layout.tsx`, `tab-bar.tsx`): Home (`page.tsx`), `transactions/`, `ask/` (chat UI, client component), `more/`, `import/`. `app/add/` and `app/transactions/[id]/` (edit) sit outside so the entry form gets the whole screen. Both use the one form in `app/_entry/`. `app/to-check/` is the queue of imported rows waiting to be confirmed
- `lib/book.ts` (the Japan/Malaysia book, remembered in a cookie), `lib/dates.ts` (Tokyo dates and months), `lib/select-all.ts` (paging past the 1000-row limit)
- `docs/ui.md`: screens and shared UI patterns. Read it before building or changing a screen
- `docs/architecture.md`: what runs where (diagram in `architecture.svg`). Update it when a service, region or data flow changes
- `app/api/chat/route.ts`: chat endpoint that sends the expense data to Claude
- `data/`: my real expense exports. Gitignored personal data, never commit it
- `.env.local`: `ANTHROPIC_API_KEY`, `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `SUPABASE_PUBLISHABLE_KEY`, `ALLOWED_EMAIL`. Never read or print it
- `lib/auth.ts`: `requireUser()` goes at the top of every page and Server Action

## Conventions

- The stack is fixed until Phase 3: Next.js + TypeScript + Tailwind, Claude API, Supabase, Vercel. Don't propose alternatives. Suggest the smallest next step instead.
- Use Haiku while developing and Sonnet in production.
- Ship the simplest working version first, e.g. the full CSV in the prompt before any query tools.
- The repo is the single source of truth for this project. `DECISIONS.md` holds the reasons behind choices; read it before asking why something is the way it is or proposing a change. When a decision is made, add an entry in the same piece of work, e.g. picking a charting library gets an entry with the alternatives and why. Notion only tracks the project's status.

## Git

Commit without asking whenever a piece of work is finished and working, so progress is saved in small, readable steps. For example, when a `ROADMAP.md` task is done, commit it. Pushing is a separate decision, so ask before pushing.
