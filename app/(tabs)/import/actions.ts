"use server";

import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase";
import { requireUser } from "@/lib/auth";
import { selectAll } from "@/lib/select-all";
import { parseRakutenCard, SOURCE, type StatementRow } from "@/lib/statements/rakuten-card";
import { suggestCategories } from "@/lib/statements/categorise";

export type ImportResult = {
  files: number;
  added: number;
  merged: number;
  skipped: number;
  error?: string;
};

const PAYMENT_METHOD = "Rakuten Credit Card";

// Imports whole statements in one go (DECISIONS.md, 2026-10-25). Every row lands as to check
// (confirmed_at null) and is checked afterwards in /to-check, so nothing is reviewed up front.
// Re-uploads add nothing (rule 5), and a row matching a typed-in entry merges into it (rule 6).
export async function importStatements(formData: FormData): Promise<ImportResult> {
  await requireUser();
  const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  const result: ImportResult = { files: files.length, added: 0, merged: 0, skipped: 0 };
  if (!files.length) return { ...result, error: "Choose at least one CSV." };

  let parsed: StatementRow[] = [];
  try {
    for (const f of files) parsed = parsed.concat(parseRakutenCard(await f.text()));
  } catch (e) {
    return { ...result, error: `Couldn't read the file: ${(e as Error).message}` };
  }

  const [imported, existing] = await Promise.all([
    selectAll((from, to) => supabase.from("expenses").select("external_id").eq("source", SOURCE).order("id").range(from, to)),
    selectAll((from, to) =>
      supabase
        .from("expenses")
        .select("id, date, amount, item_name, category, sub_category, payment_method, notes")
        .neq("source", SOURCE)
        .order("id")
        .range(from, to),
    ),
  ]);
  const importedIds = new Set(imported.map((r) => r.external_id));
  const fresh = parsed.filter((r) => !importedIds.has(r.external_id));
  result.skipped = parsed.length - fresh.length;

  // Same date and amount, not cash: probably the same purchase entered by hand.
  // The statement's name wins, the existing category stays (DECISIONS.md, 2026-10-24).
  const candidates = existing.filter((e) => e.payment_method !== "Cash");
  const used = new Set<string>();
  const rows = fresh.map((r) => {
    const m = candidates.find((e) => !used.has(e.id) && e.date === r.date && Number(e.amount) === r.amount);
    if (!m) return { ...r, match: null };
    used.add(m.id);
    return { ...r, category: m.category, sub_category: m.sub_category, match: m };
  });
  await suggestCategories(rows.filter((r) => !r.category), existing);

  const inserts = rows.filter((r) => !r.match);
  if (inserts.length) {
    const { error, count } = await supabase.from("expenses").upsert(
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
        confirmed_at: null,
      })),
      { onConflict: "source,external_id", ignoreDuplicates: true, count: "exact" },
    );
    if (error) return { ...result, error: `Couldn't save: ${error.message}` };
    result.added = count ?? inserts.length;
  }

  for (const r of rows) {
    if (!r.match) continue;
    // Keep the hand-entered name in notes so nothing is lost. The statement changed the entry,
    // so it goes back to to check.
    const notes = [r.match.notes, r.match.item_name && r.match.item_name !== r.item_name ? `Entered as: ${r.match.item_name}` : null]
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
        confirmed_at: null,
      })
      .eq("id", r.match.id);
    if (error) return { ...result, error: `Couldn't merge into “${r.match.item_name}”: ${error.message}` };
    result.merged++;
  }

  revalidatePath("/transactions");
  revalidatePath("/to-check");
  revalidatePath("/");
  revalidatePath("/add");
  return result;
}
