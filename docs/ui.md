# UI design

How the app looks and behaves for everyday use on a phone: the screens, what each is for, and the patterns they share. Read it before building or changing a screen, and update it in the same change when a screen or pattern changes. The reasons are in `DECISIONS.md` (2026-10-25: everyday UI). The clickable mockup is on the canvas at https://claude.ai/artifact/LVM5oHq7NCF59MRQxneY5J.

The goal is the one from `ROADMAP.md`: I use this instead of AppSheet every day. So the screens are tuned for three jobs, in this order: log a cash purchase in under 5 seconds, fix a wrong entry in a few taps, and see where this month's money went at a glance.

## Screen map

A bottom tab bar at every width, on every screen except Add and Edit. Those two put their Save button where the bar would be, and close with ✕ or back.

| Tab | Route | For |
|---|---|---|
| Home | `/` | this month at a glance |
| Transactions | `/transactions` | every entry, by month, as a list or a calendar |
| ＋ (centre, raised) | `/add` | log a purchase |
| Ask | `/ask` | the Claude chat (moves from `/`) |
| More | `/more` | import, settings, sign out |

Home, Transactions and Add show a **book switch** (`Japan · ¥ | Malaysia · RM`) at the top. Everything below it belongs to that book (see Books, below).

Edit is not a tab: tapping any entry opens `/transactions/[id]`. `/expenses` redirects to `/transactions`. Import stays at `/import`, reached from More. `/dashboard` folds into Home.

## Screens

### Home

- Month header with ‹ › to switch months. Defaults to the current Tokyo month.
- This month's total for the current book, large. The other book never appears here; switch books to see it.
- Against last month (`vs Sep ¥131,900 · +8%`) and the daily average so far.
- Category breakdown: one stacked bar plus a row per category with amount and share. Tapping a category opens Transactions filtered to it.
- Last 6 months as small bars.
- The 4 latest entries and "See all".

Budgets slot in under the total later, as a progress bar per category. Not now.

### Transactions

- The same month header, and a List | Calendar switch.
- Month total and count, for the current book.
- Search box (item name, notes, raw description) and filter chips: category, paid with.
- List: grouped by day, newest first, each day header showing the day's total. A row shows item, sub-category · payment method, amount. A transfer between books is one row showing both sides, e.g. `To Malaysia · Wise · received RM 920.00 · ¥32.6/RM`.
- Calendar: Sunday-first month grid, each day showing its total in short form (`3.4k`). Tapping a day lists its entries under the grid.

### Add

Amount first, then one tap for the category, then save. Everything else has a default.

1. The book switch, set to the book last used. Amount field below it, focused on open, large, with the native decimal keyboard. The book sets the currency.
2. Frequent items: chips for the most-used item names. Tapping one fills item and category.
3. Category grid: the 8 most-used sub-categories as buttons, each tagged with its category. "More…" opens the full list.
4. Item name, with suggestions from past items. Picking a past item also sets the category it last had.
5. Chips for date (Today, Yesterday, or a picker) and paid with (Cash default).
6. Notes, collapsed behind "Add note".
7. Save, fixed at the bottom within thumb reach. After saving, the form resets for the next entry and a toast shows "Saved · Undo" for a few seconds.

### Edit

The Add form, filled in, plus:

- **Counts as:** Expense | Refund | Transfer. Transfer explains that it's left out of totals (data-model rule 1), and covers transfers between books too. The amount box shows which book the entry is in. Refund keeps the amount negative (rule 3).
- For imported rows, a read-only box with the source and the statement's original text.
- Save, and Delete behind a confirm dialog. The change history records both (rule 7).

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
