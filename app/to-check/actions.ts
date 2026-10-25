"use server";

import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase";
import { requireUser } from "@/lib/auth";

function revalidateAll() {
  revalidatePath("/to-check");
  revalidatePath("/transactions");
  revalidatePath("/");
}

// Confirms rows as they are (data-model rule 10). Only rows still to check are touched, so a
// double tap doesn't move an earlier confirmation time.
async function confirm(ids: string[]) {
  const now = new Date().toISOString();
  // Batches keep the id list well inside the request URL limit.
  for (let i = 0; i < ids.length; i += 100) {
    const { error } = await supabase.from("expenses").update({ confirmed_at: now }).in("id", ids.slice(i, i + 100)).is("confirmed_at", null);
    if (error) throw error;
  }
  revalidateAll();
}

export async function confirmEntry(id: string) {
  await requireUser();
  await confirm([id]);
}

// Confirm all: only the ids that were on screen, so rows imported meanwhile still get looked at.
export async function confirmShown(formData: FormData) {
  await requireUser();
  const ids = formData.getAll("id").filter((v): v is string => typeof v === "string" && /^[0-9a-f-]{36}$/i.test(v));
  await confirm(ids);
}
