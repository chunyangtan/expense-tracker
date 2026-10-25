# UI design

How the app looks and behaves for everyday use on a phone: the screens, what each is for, and the patterns they share. Read it before building or changing a screen, and update it in the same change when a screen or pattern changes. The reasons are in `DECISIONS.md` (2026-10-25: everyday UI). The clickable mockup is on the canvas at https://claude.ai/artifact/LVM5oHq7NCF59MRQxneY5J.

The goal is the one from `ROADMAP.md`: I use this instead of AppSheet every day. So the screens are tuned for three jobs, in this order: log a cash purchase in under 5 seconds, fix a wrong entry in a few taps, and see where this month's money went at a glance.

## Screen map

A bottom tab bar at every width, on every screen except Add and Edit. Those two put their Save button where the bar would be, and close with ✕ or back.

| Tab | Route | For |
|---|---|---|
| Home | `/` | this month at a glance |
| History | `/expenses` | every entry, by month, as a list or a calendar |
| ＋ (centre, raised) | `/add` | log a purchase |
| Ask | `/ask` | the Claude chat (moves from `/`) |
| More | `/more` | import, settings, sign out |

Edit is not a tab: tapping any entry opens `/expenses/[id]`. Import stays at `/import`, reached from More. `/dashboard` folds into Home.

## Screens

### Home

- Month header with ‹ › to switch months. Defaults to the current Tokyo month.
- This month's total, large. A second line per extra currency (e.g. `RM 86.50`), never added to JPY.
- Against last month (`vs Sep ¥131,900 · +8%`) and the daily average so far.
- Category breakdown: one stacked bar plus a row per category with amount and share. Tapping a category opens History filtered to it.
- Last 6 months as small bars.
- The 4 latest entries and "See all".

Budgets slot in under the total later, as a progress bar per category. Not now.

### History

- The same month header, and a List | Calendar switch.
- Month total and count.
- Search box (item name, notes, raw description) and filter chips: category, paid with, currency.
- List: grouped by day, newest first, each day header showing the day's total. A row shows item, sub-category · payment method, amount.
- Calendar: Sunday-first month grid, each day showing its total in short form (`3.4k`). Tapping a day lists its entries under the grid.

### Add

Amount first, then one tap for the category, then save. Everything else has a default.

1. Amount field, focused on open, large, with the native decimal keyboard. A JPY | MYR toggle beside it (JPY default).
2. Frequent items: chips for the most-used item names. Tapping one fills item and category.
3. Category grid: the 8 most-used sub-categories as buttons, each tagged with its category. "More…" opens the full list.
4. Item name, with suggestions from past items. Picking a past item also sets the category it last had.
5. Chips for date (Today, Yesterday, or a picker) and paid with (Cash default).
6. Notes, collapsed behind "Add note".
7. Save, fixed at the bottom within thumb reach. After saving, the form resets for the next entry and a toast shows "Saved · Undo" for a few seconds.

### Edit

The Add form, filled in, plus:

- **Counts as:** Expense | Refund | Transfer. Transfer explains that it's left out of totals (data-model rule 1). Refund keeps the amount negative (rule 3).
- For imported rows, a read-only box with the source and the statement's original text.
- Save, and Delete behind a confirm dialog. History records both (rule 7).

### Ask

The existing chat, with a few starter questions as chips ("How much on food this month?", "Compare with September").

### More

Import statements, sign out. Settings join here as they're built (categories, recurring costs, month start day).

## Shared patterns

- **Phone first.** One centred column, max width about 480px, also on desktop. Touch targets at least 44px.
- **Amounts:** `¥2,480` with no decimals; `RM 86.50` with two. Right-aligned, tabular figures. Refunds show `−¥1,200` with a "Refund" label, not colour alone. Transfers are greyed with a "Transfer · not counted" label.
- **Totals are per currency** and leave out transfers, as everywhere (data-model rules 1 and 2).
- **Dates:** Tokyo's date. Day headers like `Sat 24 Oct`.
- **Categories:** each top category has one colour used in every chart and tag. Living blue, Variable orange, Special purple.
- **Empty states** say what to do next ("No expenses in November yet. Tap ＋ to add one.").
- **Language:** English UI; item names and categories as they're stored (Japanese where they are).

## Later, not designed yet

Budgets, recurring 固定費, category rules learned from corrections, month start day, receipt photos, dark mode polish. Each gets designed when it's built.
