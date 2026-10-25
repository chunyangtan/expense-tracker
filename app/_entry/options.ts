import "server-only";
import { supabase } from "@/lib/supabase";
import type { Options } from "@/app/_entry/form";

// Distinct values, most used first.
function byUse(values: (string | null)[]) {
  const counts = new Map<string, number>();
  for (const v of values) if (v) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1]).map(([v]) => v);
}

// Pickable categories, sub-categories and payment methods, from the values already in the data.
export async function entryOptions(): Promise<Options> {
  const { data, error } = await supabase.from("expenses").select("category, sub_category, payment_method");
  if (error) throw error;
  const options: Options = {
    categories: byUse(data.map((r) => r.category)),
    paymentMethods: byUse(["Cash", ...data.map((r) => r.payment_method)]),
    subCategories: {},
  };
  for (const c of options.categories) {
    options.subCategories[c] = byUse(data.filter((r) => r.category === c).map((r) => r.sub_category));
  }
  return options;
}
