// Writes every expense to data/backups/expenses-YYYY-MM-DD.csv (gitignored).
// Run with: npm run backup, then put the file in Google Drive.

import { mkdirSync, writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../lib/database.types";

const supabase = createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
  auth: { persistSession: false },
});

// The API returns at most 1000 rows per request, so page through.
const rows: Database["public"]["Tables"]["expenses"]["Row"][] = [];
for (let from = 0; ; from += 1000) {
  const { data, error } = await supabase.from("expenses").select("*").order("date").order("created_at").range(from, from + 999);
  if (error) throw error;
  rows.push(...data);
  if (data.length < 1000) break;
}

const columns = Object.keys(rows[0] ?? {}) as (keyof (typeof rows)[number])[];
const cell = (v: unknown) => {
  const s = v == null ? "" : Array.isArray(v) ? v.join(";") : String(v);
  return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
};
const csv = [columns.join(","), ...rows.map((r) => columns.map((c) => cell(r[c])).join(","))].join("\n");

const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Tokyo" });
mkdirSync("data/backups", { recursive: true });
const path = `data/backups/expenses-${today}.csv`;
writeFileSync(path, "﻿" + csv); // BOM so Excel reads the Japanese text as UTF-8
console.log(`Wrote ${rows.length} rows to ${path}`);
