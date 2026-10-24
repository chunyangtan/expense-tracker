"use server";

import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase";
import { parseRakutenCard, SOURCE, type StatementRow } from "@/lib/statements/rakuten-card";
import { suggestCategories } from "@/lib/statements/categorise";

export type PreviewRow = StatementRow & {
  // An earlier row (e.g. from AppSheet) with the same date and amount, to merge into instead of inserting.
  match: { id: string; item_name: string | null } | null;
};

export type Preview = {
  rows: PreviewRow[];
  alreadyImported: number;
  files: number;
  error?: string;
};

const PAYMENT_METHOD = "Rakuten Credit Card";

// No auth until M4: the app only runs locally, same as the chat endpoint.
export async function previewStatements(formData: FormData): Promise<Preview> {
  const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (!files.length) return { rows: [], alreadyImported: 0, files: 0, error: "Choose at least one CSV." };

  let parsed: StatementRow[] = [];
  try {
    for (const f of files) parsed = parsed.concat(parseRakutenCard(await f.text()));
  } catch (e) {
    return { rows: [], alreadyImported: 0, files: files.length, error: `Couldn't read the file: ${(e as Error).message}` };
  }

  const [imported, existing] = await Promise.all([
    supabase.from("expenses").select("external_id").eq("source", SOURCE),
    supabase
      .from("expenses")
      .select("id, date, amount, item_name, category, sub_category, payment_method")
      .neq("source", SOURCE),
  ]);
  if (imported.error) throw imported.error;
  if (existing.error) throw existing.error;

  const importedIds = new Set(imported.data.map((r) => r.external_id));
  const fresh = parsed.filter((r) => !importedIds.has(r.external_id));

  // Same date and amount, not cash: probably the same purchase entered by hand.
  // The statement's name wins, the existing category stays (DECISIONS.md, 2026-10-24).
  const candidates = existing.data.filter((e) => e.payment_method !== "Cash");
  const used = new Set<string>();
  const rows: PreviewRow[] = fresh.map((r) => {
    const m = candidates.find((e) => !used.has(e.id) && e.date === r.date && Number(e.amount) === r.amount);
    if (!m) return { ...r, match: null };
    used.add(m.id);
    return { ...r, category: m.category, sub_category: m.sub_category, match: { id: m.id, item_name: m.item_name } };
  });

  await suggestCategories(rows.filter((r) => !r.category), existing.data);
  return { rows, alreadyImported: parsed.length - fresh.length, files: files.length };
}

export async function commitStatements(rows: PreviewRow[]): Promise<{ inserted: number; merged: number; error?: string }> {
  const merges = rows.filter((r) => r.match);
  const inserts = rows.filter((r) => !r.match);

  if (inserts.length) {
    const { error } = await supabase.from("expenses").upsert(
      inserts.map((r) => ({
        date: r.date,
        item_name: r.item_name,
        category: r.category,
        sub_category: r.sub_category,
        payment_method: PAYMENT_METHOD,
        amount: r.amount,
        currency: "JPY",
        notes: r.notes,
        source: SOURCE,
        raw_description: r.raw_description,
        external_id: r.external_id,
        kind: r.kind,
      })),
      { onConflict: "source,external_id", ignoreDuplicates: true },
    );
    if (error) return { inserted: 0, merged: 0, error: error.message };
  }

  for (const r of merges) {
    const { data: old, error: readError } = await supabase.from("expenses").select("notes").eq("id", r.match!.id).single();
    if (readError) return { inserted: inserts.length, merged: 0, error: readError.message };
    // Keep the hand-entered name in notes so nothing is lost.
    const notes = [old.notes, r.match!.item_name && r.match!.item_name !== r.item_name ? `Entered as: ${r.match!.item_name}` : null]
      .filter(Boolean)
      .join("\n");
    const { error } = await supabase
      .from("expenses")
      .update({
        item_name: r.item_name,
        category: r.category,
        sub_category: r.sub_category,
        notes: notes || null,
        source: SOURCE,
        raw_description: r.raw_description,
        external_id: r.external_id,
      })
      .eq("id", r.match!.id);
    if (error) return { inserted: inserts.length, merged: 0, error: error.message };
  }

  revalidatePath("/expenses");
  revalidatePath("/dashboard");
  revalidatePath("/add");
  return { inserted: inserts.length, merged: merges.length };
}
