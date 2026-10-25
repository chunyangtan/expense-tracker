import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { requireUser } from "@/lib/auth";
import { selectAll } from "@/lib/select-all";
import { currentBook } from "@/lib/book";
import { categoryColor } from "@/lib/categories";
import { addMonths, daysInMonth, isMonth, monthLabel, monthRange, today } from "@/lib/dates";
import { money } from "@/app/_entry/values";
import { BookSwitch } from "@/app/_shared/book-switch";
import { MonthSwitch } from "@/app/_shared/month-switch";
import { EntryRow } from "@/app/_shared/entry-row";

const card = "rounded-2xl border border-gray-200 dark:border-gray-800 p-4";

// This month at a glance, for one book (docs/ui.md, Home). Each card reads from the same six
// months of rows, so new cards (budgets, net worth) can slot in without another query.
export default async function Home({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  await requireUser();
  const p = await searchParams;
  const book = await currentBook();
  const now = today();
  const month = isMonth(p.month) ? p.month : now.slice(0, 7);
  const months = Array.from({ length: 6 }, (_, i) => addMonths(month, i - 5));

  const [rows, unchecked] = await Promise.all([
    selectAll((from, to) =>
      supabase
        .from("expenses")
        .select("id, date, item_name, category, sub_category, payment_method, amount, currency, kind, confirmed_at")
        .eq("currency", book)
        .gte("date", monthRange(months[0]).start)
        .lt("date", monthRange(month).end)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false })
        .order("id")
        .range(from, to),
    ),
    supabase.from("expenses").select("id", { count: "exact", head: true }).is("confirmed_at", null),
  ]);
  if (unchecked.error) throw unchecked.error;

  // Spending leaves out transfers (data-model rule 1); refunds are negative and subtract.
  const spending = rows.filter((r) => r.kind !== "transfer");
  const total = (m: string) => spending.filter((r) => r.date.startsWith(m)).reduce((s, r) => s + r.amount, 0);
  const thisMonth = spending.filter((r) => r.date.startsWith(month));
  const spent = total(month);
  const prev = addMonths(month, -1);
  const prevSpent = total(prev);
  const change = prevSpent > 0 ? Math.round(((spent - prevSpent) / prevSpent) * 100) : null;
  const daysSoFar = now.startsWith(month) ? Number(now.slice(8)) : month > now ? 0 : daysInMonth(month);

  const byCategory = new Map<string, number>();
  for (const r of thisMonth) byCategory.set(r.category ?? "No category", (byCategory.get(r.category ?? "No category") ?? 0) + r.amount);
  const categories = [...byCategory].filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  const positive = categories.reduce((s, [, v]) => s + v, 0);

  const trend = months.map((m) => ({ month: m, total: total(m) }));
  const max = Math.max(...trend.map((t) => t.total), 1);
  const latest = rows.filter((r) => r.date.startsWith(month)).slice(0, 4);

  return (
    <main className="max-w-3xl w-full mx-auto px-4 pb-12 flex flex-col gap-4">
      <div className="pt-3 flex flex-col gap-2">
        <BookSwitch current={book} />
        <MonthSwitch month={month} href={(m) => (m === now.slice(0, 7) ? "/" : `/?month=${m}`)} />
      </div>

      {(unchecked.count ?? 0) > 0 && (
        <Link href="/to-check" className="flex items-center gap-3 min-h-14 rounded-2xl bg-amber-50 dark:bg-amber-950 px-4 py-2 text-amber-900 dark:text-amber-200">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0"><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" /></svg>
          <span className="flex-1">
            <span className="block text-sm font-semibold">{unchecked.count} imported {unchecked.count === 1 ? "entry" : "entries"} to check</span>
            <span className="block text-xs">Confirm them so the totals can be trusted</span>
          </span>
          <span aria-hidden="true">›</span>
        </Link>
      )}

      <section className={card}>
        <p className="text-sm text-gray-500">Spent in {monthLabel(month, "short")}</p>
        <p className="mt-1 text-4xl font-semibold tabular-nums tracking-tight">{money(spent, book)}</p>
        <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 tabular-nums">
          <span>
            vs {monthLabel(prev, "short")} {money(prevSpent, book)}
            {change !== null && ` · ${change >= 0 ? "+" : "−"}${Math.abs(change)}%`}
          </span>
          {daysSoFar > 0 && <span>{money(spent / daysSoFar, book)}/day</span>}
        </p>
      </section>

      <section className={card} aria-labelledby="by-category">
        <h2 id="by-category" className="text-sm font-semibold">By category</h2>
        {categories.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500">No spending in {monthLabel(month)} yet. Tap ＋ to add some.</p>
        ) : (
          <>
            <div className="mt-3 flex h-3 gap-0.5" aria-hidden="true">
              {categories.map(([c, v]) => (
                <div key={c} title={`${c}: ${money(v, book)}`} className="first:rounded-l last:rounded-r" style={{ width: `${(v / positive) * 100}%`, background: categoryColor(c) }} />
              ))}
            </div>
            <ul className="mt-2 divide-y divide-gray-100 dark:divide-gray-800">
              {categories.map(([c, v]) => (
                <li key={c}>
                  <Link href={`/transactions?month=${month}&cat=${encodeURIComponent(c)}`} className="min-h-11 flex items-center gap-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-900">
                    <span className="size-2.5 shrink-0 rounded-full" style={{ background: categoryColor(c) }} />
                    <span className="flex-1 truncate">{c}</span>
                    <span className="text-xs text-gray-500 tabular-nums">{Math.round((v / positive) * 100)}%</span>
                    <span className="w-24 text-right font-medium tabular-nums">{money(v, book)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section className={card} aria-labelledby="trend">
        <h2 id="trend" className="text-sm font-semibold">Last 6 months</h2>
        <div className="mt-3 flex items-end gap-2 h-28 border-b border-gray-200 dark:border-gray-800">
          {trend.map((t) => (
            <Link
              key={t.month}
              href={t.month === now.slice(0, 7) ? "/" : `/?month=${t.month}`}
              aria-label={`${monthLabel(t.month)}: ${money(t.total, book)}`}
              className="group relative flex-1 h-full flex flex-col justify-end items-center"
            >
              {t.month === month && <span className="mb-1 text-[11px] text-gray-600 dark:text-gray-300 tabular-nums">{money(t.total, book)}</span>}
              <span
                className={`w-full max-w-12 rounded-t ${t.month === month ? "bg-blue-600 dark:bg-blue-500" : "bg-blue-200 dark:bg-blue-900 group-hover:bg-blue-300 dark:group-hover:bg-blue-800"}`}
                style={{ height: `${(Math.max(t.total, 0) / max) * 80}%` }}
              />
              <span className="pointer-events-none absolute bottom-full mb-1 hidden group-hover:block group-focus-visible:block whitespace-nowrap rounded bg-gray-900 dark:bg-gray-100 px-2 py-1 text-xs text-white dark:text-gray-900 tabular-nums">
                {monthLabel(t.month, "short")}: {money(t.total, book)}
              </span>
            </Link>
          ))}
        </div>
        <div className="mt-1 flex gap-2 text-xs text-gray-500">
          {trend.map((t) => <span key={t.month} className="flex-1 text-center">{monthLabel(t.month, "short")}</span>)}
        </div>
      </section>

      <section className={card} aria-labelledby="latest">
        <div className="flex items-center justify-between">
          <h2 id="latest" className="text-sm font-semibold">Latest</h2>
          <Link href={`/transactions?month=${month}`} className="min-h-11 flex items-center text-sm text-blue-600 dark:text-blue-400">See all</Link>
        </div>
        {latest.length === 0 ? (
          <p className="text-sm text-gray-500">Nothing logged in {monthLabel(month)} yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {latest.map((e) => <EntryRow key={e.id} e={e} from="/" />)}
          </ul>
        )}
      </section>
    </main>
  );
}
