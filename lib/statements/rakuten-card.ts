import { createHash } from "node:crypto";
import { parse } from "csv-parse/sync";

// One purchase from a Rakuten Card e-NAVI statement CSV (enavi<YYYYMM>(<card>).csv).
export type StatementRow = {
  external_id: string;
  date: string;
  item_name: string;
  raw_description: string;
  amount: number;
  kind: "expense" | "refund";
  notes: string | null;
  // Set when a fixed rule knows the category; otherwise Claude suggests one.
  category: string | null;
  sub_category: string | null;
};

export const SOURCE = "statement:rakuten-card";

// Half-width katakana and full-width ASCII to their usual forms, single spaces.
export const normalise = (s: string) => s.normalize("NFKC").replace(/\s+/g, " ").trim();

// Rows whose category doesn't need Claude. See DECISIONS.md (2026-10-24, card data).
const rules: { test: RegExp; category: string; sub_category: string }[] = [
  // Rakuten Cash top-ups fund Rakuten Pay; counted as spending until Rakuten Pay history is imported.
  { test: /楽天キャッシュ\s*チャージ/, category: "Variable (変動費)", sub_category: "Rakuten Pay (unsplit)" },
  { test: /suica/i, category: "Variable (変動費)", sub_category: "Transportation" },
  // ふるさと納税 payments show as the municipality, e.g. 茨城県境町, 大阪府泉佐野市.
  { test: /^.{2,3}[都道府県].{1,6}[市町村]$/, category: "Special (特別出費・年数回)", sub_category: "ふるさと納税" },
];

// Columns, by position because the month in two headers changes per file:
// 利用日, 利用店名・商品名, 利用者, 支払方法, 利用金額, 手数料/利息, 支払総額, N月支払金額, N月繰越残高, 新規サイン
export function parseRakutenCard(csv: string): StatementRow[] {
  const records: string[][] = parse(csv, { bom: true, relax_column_count: true, skip_empty_lines: true });
  const rows: StatementRow[] = [];
  const seen = new Map<string, number>();

  for (const [date, description, , method, amountText] of records.slice(1)) {
    // A row with no date continues the previous one, e.g. the local amount of a foreign purchase.
    if (!date) {
      const prev = rows.at(-1);
      if (prev && description) prev.raw_description += ` / ${normalise(description)}`;
      continue;
    }

    const isoDate = date.replaceAll("/", "-");
    const amount = Number(amountText);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate) || !Number.isFinite(amount)) {
      throw new Error(`Unreadable row: ${date}, ${description}, ${amountText}`);
    }

    // No transaction ID in the file, so hash the row. The counter keeps identical
    // same-day rows (e.g. two ¥1,000 top-ups) apart, and is stable across re-uploads.
    const base = `${isoDate}|${description}|${amount}`;
    const n = (seen.get(base) ?? 0) + 1;
    seen.set(base, n);
    const external_id = createHash("sha256").update(`${base}|${n}`).digest("hex").slice(0, 32);

    const item_name = normalise(description);
    const rule = rules.find((r) => r.test.test(item_name));
    rows.push({
      external_id,
      date: isoDate,
      item_name,
      raw_description: description,
      amount,
      kind: amount < 0 ? "refund" : "expense",
      notes: method && method !== "1回払い" ? `支払方法: ${method}` : null,
      category: rule?.category ?? null,
      sub_category: rule?.sub_category ?? null,
    });
  }
  return rows;
}
