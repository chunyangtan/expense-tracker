import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { requireUser } from "@/lib/auth";
import { selectAll } from "@/lib/select-all";
import { categoryColor } from "@/lib/categories";
import { dayLabel } from "@/lib/dates";
import { money } from "@/app/_entry/values";
import { confirmEntry, confirmShown } from "@/app/to-check/actions";

const sources: Record<string, string> = {
  "statement:rakuten-card": "Rakuten Card statement",
  manual: "Added by hand",
  appsheet: "AppSheet",
};

// Imported rows waiting to be looked at (docs/ui.md, To check). No tab bar, like the entry form.
export default async function ToCheck() {
  await requireUser();
  const rows = await selectAll((from, to) =>
    supabase
      .from("expenses")
      .select("id, date, item_name, category, sub_category, amount, currency, kind, notes, source")
      .is("confirmed_at", null)
      .order("date", { ascending: false })
      .order("id")
      .range(from, to),
  );
  const bySource = new Map<string, number>();
  for (const r of rows) bySource.set(r.source, (bySource.get(r.source) ?? 0) + 1);

  return (
    <main className="max-w-3xl w-full mx-auto px-4 pb-40">
      <header className="py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Link href="/" className="-ml-2 min-h-11 pr-2 flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg>
            Home
          </Link>
          <h1 className="ml-auto text-xl font-semibold">To check</h1>
        </div>
        <p className="mt-1 text-sm">{rows.length ? `${rows.length} entries to check` : "Nothing left to check"}</p>
        {rows.length > 0 && (
          <p className="text-xs text-gray-500">{[...bySource].map(([s, n]) => `${sources[s] ?? s}: ${n}`).join(" · ")}</p>
        )}
      </header>

      {rows.length === 0 ? (
        <div className="mt-20 text-center">
          <p className="text-base font-semibold">All checked</p>
          <p className="mt-1 text-sm text-gray-500">Every imported entry has been looked at.</p>
          <Link href="/" className="mt-3 inline-flex min-h-11 items-center text-sm font-medium text-blue-600 dark:text-blue-400">Back to Home</Link>
        </div>
      ) : (
        <ul className="mt-2 divide-y divide-gray-100 dark:divide-gray-800">
          {rows.map((r) => (
            <li key={r.id} className="flex items-center gap-2">
              <Link href={`/transactions/${r.id}?from=/to-check`} className="flex-1 min-w-0 py-3 hover:bg-gray-50 dark:hover:bg-gray-900">
                <span className="flex justify-between gap-3">
                  <span className="text-sm truncate">{r.item_name ?? "(no name)"}</span>
                  <span className="text-sm font-medium tabular-nums whitespace-nowrap">{money(r.amount, r.currency)}</span>
                </span>
                <span className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-500">
                  <span>{dayLabel(r.date)}</span>
                  <span className="size-2 shrink-0 rounded-full" style={{ background: categoryColor(r.category) }} />
                  <span className="truncate">
                    {r.sub_category ?? r.category ?? "No category yet"}
                    {r.kind !== "expense" && ` · ${r.kind === "refund" ? "Refund" : "Transfer, not counted"}`}
                  </span>
                </span>
                {r.notes && <span className="mt-0.5 block text-xs text-amber-800 dark:text-amber-300 truncate">{r.notes}</span>}
              </Link>
              <form action={confirmEntry.bind(null, r.id)}>
                <button aria-label={`Confirm ${r.item_name ?? "entry"} ${money(r.amount, r.currency)}`} className="size-12 rounded-full border border-gray-300 dark:border-gray-600 text-blue-600 dark:text-blue-400 flex items-center justify-center hover:bg-blue-50 dark:hover:bg-blue-950">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      {rows.length > 0 && (
        <form action={confirmShown} className="fixed inset-x-0 bottom-0 border-t border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-950/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
          <div className="max-w-3xl mx-auto px-4 py-3">
            {rows.map((r) => <input key={r.id} type="hidden" name="id" value={r.id} />)}
            <button className="w-full min-h-12 rounded-xl bg-blue-600 text-base font-semibold text-white hover:bg-blue-700">Confirm all {rows.length}</button>
            <p className="mt-1 text-center text-xs text-gray-500">Tap a row to fix it, ✓ when it&apos;s right.</p>
          </div>
        </form>
      )}
    </main>
  );
}
