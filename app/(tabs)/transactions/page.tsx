import { supabase } from "@/lib/supabase";
import { requireUser } from "@/lib/auth";

function money(amount: number, currency: string) {
  return new Intl.NumberFormat("en", { style: "currency", currency }).format(amount);
}

function dayLabel(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function Transactions() {
  await requireUser();
  const { data, error } = await supabase
    .from("expenses")
    .select("id, date, item_name, category, sub_category, payment_method, amount, currency, notes")
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;

  // Newest day first, one group per day.
  const days = new Map<string, typeof data>();
  for (const e of data) days.set(e.date, [...(days.get(e.date) ?? []), e]);

  return (
    <main className="max-w-3xl w-full mx-auto px-4 pb-12">
      <header className="py-4 border-b border-gray-200 dark:border-gray-700 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
        <div>
          <h1 className="text-xl font-semibold">Transactions</h1>
          <p className="text-sm text-gray-500">{data.length} expenses, newest first</p>
        </div>
      </header>

      {data.length === 0 && <p className="mt-16 text-center text-sm text-gray-400">No expenses yet.</p>}

      {[...days].map(([date, expenses]) => (
        <section key={date} className="mt-6">
          <h2 className="text-xs font-medium text-gray-500 mb-1">{dayLabel(date)}</h2>
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {expenses.map((e) => (
              <li key={e.id} className="py-2.5 flex justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm truncate">{e.item_name ?? "(no name)"}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {[e.sub_category ?? e.category, e.payment_method].filter(Boolean).join(" · ")}
                  </p>
                  {e.notes && (
                    <p className="text-xs text-gray-400 truncate" title={e.notes}>
                      {e.notes}
                    </p>
                  )}
                </div>
                <p className="text-sm font-medium tabular-nums whitespace-nowrap">{money(e.amount, e.currency)}</p>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
