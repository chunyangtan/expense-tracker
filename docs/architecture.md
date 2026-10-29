# Architecture

What runs where, and the path one page request takes. Update the diagram (`architecture.svg`) when a service, region or data flow changes.

![Architecture: phone, Vercel and Supabase in Tokyo, Claude API, build and operations](architecture.svg)

Everything a page needs runs in Tokyo: the Vercel functions (`hnd1`) and the Supabase project (`ap-northeast-1`) are in the same region, so the several queries per page stay local. The one call that leaves Tokyo goes to the Claude API, and only the chat and statement import make it. Why Tokyo: `DECISIONS.md`, 2026-10-29.

## One page request

1. The phone sends the request with its session cookie.
2. `proxy.ts` refreshes the session with Supabase Auth.
3. Signed-out visitors go to `/login`. Otherwise the page or action runs and calls `requireUser()` first, which checks `ALLOWED_EMAIL`.
4. The function reads and writes through the Data API with the secret key. Triggers write every change to `expenses_history`.
5. Only Ask (chat) and Import (categories) call Claude.

## Outside the request path

- A push to `main` on GitHub builds and deploys to Vercel.
- Schema changes go from `supabase/migrations/` through `supabase db push`.
- `npm run backup` writes a dated CSV, uploaded to Drive monthly by hand.
- Rakuten Card CSVs are kept in Drive and uploaded through Import.
