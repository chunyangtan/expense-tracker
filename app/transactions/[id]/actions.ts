"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { requireUser } from "@/lib/auth";
import { parseEntry, type EntryState } from "@/app/_entry/values";

// Where the edit page may send you back to after a save or delete.
const RETURN_TO = new Set(["/transactions", "/to-check", "/"]);
function safeReturn(to: string | undefined) {
  return to && RETURN_TO.has(to) ? to : "/transactions";
}

function revalidateAll() {
  revalidatePath("/transactions");
  revalidatePath("/to-check");
  revalidatePath("/add");
  revalidatePath("/");
}

// Bound to the row's id in the page. Source, external_id and raw_description come from the
// statement and stay as they are; the change history trigger records the old row.
export async function updateExpense(id: string, returnTo: string, _prev: EntryState, formData: FormData): Promise<EntryState> {
  await requireUser();
  const parsed = parseEntry(formData);
  if ("error" in parsed) return { ok: false, message: parsed.error };

  const current = await supabase.from("expenses").select("confirmed_at").eq("id", id).maybeSingle();
  if (current.error) return { ok: false, message: `Couldn't save: ${current.error.message}` };
  if (!current.data) return { ok: false, message: "This entry no longer exists." };
  // Keep the first confirmation time; clear it when Checked is turned off.
  const confirmed_at = parsed.confirmed ? (current.data.confirmed_at ?? new Date().toISOString()) : null;

  const { error } = await supabase.from("expenses").update({ ...parsed.row, confirmed_at }).eq("id", id);
  if (error) return { ok: false, message: `Couldn't save: ${error.message}` };

  revalidateAll();
  redirect(safeReturn(returnTo));
}

export async function deleteExpense(id: string, returnTo: string) {
  await requireUser();
  const { error } = await supabase.from("expenses").delete().eq("id", id);
  if (error) throw error;
  revalidateAll();
  redirect(safeReturn(returnTo));
}
