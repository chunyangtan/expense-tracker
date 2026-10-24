# expense-tracker

A personal expense tracker: a Claude chat over my own spending data (JPY and MYR, cash and card), growing toward replacing AppSheet for daily entry. `ROADMAP.md` has the plan, current milestone and data schema. Update it when a milestone task lands.

## Next.js here is newer than your training data

This is Next.js 16 with React 19 and Tailwind 4. APIs, conventions and file structure may differ from what you know. Before writing Next.js code, read the relevant guide in `node_modules/next/dist/docs/` (`01-app/` covers the App Router) and heed deprecation notices.

## Commands

- `npm run dev`: dev server at http://localhost:3000
- `npm run lint` and `npx tsc --noEmit`: run both before calling a change done
- `npm run build`: production build check

## Layout

- `app/page.tsx`: chat UI (client component)
- `app/api/chat/route.ts`: chat endpoint that sends the expense data to Claude
- `data/`: my real expense exports. Gitignored personal data, never commit it
- `.env.local`: `ANTHROPIC_API_KEY` (and Supabase keys from M1). Never read or print it

## Conventions

- The stack is fixed until Phase 3: Next.js + TypeScript + Tailwind, Claude API, Supabase, Vercel. Don't propose alternatives. Suggest the smallest next step instead.
- Use Haiku while developing and Sonnet in production.
- Ship the simplest working version first, e.g. the full CSV in the prompt before any query tools.
- The reasons behind decisions go in Notion CY Hub as decision Notes linked to the expense-tracker project. Offer to save one when a decision comes up. Code, plans and technical detail stay in this repo.
