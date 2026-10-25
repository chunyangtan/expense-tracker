"use server";

import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase";
import { requireUser } from "@/lib/auth";
import { money, parseEntry, type EntryState } from "@/app/_entry/values";

export async function addExpense(_prev: EntryState, formData: FormData): Promise<EntryState> {
  await requireUser();
  const parsed = parseEntry(formData);
  if ("error" in parsed) return { ok: false, message: parsed.error };

  const { error } = await supabase.from("expenses").insert({ ...parsed.row, source: "manual" });
  if (error) return { ok: false, message: `Couldn't save: ${error.message}` };

  revalidatePath("/add");
  revalidatePath("/transactions");
  revalidatePath("/");
  return { ok: true, message: `Saved ${parsed.row.item_name}, ${money(parsed.row.amount, parsed.row.currency)}.` };
}
