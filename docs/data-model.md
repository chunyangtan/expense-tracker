# Data model

How the expense data behaves: the tables, what each value means, and the rules every feature has to follow. Read it before writing a query, an import or a form. The reasons behind each rule are in `DECISIONS.md`. Update this file in the same change whenever a rule or column changes.

## Rules

1. **Spending totals leave out transfers.** Any query that sums spending filters `kind <> 'transfer'`. Card payments and wallet top-ups move money; they aren't spending. Example: the overview and the chat both use `.neq("kind", "transfer")`.
2. **Never add amounts in different currencies together.** Totals are per currency, which today means per book: the Japan book is JPY and the Malaysia book is MYR (`docs/ui.md`, Books). An entry belongs to the book whose money paid for it, so a card purchase in Malaysia billed in yen is a JPY row.
3. **Amounts are positive for spending and negative for refunds**, with `kind = 'refund'`. There is no currency sign in `amount`.
4. **Count each payment once.** When a wallet is topped up from a card, only one side counts as spending. For now, Rakuten Cash top-ups on the card statement count as spending (Variable / Rakuten Pay (unsplit)). They become transfers once Rakuten Pay history is imported (M5).
5. **Imports never insert the same row twice.** Every imported row has an `external_id` that's stable across re-uploads, and `(source, external_id)` is unique. If the statement has no transaction ID, hash date + raw description + amount, plus a counter for identical rows in the same file (see `lib/statements/rakuten-card.ts`).
6. **An imported row that matches an earlier entry merges into it** instead of being inserted. A match has the same date and amount, and the earlier entry isn't cash. The statement's name and `source` win, the existing category stays, and the old name goes into `notes` as `Entered as: …`.
7. **Every change is recorded.** A trigger writes each insert, update and delete to `expenses_history`, and another sets `modified_at`. Code doesn't need to do either.
8. **"Today" is Tokyo's date**, even when the server runs in UTC. `date` is the purchase date, not the billing date.
9. **Schema changes go through migrations** in `supabase/migrations/`, applied with `npx supabase db push --linked`. Then regenerate `lib/database.types.ts` with `npx supabase gen types typescript --linked`.
10. **Imported rows start unconfirmed.** `confirmed_at` is null until I check the row in To check (`docs/ui.md`). Hand-entered rows get `confirmed_at` set when saved. An import that merges into an existing row (rule 6) clears it again. Totals include unconfirmed rows; the flag is about trust, not about counting. (Planned for M4.5, not in the table yet. Existing rows are backfilled as confirmed, since AppSheet rows were typed in and Rakuten Card rows were reviewed before insert.)
11. **The API returns at most 1000 rows per request.** Anything that reads the whole table must page through it (`scripts/backup.mts` does) or aggregate in SQL.

## `expenses`

One row per purchase, refund or transfer.

| Column | Type | Meaning |
|---|---|---|
| id | uuid | generated |
| date | date | purchase date |
| item_name | text | readable name. For imports, the statement text normalised (half-width katakana to full-width, e.g. `ﾏﾙｴﾂ` → `マルエツ`) |
| category | text | one of the three below |
| sub_category | text | free text, picked from existing values where one fits, e.g. `Food & Groceries` |
| payment_method | text | e.g. `Cash`, `Rakuten Credit Card`, `Rakuten Pay`, `PayPay`, `Suica`, `Rakuten Point` |
| amount | numeric(12,2) | see rule 3 |
| currency | text | `JPY` or `MYR` (may widen when Wise is imported) |
| notes | text | |
| photos | text | carried over from AppSheet |
| source | text | where the row came from: `appsheet`, `manual` (the `/add` form), `statement:rakuten-card`; later `statement:<name>` per source |
| raw_description | text | the statement's original text. A foreign purchase's local-amount line (`現地利用額 … 変換レート …`) is appended after ` / ` |
| external_id | text | imports only; see rule 5 |
| kind | text | `expense` (default), `refund`, `transfer` |
| confirmed_at | timestamptz | planned (rule 10): when I checked the row; null = to check |
| receipt_url | text | unused yet (receipt photos, later) |
| tags | text[] | unused yet |
| created_at, modified_at | timestamptz | `modified_at` is set by a trigger |

Month-Year isn't stored; it comes from `date`.

### Categories

From the AppSheet data. Sub-categories are free text under them.

- `Living (生活費)`: recurring essentials, such as groceries, utilities, rent, phone and internet
- `Variable (変動費)`: everyday discretionary spending, such as dining out and hobbies
- `Special (特別出費・年数回)`: large or rare purchases, and ふるさと納税

Imports apply fixed rules first (Rakuten Cash top-ups, Suica top-ups, ふるさと納税; in `lib/statements/rakuten-card.ts`). Claude suggests the rest from the existing category and sub-category pairs (`lib/statements/categorise.ts`), and I review them before inserting.

### Books, not stored yet

The Japan and Malaysia books are derived from `currency` for now. Decided with M8, when accounts arrive: whether a book is a column or comes from the account, and how the two sides of a transfer between books are linked (likely a shared id on two `kind = 'transfer'` rows, one per book, each in its own currency).

## `expenses_history`

Append-only change log, written by a trigger on `expenses`. Readable by the server, never edited.

| Column | Meaning |
|---|---|
| expense_id | the `expenses.id` that changed |
| operation | `INSERT`, `UPDATE`, `DELETE`, or `BASELINE` (a snapshot of every row when history started, 2026-10-24) |
| old_row, new_row | the row before and after, as JSON |
| changed_at | when |

## Access

Only the server reads and writes data, using the secret key (`lib/supabase.ts`, marked `server-only`). Row-level security is on with no policies, so the browser's API roles (anon and authenticated) can't read or write anything.

Before any data access, every page and Server Action calls `requireUser()`, and the chat route calls `currentUser()` (`lib/auth.ts`). They pass only for a Supabase Auth session whose email is `ALLOWED_EMAIL`. `proxy.ts` refreshes the session cookie and redirects signed-out visitors to `/login`, but it's only the early check; the real one is in each page, action and route. A new page or Server Action that skips `requireUser()` exposes data.
