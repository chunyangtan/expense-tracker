# UI design

How the app looks and behaves for everyday use on a phone: the screens, what each is for, and the patterns they share. Read it before building or changing a screen, and update it in the same change when a screen or pattern changes. The reasons are in `DECISIONS.md` (2026-10-25: everyday UI). The clickable mockup is on the canvas at https://claude.ai/artifact/LVM5oHq7NCF59MRQxneY5J.

The goal is the one from `ROADMAP.md`: I use this instead of AppSheet every day. So the screens are tuned for three jobs, in this order: log a cash purchase in under 5 seconds, fix a wrong entry in a few taps, and see where this month's money went at a glance.

## Screen map

A bottom tab bar at every width, on every screen except the entry form and To check. Those put their Save button where the bar would be, and close with ✕ or back.

| Tab | Route | For |
|---|---|---|
| Home | `/` | this month at a glance |
| Transactions | `/transactions` | every entry, by month, as a list or a calendar |
| ＋ (centre, raised) | `/add` | log any entry by hand |
| Ask | `/ask` | the Claude chat (moves from `/`) |
| More | `/more` | import, settings, sign out |

Home, Transactions and Add show a **book switch** (`Japan · ¥ | Malaysia · RM`) at the top. Everything below it belongs to that book (see Books, below).

Edit is not a tab: tapping any entry opens `/transactions/[id]`, the same entry form as `/add`. To check (`/to-check`) is reached from Home's banner and Transactions' filter. `/expenses` redirects to `/transactions`. Import stays at `/import`, reached from More. `/dashboard` folds into Home.

## Screens

### Home

- Month header with ‹ › to switch months. Defaults to the current Tokyo month.
- When imported entries are waiting, a banner on top: "61 entries to check · From the Rakuten Card October statement", opening To check.
- This month's total for the current book, large. The other book never appears here; switch books to see it.
- Against last month (`vs Sep ¥131,900 · +8%`) and the daily average so far.
- Category breakdown: one stacked bar plus a row per category with amount and share. Tapping a category opens Transactions filtered to it.
- Last 6 months as small bars.
- The 4 latest entries and "See all".

Budgets slot in under the total later, as a progress bar per category. Not now.

### Transactions

- The same month header, and a List | Calendar switch.
- Month total and count, for the current book.
- Search box (item name, notes, raw description) and filter chips: To check, category, paid with.
- List: grouped by day, newest first, each day header showing the day's total. A row shows item, sub-category · payment method, amount. A transfer between books is one row showing both sides, e.g. `To Malaysia · Wise · received RM 920.00 · ¥32.6/RM`. Unconfirmed imported rows carry a "To check" label.
- Calendar: Sunday-first month grid, each day showing its total in short form (`3.4k`). Tapping a day lists its entries under the grid.

### Entry form (Add and Edit)

Add and Edit are one form. Add opens it empty with defaults, Edit opens it filled in. Every field, control and picker is the same, so there's one thing to learn and one thing to build. Hand entry covers every payment method, not just cash.

From top to bottom:

1. **Book switch,** set to the book last used. The book sets the currency.
2. **Amount,** focused on open in Add, large, with the native decimal keyboard. Under it, the **type** chips: Expense (default) | Refund | Transfer, with a one-line explanation for the last two. Transfer covers transfers between books. Refund keeps the amount negative (data-model rule 3). Income joins at M8.
3. **Item,** with suggestions from past items and, in Add, chips for this book's most-used items. Picking a past item fills its last category and payment method, with a line saying so ("Filled from the last time: Cafe · Rakuten Pay"). Most entries are repeats, so this does most of the work.
4. **Category:** up to 6 chips for this book's most-used sub-categories over the last 90 days, each with its top category's colour. The current choice is always among them, and its path shows below (`Variable (変動費) › Cafe`). "All categories" opens a sheet with a search box and every sub-category grouped under its top category, most used first, with use counts. Search matches English and Japanese keywords (`cafe`, `医療`). With no exact match it offers "+ New sub-category" with the search text.
5. **Paid with:** chips for this book's most-used payment methods (Japan: Cash, Rakuten Card, Rakuten Pay, PayPay, Suica; Malaysia: Cash, Maybank Debit, Touch 'n Go, Wise Card), plus "Other…". The default is the last method used in this book. When the method has a statement import (Rakuten Card today), a line says the entry will be matched when the statement comes in, not added twice (data-model rule 6).
6. **Date:** Today | Yesterday | a picker chip that shows the picked date.
7. **Notes,** collapsed behind "Add note" when empty.
8. **Edit only:** for imported rows, a read-only box with the source, the statement's original text and whether it's been checked. Delete, behind a confirm sheet. The change history records every save and delete (rule 7).
9. **Bottom button:** Save in Add (the form resets and a toast shows "Saved · Undo"). Save changes in Edit. Confirm in Edit when the entry is still to check, which saves any fixes and marks it checked in one tap.

Managing the category and payment-method lists (rename, merge, hide unused) goes in More, later.

### To check

Statement imports go in whole, in bulk, and every imported row starts as **to check**. Nothing counts as verified until I've looked at it. That's what makes the totals trustworthy.

- **Header:** how many entries are left and what the import did ("Rakuten Card · October statement · 61 rows added, 3 matched entries you'd typed in, 2 already here and skipped").
- **List:** date, statement name, amount, and the suggested category with its colour. A line explains anything non-obvious: "Matched your entry スーパー", "Rule: Rakuten Cash top-up", "Suggested. Check it."
- **Each row has a ✓ button** (48px) that confirms it as is. Tapping the row opens the entry form with a "not checked yet" banner and a Confirm button.
- **Confirm all N** at the bottom for when the list has been scanned.
- **When the list is empty:** "All checked", with a link back to Home.

Entries typed in by hand are confirmed when saved, since I entered them myself. An import that merges into a typed-in entry sets it back to "to check", because the statement changed it.

### Ask

The existing chat, with a few starter questions as chips ("How much on food this month?", "Compare with September").

### More

Import statements, sign out. Settings join here as they're built (categories, recurring costs, month start day).

## Shared patterns

- **Phone first.** One centred column, max width about 480px, also on desktop. Touch targets at least 44px.
- **Amounts:** `¥2,480` with no decimals; `RM 86.50` with two. Right-aligned, tabular figures. Refunds show `−¥1,200` with a "Refund" label, not colour alone. Transfers are greyed with a "Transfer · not counted" label.
- **Totals are per book** and leave out transfers, as everywhere (data-model rules 1 and 2). Nothing is converted between yen and ringgit.
- **Dates:** Tokyo's date. Day headers like `Sat 24 Oct`.
- **Categories:** each top category has one colour used in every chart and tag. Living blue, Variable orange, Special purple.
- **Empty states** say what to do next ("No expenses in November yet. Tap ＋ to add one.").
- **Language:** English UI; item names and categories as they're stored (Japanese where they are).

## Books: Japan and Malaysia

My money lives in two countries, so the app keeps two **books** (帳簿), Japan in JPY and Malaysia in MYR, and treats them like two separate households that can send each other money. Nothing is ever converted into the other currency to make one total.

- **Every entry belongs to one book, and the book sets the currency.** You never pick a currency.
- **An entry goes in the book whose money paid for it, not the country I was in.** A Rakuten Card purchase in KL is billed in yen, so it's in the Japan book, with the ringgit amount kept in the statement text. Cash ringgit spent in KL is in the Malaysia book.
- **Money sent between books is one transfer with two sides**: out of one book in its currency, into the other in its currency, e.g. ¥30,000 out of Japan and RM 920.00 into Malaysia through Wise. Both sides are transfers, so neither counts as spending. The rate shown is the two amounts divided, which is what the transfer really cost.
- **The app remembers the last book used**, so a week in KL stays on Malaysia without switching every time.
- **No combined view for now.** At M8, net worth is shown per book. If a both-books view is added, it shows the two side by side, never added up.

Until accounts exist (M8), the book is simply the entry's `currency`. How books, accounts and the two sides of a transfer are stored is decided with M8 (`docs/data-model.md`).

## Growth path: from expense tracker to finance tracker

The app grows into a personal finance tracker covering income, accounts and investments (`ROADMAP.md`, M8). The screens for that are designed when M8 starts, once it's clear which banks and brokers give data and in what form. What's fixed now is the structure, so today's screens grow instead of being redesigned.

- **Home becomes the finance overview, per book.** Net worth on top, then this month's 収支 (income minus spending), then the spending cards designed above. The mockup shows the net-worth card as a dashed "Later" outline so the slot stays reserved. Until accounts exist, the page shows no net-worth card at all.
- **Home is a stack of independent cards.** Each card (month total, categories, trend, latest) is its own component with its own query, so new cards (net worth, cash flow, budgets) slot in without rewriting the page.
- **Transactions, not History or Expenses.** The tab and route are named for what they'll hold: spending, income and transfers in one list, filtered by type. `/expenses` only redirects.
- **The tab bar reshuffles once.** Today: Home, Transactions, ＋, Ask, More. With M8: Home, Transactions, ＋, Assets, More. Ask leaves the bar then, as a button on Home and an item in More. Everything else keeps its place.
- **Add and Edit grow a type switch.** Edit's Counts as switch (Expense / Refund / Transfer) gains Income, and Add gets the same switch with Expense as the default. No new screen.
- **Not decided yet:** the data model for income, accounts and investments (including whether income shares the `expenses` table as a new `kind`), the Assets screens, and net-worth and allocation charts.

## Later, not designed yet

Budgets, recurring 固定費, category rules learned from corrections, month start day, receipt photos, dark mode polish. Each gets designed when it's built.
