"use server";

import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase";
import { requireUser } from "@/lib/auth";

export type AddState = { ok: boolean; message: string };

const text = (v: FormDataEntryValue | null) => (typeof v === "string" && v.trim() ? v.trim() : null);

export async function addExpense(_prev: AddState, formData: FormData): Promise<AddState> {
  await requireUser();
  const date = text(formData.get("date"));
  const item = text(formData.get("item_name"));
  const currency = text(formData.get("currency"));
  const amount = Number(text(formData.get("amount"))?.replace(/[,¥]/g, ""));

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return { ok: false, message: "Pick a date." };
  if (!item) return { ok: false, message: "Enter what you bought." };
  if (currency !== "JPY" && currency !== "MYR") return { ok: false, message: "Currency must be JPY or MYR." };
  if (!Number.isFinite(amount) || amount <= 0) return { ok: false, message: "Enter an amount above zero." };

  const { error } = await supabase.from("expenses").insert({
    date,
    item_name: item,
    category: text(formData.get("category")),
    sub_category: text(formData.get("sub_category")),
    payment_method: text(formData.get("payment_method")),
    amount,
    currency,
    notes: text(formData.get("notes")),
    source: "manual",
  });
  if (error) return { ok: false, message: `Couldn't save: ${error.message}` };

  revalidatePath("/add");
  revalidatePath("/expenses");
  revalidatePath("/dashboard");
  const shown = new Intl.NumberFormat("en", { style: "currency", currency }).format(amount);
  return { ok: true, message: `Saved ${item}, ${shown}.` };
}
