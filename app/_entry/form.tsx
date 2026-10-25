"use client";

import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import type { EntryState } from "@/app/_entry/values";

export type Options = {
  categories: string[];
  subCategories: Record<string, string[]>;
  paymentMethods: string[];
};

// The record as the form shows it: amount is always positive, `kind` carries the sign.
export type EntryValues = {
  date: string;
  item_name: string | null;
  category: string | null;
  sub_category: string | null;
  payment_method: string | null;
  amount: number | null;
  currency: string;
  kind: string;
  notes: string | null;
};

// text-base on phones: iOS Safari zooms into inputs with text under 16px.
const field =
  "w-full rounded-md border border-gray-300 dark:border-gray-600 bg-transparent px-3 py-2 text-base sm:text-sm focus:outline-none focus:border-blue-500";
const label = "block text-xs font-medium text-gray-500 mb-1";

const kindHelp: Record<string, string> = {
  expense: "Counted in spending totals.",
  refund: "Money back. Saved as a negative amount and subtracted from totals.",
  transfer: "Money moving between your own accounts, like a card payment, top-up or Wise transfer. Left out of totals.",
};

// One form for adding and editing (docs/ui.md, Entry form): every field of the record, in both modes.
// Add resets for the next entry after a save; edit keeps what was typed if the save fails.
export function EntryForm({
  options,
  initial,
  action,
  submitLabel,
  resetOnSave,
}: {
  options: Options;
  initial: EntryValues;
  action: (prev: EntryState, formData: FormData) => Promise<EntryState>;
  submitLabel: string;
  resetOnSave: boolean;
}) {
  const [state, dispatch, pending] = useActionState(action, { ok: true, message: "" });
  const [category, setCategory] = useState(initial.category ?? "");
  const [kind, setKind] = useState(initial.kind);
  const form = useRef<HTMLFormElement>(null);
  // The first values, for resetting. A ref so a server refresh with new props doesn't reset again.
  const first = useRef(initial);
  const subs = options.subCategories[category] ?? Object.values(options.subCategories).flat();

  useEffect(() => {
    if (resetOnSave && state.ok && state.message) {
      form.current?.reset();
      setCategory(first.current.category ?? "");
      setKind(first.current.kind);
    }
  }, [state, resetOnSave]);

  return (
    // Submitting by hand rather than through `action` stops React resetting the form on every save,
    // so a failed edit keeps its changes.
    <form
      ref={form}
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => dispatch(data));
      }}
      className="mt-6 grid grid-cols-2 gap-3"
    >
      <div className="col-span-2">
        <label htmlFor="amount" className={label}>Amount</label>
        <input id="amount" name="amount" inputMode="decimal" required autoFocus={resetOnSave} autoComplete="off" defaultValue={initial.amount ?? ""} className={`${field} text-lg tabular-nums`} />
      </div>
      <fieldset className="col-span-2">
        <legend className={label}>Counts as</legend>
        <div className="grid grid-cols-3 rounded-md bg-gray-100 dark:bg-gray-800 p-0.5">
          {(["expense", "refund", "transfer"] as const).map((k) => (
            <label key={k} className={`text-center text-sm py-1.5 rounded cursor-pointer capitalize ${kind === k ? "bg-white dark:bg-gray-950 font-medium shadow-sm" : "text-gray-500"}`}>
              <input type="radio" name="kind" value={k} checked={kind === k} onChange={() => setKind(k)} className="sr-only" />
              {k}
            </label>
          ))}
        </div>
        <p className="mt-1 text-xs text-gray-500">{kindHelp[kind]}</p>
      </fieldset>
      <div className="col-span-2">
        <label htmlFor="item_name" className={label}>Item</label>
        <input id="item_name" name="item_name" required autoComplete="off" defaultValue={initial.item_name ?? ""} className={field} />
      </div>
      <div>
        <label htmlFor="category" className={label}>Category</label>
        <select id="category" name="category" required className={field} value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="" disabled>Choose…</option>
          {options.categories.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="sub_category" className={label}>Sub-category</label>
        <input id="sub_category" name="sub_category" list="sub-categories" autoComplete="off" defaultValue={initial.sub_category ?? ""} className={field} />
        <datalist id="sub-categories">
          {[...new Set(subs)].map((s) => <option key={s} value={s} />)}
        </datalist>
      </div>
      <div className="col-span-2 sm:col-span-1">
        <label htmlFor="date" className={label}>Date</label>
        <input id="date" name="date" type="date" required defaultValue={initial.date} className={field} />
      </div>
      <div className="col-span-2 sm:col-span-1 grid grid-cols-[1fr_auto] gap-2">
        <div>
          <label htmlFor="payment_method" className={label}>Paid with</label>
          <input id="payment_method" name="payment_method" list="payment-methods" defaultValue={initial.payment_method ?? ""} autoComplete="off" className={field} />
          <datalist id="payment-methods">
            {options.paymentMethods.map((p) => <option key={p} value={p} />)}
          </datalist>
        </div>
        <div>
          <label htmlFor="currency" className={label}>Currency</label>
          <select id="currency" name="currency" defaultValue={initial.currency} className={field}>
            <option>JPY</option>
            <option>MYR</option>
          </select>
        </div>
      </div>
      <div className="col-span-2">
        <label htmlFor="notes" className={label}>Notes</label>
        <textarea id="notes" name="notes" rows={2} defaultValue={initial.notes ?? ""} className={field} />
      </div>
      <div className="col-span-2 flex items-center gap-3">
        <button disabled={pending} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
          {pending ? "Saving…" : submitLabel}
        </button>
        <p aria-live="polite" className={`text-sm ${state.ok ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
          {state.message}
        </p>
      </div>
    </form>
  );
}
