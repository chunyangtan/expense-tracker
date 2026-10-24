// One-off import of the AppSheet export (data/expenses.csv) into Supabase.
// Run with: npm run import:appsheet
// Refuses to run twice: it stops if any rows with source = 'appsheet' already exist.

import { readFileSync } from "node:fs";
import { parse } from "csv-parse/sync";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../lib/database.types";

type ExpenseInsert = Database["public"]["Tables"]["expenses"]["Insert"];

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error(
    "Missing SUPABASE_URL, or SUPABASE_SECRET_KEY / SUPABASE_SERVICE_ROLE_KEY, in .env.local",
  );
  process.exit(1);
}

const supabase = createClient<Database>(url, key, { auth: { persistSession: false } });

// "2026/01/04 00:29:18", recorded in Japan time.
function toTimestamp(value: string): string | undefined {
  if (!value.trim()) return undefined;
  const [date, time = "00:00:00"] = value.trim().split(" ");
  return `${date.replaceAll("/", "-")}T${time}+09:00`;
}

function orNull(value: string): string | null {
  return value.trim() === "" ? null : value.trim();
}

const records: Record<string, string>[] = parse(readFileSync("data/expenses.csv", "utf-8"), {
  columns: true,
  bom: true,
});

const rows: ExpenseInsert[] = records.map((r) => {
  // A few rows have no timestamps at all; fall back to the expense date.
  const fallback = toTimestamp(r["Date"]);
  const modified = toTimestamp(r["Modified At"]) ?? fallback;
  const created = toTimestamp(r["Created At"]) ?? modified;
  return {
    date: r["Date"].replaceAll("/", "-"),
    item_name: orNull(r["Item Name"]),
    category: orNull(r["Category"]),
    sub_category: orNull(r["Sub-Category"]),
    payment_method: orNull(r["Payment Method"]),
    amount: Number(r["Amount"].replace(/[¥,]/g, "")),
    currency: "JPY",
    notes: orNull(r["Notes"]),
    photos: orNull(r["Photos"]),
    source: "appsheet",
    created_at: created,
    modified_at: modified,
  };
});

const bad = rows.filter((r) => !Number.isFinite(r.amount) || !/^\d{4}-\d{2}-\d{2}$/.test(r.date));
if (bad.length) {
  console.error("Rows with an unreadable amount or date:", bad);
  process.exit(1);
}

const { count, error: countError } = await supabase
  .from("expenses")
  .select("*", { count: "exact", head: true })
  .eq("source", "appsheet");
if (countError) throw countError;
if (count) {
  console.error(`${count} AppSheet rows are already imported. Nothing done.`);
  process.exit(1);
}

const { error } = await supabase.from("expenses").insert(rows);
if (error) throw error;

const total = rows.reduce((sum, r) => sum + r.amount, 0);
console.log(`Imported ${rows.length} rows, total ¥${total.toLocaleString()}.`);
