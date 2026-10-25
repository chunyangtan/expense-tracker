import Link from "next/link";
import { categoryColor } from "@/lib/categories";
import { money } from "@/app/_entry/values";

export type RowData = {
  id: string;
  item_name: string | null;
  category: string | null;
  sub_category: string | null;
  payment_method: string | null;
  amount: number;
  currency: string;
  kind: string;
  confirmed_at: string | null;
};

// One entry in a list, opening the entry form. Transfers are greyed and labelled, refunds
// labelled rather than told by colour alone (docs/ui.md, Shared patterns).
export function EntryRow({ e, from, meta }: { e: RowData; from: string; meta?: string }) {
  const transfer = e.kind === "transfer";
  const tag = transfer ? "Transfer · not counted" : e.kind === "refund" ? "Refund" : e.confirmed_at === null ? "To check" : null;
  return (
    <li>
      <Link href={`/transactions/${e.id}?from=${from}`} className="py-2.5 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-900">
        <span className="size-2.5 shrink-0 rounded-full" style={{ background: transfer ? "var(--cat-none)" : categoryColor(e.category) }} />
        <span className={`flex-1 min-w-0 ${transfer ? "opacity-60" : ""}`}>
          <span className="block text-sm truncate">{e.item_name ?? "(no name)"}</span>
          <span className="block text-xs text-gray-500 truncate">
            {meta ?? [e.sub_category ?? e.category, e.payment_method].filter(Boolean).join(" · ")}
          </span>
        </span>
        <span className="text-right">
          <span className={`block text-sm font-medium tabular-nums whitespace-nowrap ${transfer ? "text-gray-500" : ""}`}>{money(e.amount, e.currency)}</span>
          {tag && <span className={`block text-[11px] ${tag === "To check" ? "text-amber-700 dark:text-amber-400" : "text-gray-500"}`}>{tag}</span>}
        </span>
      </Link>
    </li>
  );
}
