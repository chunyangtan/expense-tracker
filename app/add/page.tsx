import { supabase } from "@/lib/supabase";
import { requireUser } from "@/lib/auth";
import Link from "next/link";
import { EntryForm } from "@/app/_entry/form";
import { entryOptions } from "@/app/_entry/options";
import { money } from "@/app/_entry/values";
import { addExpense, undoAdd } from "@/app/add/actions";
import { currentBook } from "@/lib/book";
import { today as tokyoToday } from "@/lib/dates";

export default async function Add() {
  await requireUser();
  const [options, book, recent] = await Promise.all([
    entryOptions(),
    currentBook(),
    supabase
      .from("expenses")
      .select("id, date, item_name, category, sub_category, payment_method, amount, currency")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);
  if (recent.error) throw recent.error;

  const today = tokyoToday();

  return (
    <main className="max-w-3xl w-full mx-auto px-4 pb-12">
      <header className="py-4 border-b border-gray-200 dark:border-gray-700 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Add entry</h1>
          <p className="text-sm text-gray-500">Any payment method, either book.</p>
        </div>
        <Link href="/" aria-label="Close" className="-mr-2 size-11 flex items-center justify-center rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </Link>
      </header>

      <EntryForm
        mode="add"
        options={options}
        today={today}
        initial={{
          date: today,
          item_name: null,
          category: null,
          sub_category: null,
          payment_method: options.books[book].lastPayment,
          amount: null,
          currency: book,
          kind: "expense",
          notes: null,
          confirmed: true,
        }}
        action={addExpense}
        undo={undoAdd}
      />

      <section className="mt-10">
        <h2 className="text-xs font-medium text-gray-500 mb-1">Recently added</h2>
        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {recent.data.map((e) => (
            <li key={e.id}>
              <Link href={`/transactions/${e.id}`} className="py-2.5 flex justify-between gap-4 hover:bg-gray-50 dark:hover:bg-gray-900">
                <div className="min-w-0">
                  <p className="text-sm truncate">{e.item_name ?? "(no name)"}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {[e.date, e.sub_category ?? e.category, e.payment_method].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <p className="text-sm font-medium tabular-nums whitespace-nowrap">{money(e.amount, e.currency)}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
