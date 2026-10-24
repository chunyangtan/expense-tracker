import { supabase } from "@/lib/supabase";
import { requireUser } from "@/lib/auth";
import { Nav } from "@/app/nav";
import { AddForm, type Options } from "@/app/add/form";

function money(amount: number, currency: string) {
  return new Intl.NumberFormat("en", { style: "currency", currency }).format(amount);
}

// Distinct values, most used first.
function byUse(values: (string | null)[]) {
  const counts = new Map<string, number>();
  for (const v of values) if (v) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1]).map(([v]) => v);
}

export default async function Add() {
  await requireUser();
  const [values, recent] = await Promise.all([
    supabase.from("expenses").select("category, sub_category, payment_method"),
    supabase
      .from("expenses")
      .select("id, date, item_name, category, sub_category, payment_method, amount, currency")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);
  if (values.error) throw values.error;
  if (recent.error) throw recent.error;

  const options: Options = {
    categories: byUse(values.data.map((r) => r.category)),
    paymentMethods: byUse(["Cash", ...values.data.map((r) => r.payment_method)]),
    subCategories: {},
  };
  for (const c of options.categories) {
    options.subCategories[c] = byUse(values.data.filter((r) => r.category === c).map((r) => r.sub_category));
  }

  // Japan is home, so "today" is Tokyo's date even when the server runs in UTC.
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Tokyo" });

  return (
    <main className="max-w-3xl w-full mx-auto px-4 pb-12">
      <header className="py-4 border-b border-gray-200 dark:border-gray-700 flex items-baseline justify-between">
        <div>
          <h1 className="text-xl font-semibold">Add expense</h1>
          <p className="text-sm text-gray-500">Cash purchases. Cards come in through statement import.</p>
        </div>
        <Nav current="/add" />
      </header>

      <AddForm options={options} today={today} />

      <section className="mt-10">
        <h2 className="text-xs font-medium text-gray-500 mb-1">Recently added</h2>
        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {recent.data.map((e) => (
            <li key={e.id} className="py-2.5 flex justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm truncate">{e.item_name ?? "(no name)"}</p>
                <p className="text-xs text-gray-500 truncate">
                  {[e.date, e.sub_category ?? e.category, e.payment_method].filter(Boolean).join(" · ")}
                </p>
              </div>
              <p className="text-sm font-medium tabular-nums whitespace-nowrap">{money(e.amount, e.currency)}</p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
