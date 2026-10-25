import { supabase } from "@/lib/supabase";
import { requireUser } from "@/lib/auth";

type Expense = { date: string; amount: number; currency: string; category: string | null };

const BAR = "bg-[#2a78d6] dark:bg-[#3987e5]";

function money(amount: number, currency: string) {
  return new Intl.NumberFormat("en", { style: "currency", currency }).format(amount);
}

function monthLabel(month: string) {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1).toLocaleString("en", { month: "short", year: "numeric" });
}

// Every month from the first to the last, so gaps show as empty bars.
function monthRange(first: string, last: string) {
  const months: string[] = [];
  let [y, m] = first.split("-").map(Number);
  const [ly, lm] = last.split("-").map(Number);
  while (y < ly || (y === ly && m <= lm)) {
    months.push(`${y}-${String(m).padStart(2, "0")}`);
    [y, m] = m === 12 ? [y + 1, 1] : [y, m + 1];
  }
  return months;
}

function sumBy(rows: Expense[], key: (r: Expense) => string) {
  const totals = new Map<string, number>();
  for (const r of rows) totals.set(key(r), (totals.get(key(r)) ?? 0) + r.amount);
  return totals;
}

export default async function Home() {
  await requireUser();
  const { data, error } = await supabase
    .from("expenses")
    .select("date, amount, currency, category")
    .neq("kind", "transfer")
    .order("date");
  if (error) throw error;

  const currencies = [...new Set(data.map((r) => r.currency))];

  return (
    <main className="max-w-3xl w-full mx-auto px-4 pb-12">
      <header className="py-4 border-b border-gray-200 dark:border-gray-700 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
        <div>
          <h1 className="text-xl font-semibold">Home</h1>
          <p className="text-sm text-gray-500">{data.length} expenses</p>
        </div>
      </header>

      {data.length === 0 && <p className="mt-16 text-center text-sm text-gray-400">No expenses yet.</p>}

      {currencies.map((currency) => (
        <CurrencySection
          key={currency}
          currency={currency}
          rows={data.filter((r) => r.currency === currency)}
          showHeading={currencies.length > 1}
        />
      ))}
    </main>
  );
}

function CurrencySection({ currency, rows, showHeading }: { currency: string; rows: Expense[]; showHeading: boolean }) {
  const byMonth = sumBy(rows, (r) => r.date.slice(0, 7));
  const months = monthRange(rows[0].date.slice(0, 7), rows[rows.length - 1].date.slice(0, 7)).slice(-12);
  const latest = months[months.length - 1];
  const previous = months.length > 1 ? months[months.length - 2] : undefined;
  const latestRows = rows.filter((r) => r.date.startsWith(latest));
  const maxMonth = Math.max(...months.map((m) => byMonth.get(m) ?? 0));

  const categories = [...sumBy(latestRows, (r) => r.category ?? "Uncategorized")].sort((a, b) => b[1] - a[1]);
  const maxCategory = categories[0]?.[1] ?? 0;

  return (
    <section className="mt-8 space-y-10">
      {showHeading && <h2 className="text-lg font-semibold">{currency}</h2>}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Tile label={monthLabel(latest)} value={money(byMonth.get(latest) ?? 0, currency)} />
        {previous && <Tile label={monthLabel(previous)} value={money(byMonth.get(previous) ?? 0, currency)} />}
        <Tile label={`Expenses in ${monthLabel(latest)}`} value={String(latestRows.length)} />
        <Tile label="All time" value={money(rows.reduce((s, r) => s + r.amount, 0), currency)} />
      </div>

      <figure>
        <figcaption className="text-sm font-medium mb-3">Spending per month</figcaption>
        <div className="flex items-end gap-0.5 h-40 border-b border-gray-200 dark:border-gray-700">
          {months.map((m) => {
            const total = byMonth.get(m) ?? 0;
            return (
              <div key={m} className="group relative flex-1 max-w-16 h-full flex items-end" tabIndex={0} aria-label={`${monthLabel(m)}: ${money(total, currency)}`}>
                <div className={`w-full rounded-t ${BAR}`} style={{ height: `${maxMonth ? (total / maxMonth) * 100 : 0}%` }} />
                <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block group-focus:block whitespace-nowrap rounded bg-gray-900 dark:bg-gray-100 px-2 py-1 text-xs text-white dark:text-gray-900">
                  {monthLabel(m)}: {money(total, currency)}
                </span>
              </div>
            );
          })}
        </div>
        <div className="flex gap-0.5 mt-1 text-xs text-gray-500">
          {months.map((m) => (
            <span key={m} className="flex-1 max-w-16 text-center truncate">{monthLabel(m).split(" ")[0]}</span>
          ))}
        </div>
      </figure>

      <figure>
        <figcaption className="text-sm font-medium mb-3">By category, {monthLabel(latest)}</figcaption>
        <ul className="space-y-2">
          {categories.map(([category, total]) => (
            <li key={category} className="grid grid-cols-[minmax(0,10rem)_1fr] items-center gap-3 text-sm">
              <span className="truncate text-gray-600 dark:text-gray-300" title={category}>{category}</span>
              <div className="flex items-center gap-2">
                <div className={`h-3 rounded-r ${BAR}`} style={{ width: `${(total / maxCategory) * 80}%` }} />
                <span className="text-xs tabular-nums text-gray-600 dark:text-gray-300">{money(total, currency)}</span>
              </div>
            </li>
          ))}
        </ul>
      </figure>
    </section>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}
