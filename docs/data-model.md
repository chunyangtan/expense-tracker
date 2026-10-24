# Data model

How the expense data behaves: the tables, what each value means, and the rules every feature has to follow. Read it before writing a query, an import or a form. The reasons behind each rule are in `DECISIONS.md`. Update this file in the same change whenever a rule or column changes.

## Rules

1. **Spending totals leave out transfers.** Any query that sums spending filters `kind <> 'transfer'`. Card payments and wallet top-ups move money; they aren't spending. Example: the overview and the chat both use `.neq("kind", "transfer")`.
2. **Never add amounts in different currencies together.** Totals are per currency.
3. **Amounts are positive for spending and negative for refunds**, with `kind = 'refund'`. There is no currency sign in `amount`.
4. **Count each payment once.** When a wallet is topped up from a card, only one side counts as spending. For now, Rakuten Cash top-ups on the card statement count as spending (Variable / Rakuten Pay (unsplit)). They become transfers once Rakuten Pay history is imported (M5).
5. **Imports never insert the same row twice.** Every imported row has an `external_id` that's stable across re-uploads, and `(source, external_id)` is unique. If the statement has no transaction ID, hash date + raw description + amount, plus a counter for identical rows in the same file (see `lib/statements/rakuten-card.ts`).
6. **An imported row that matches an earlier entry merges into it** instead of being inserted. A match has the same date and amount, and the earlier entry isn't cash. The statement's name and `source` win, the existing category stays, and the old name goes into `notes` as `Entered as: …`.
7. **Every change is recorded.** A trigger writes each insert, update and delete to `expenses_history`, and another sets `modified_at`. Code doesn't need to do either.
8. **"Today" is Tokyo's date**, even when the server runs in UTC. `date` is the purchase date, not the billing date.
9. **Schema changes go through migrations** in `supabase/migrations/`, applied with `npx supabase db push --linked`. Then regenerate `lib/database.types.ts` with `npx supabase gen types typescript --linked`.
10. **The API returns at most 1000 rows per request.** Anything that reads the whole table must page through it (`scripts/backup.mts` does) or aggregate in SQL.

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

## `expenses_history`

Append-only change log, written by a trigger on `expenses`. Readable by the server, never edited.

| Column | Meaning |
|---|---|
| expense_id | the `expenses.id` that changed |
| operation | `INSERT`, `UPDATE`, `DELETE`, or `BASELINE` (a snapshot of every row when history started, 2026-10-24) |
| old_row, new_row | the row before and after, as JSON |
| changed_at | when |

## Access

Until M4, only the server reads and writes, using the secret key (`lib/supabase.ts`, never imported by client components). Row-level security is on and has no policies, so the public and logged-in API roles can't read anything.
