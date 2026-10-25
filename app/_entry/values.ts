import "server-only";

// `id` is the row just added, so the toast can undo it.
export type EntryState = { ok: boolean; message: string; id?: string };

type Row = {
  date: string;
  item_name: string;
  category: string | null;
  sub_category: string | null;
  payment_method: string | null;
  amount: number;
  currency: "JPY" | "MYR";
  kind: "expense" | "refund" | "transfer";
  notes: string | null;
};

const text = (v: FormDataEntryValue | null) => (typeof v === "string" && v.trim() ? v.trim() : null);

// Reads and checks the entry form. The form always takes a positive amount; refunds are stored
// negative (data-model rule 3). `confirmed` is the Checked switch, only on the edit form.
export function parseEntry(formData: FormData): { row: Row; confirmed: boolean } | { error: string } {
  const date = text(formData.get("date"));
  const item = text(formData.get("item_name"));
  const currency = text(formData.get("currency"));
  const kind = text(formData.get("kind")) ?? "expense";
  const amount = Number(text(formData.get("amount"))?.replace(/[,¥]/g, ""));

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: "Pick a date." };
  if (!item) return { error: "Enter what it was for." };
  if (currency !== "JPY" && currency !== "MYR") return { error: "Choose the Japan or Malaysia book." };
  if (kind !== "expense" && kind !== "refund" && kind !== "transfer") return { error: "Choose expense, refund or transfer." };
  if (!Number.isFinite(amount) || amount <= 0) return { error: "Enter an amount above zero." };

  return {
    row: {
      date,
      item_name: item,
      category: text(formData.get("category")),
      sub_category: text(formData.get("sub_category")),
      payment_method: text(formData.get("payment_method")),
      amount: kind === "refund" ? -amount : amount,
      currency,
      kind,
      notes: text(formData.get("notes")),
    },
    confirmed: formData.get("confirmed") === "on",
  };
}

export function money(amount: number, currency: string) {
  return new Intl.NumberFormat("en", { style: "currency", currency }).format(amount);
}
