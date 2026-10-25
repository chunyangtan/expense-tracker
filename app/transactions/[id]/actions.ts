"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { requireUser } from "@/lib/auth";
import { parseEntry, type EntryState } from "@/app/_entry/values";

function revalidateAll() {
  revalidatePath("/transactions");
  revalidatePath("/add");
  revalidatePath("/");
}

// Bound to the row's id in the page. Source, external_id and raw_description come from the
// statement and stay as they are; the change history trigger records the old row.
export async function updateExpense(id: string, _prev: EntryState, formData: FormData): Promise<EntryState> {
  await requireUser();
  const parsed = parseEntry(formData);
  if ("error" in parsed) return { ok: false, message: parsed.error };

  const { error, count } = await supabase.from("expenses").update(parsed.row, { count: "exact" }).eq("id", id);
  if (error) return { ok: false, message: `Couldn't save: ${error.message}` };
  if (count === 0) return { ok: false, message: "This entry no longer exists." };

  revalidateAll();
  redirect("/transactions");
}

export async function deleteExpense(id: string) {
  await requireUser();
  const { error } = await supabase.from("expenses").delete().eq("id", id);
  if (error) throw error;
  revalidateAll();
  redirect("/transactions");
}
