"use server";

import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase";
import { requireUser } from "@/lib/auth";
import { rememberBook } from "@/lib/book";
import { money, parseEntry, type EntryState } from "@/app/_entry/values";

function revalidateAll() {
  revalidatePath("/add");
  revalidatePath("/transactions");
  revalidatePath("/");
}

// Typed-in entries are confirmed on save (data-model rule 10): I entered them myself.
export async function addExpense(_prev: EntryState, formData: FormData): Promise<EntryState> {
  await requireUser();
  const parsed = parseEntry(formData);
  if ("error" in parsed) return { ok: false, message: parsed.error };

  const { data, error } = await supabase
    .from("expenses")
    .insert({ ...parsed.row, source: "manual", confirmed_at: new Date().toISOString() })
    .select("id")
    .single();
  if (error) return { ok: false, message: `Couldn't save: ${error.message}` };

  await rememberBook(parsed.row.currency);
  revalidateAll();
  return { ok: true, id: data.id, message: `Saved ${parsed.row.item_name}, ${money(parsed.row.amount, parsed.row.currency)}` };
}

// The toast's Undo: removes the entry just added. Only rows typed in by hand, so a stale id
// can never delete an imported row. The change history keeps a copy.
export async function undoAdd(id: string): Promise<EntryState> {
  await requireUser();
  const { error, count } = await supabase.from("expenses").delete({ count: "exact" }).eq("id", id).eq("source", "manual");
  if (error) return { ok: false, message: `Couldn't undo: ${error.message}` };
  revalidateAll();
  return { ok: true, message: count ? "Removed." : "Already gone." };
}
