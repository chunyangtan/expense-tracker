import "server-only";
import { supabase } from "@/lib/supabase";
import { selectAll } from "@/lib/select-all";
import { books, type Currency } from "@/lib/book";
import { addDays, today } from "@/lib/dates";
import type { BookOptions, Options } from "@/app/_entry/form";

// Distinct values, most used first.
function byUse(values: (string | null)[]) {
  const counts = new Map<string, number>();
  for (const v of values) if (v) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1]).map(([v]) => v);
}

// What the entry form offers, from the values already in the data: categories, sub-categories
// with use counts, and per book the frequent items, most-used sub-categories and payment methods,
// and each item's last category and payment method.
export async function entryOptions(): Promise<Options> {
  const rows = await selectAll((from, to) =>
    supabase
      .from("expenses")
      .select("id, date, item_name, category, sub_category, payment_method, currency, source")
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
      .order("id")
      .range(from, to),
  );

  const recent = addDays(today(), -90);
  const subUses = new Map<string, { name: string; category: string; uses: number }>();
  for (const r of rows) {
    if (!r.sub_category || !r.category) continue;
    const key = `${r.category}|${r.sub_category}`;
    const s = subUses.get(key) ?? { name: r.sub_category, category: r.category, uses: 0 };
    s.uses++;
    subUses.set(key, s);
  }

  const perBook = {} as Record<Currency, BookOptions>;
  for (const { currency } of books) {
    const mine = rows.filter((r) => r.currency === currency);
    const lately = mine.filter((r) => r.date >= recent);
    // Statement names (楽天キャッシュ チャージ…) make poor shortcuts, so frequent items come from typed-in rows.
    const typed = lately.filter((r) => !r.source.startsWith("statement:"));
    const topSubs = byUse(lately.map((r) => (r.category && r.sub_category ? `${r.category}|${r.sub_category}` : null)))
      .slice(0, 6)
      .map((k) => ({ category: k.split("|")[0], name: k.split("|").slice(1).join("|") }));
    // Rows are newest first, so the first sighting of a name is its last use.
    const items: BookOptions["items"] = {};
    for (const r of mine) {
      if (r.item_name && !(r.item_name in items) && Object.keys(items).length < 400) {
        items[r.item_name] = { category: r.category, sub_category: r.sub_category, payment_method: r.payment_method };
      }
    }
    perBook[currency] = {
      frequentItems: byUse(typed.map((r) => r.item_name)).slice(0, 6),
      topSubs,
      payments: byUse(["Cash", ...mine.map((r) => r.payment_method)]),
      lastPayment: mine.find((r) => r.source === "manual" && r.payment_method)?.payment_method ?? "Cash",
      items,
    };
  }

  return {
    categories: byUse(rows.map((r) => r.category)),
    subs: [...subUses.values()].sort((a, b) => b.uses - a.uses),
    books: perBook,
  };
}
