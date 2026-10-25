import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { requireUser } from "@/lib/auth";
import { EntryForm } from "@/app/_entry/form";
import { entryOptions } from "@/app/_entry/options";
import { money } from "@/app/_entry/values";
import { deleteExpense, updateExpense } from "@/app/transactions/[id]/actions";
import { DeleteButton } from "@/app/transactions/[id]/delete-button";

const sources: Record<string, string> = {
  manual: "Added by hand",
  appsheet: "Imported from AppSheet",
  "statement:rakuten-card": "From a Rakuten Card statement",
};

// Outside the (tabs) group, like /add, so the form gets the whole screen.
export default async function EditEntry({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const [row, options] = await Promise.all([
    supabase.from("expenses").select("*").eq("id", id).maybeSingle(),
    entryOptions(),
  ]);
  if (row.error) throw row.error;
  const e = row.data;
  if (!e) notFound();

  return (
    <main className="max-w-3xl w-full mx-auto px-4 pb-12">
      <header className="py-3 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
        <Link href="/transactions" className="-ml-2 min-h-11 pr-2 flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Transactions
        </Link>
        <h1 className="ml-auto text-xl font-semibold">Edit entry</h1>
      </header>

      <EntryForm
        options={options}
        initial={{ ...e, amount: Math.abs(e.amount) }}
        action={updateExpense.bind(null, e.id)}
        submitLabel="Save changes"
        resetOnSave={false}
      />

      <section className="mt-8 rounded-lg bg-gray-100 dark:bg-gray-800 px-4 py-3 text-sm">
        <p className="text-xs font-medium text-gray-500">{sources[e.source] ?? e.source}</p>
        {e.raw_description && <p className="mt-1 font-mono break-words">{e.raw_description}</p>}
        <p className="mt-1 text-xs text-gray-500">
          Added {new Date(e.created_at).toLocaleDateString("en-CA", { timeZone: "Asia/Tokyo" })}
          {e.modified_at && e.modified_at !== e.created_at && `, last changed ${new Date(e.modified_at).toLocaleDateString("en-CA", { timeZone: "Asia/Tokyo" })}`}
          . Source and statement text can&apos;t be edited.
        </p>
      </section>

      <DeleteButton action={deleteExpense.bind(null, e.id)} summary={`${e.item_name ?? "this entry"}, ${money(e.amount, e.currency)}`} />
    </main>
  );
}
