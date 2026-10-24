"use client";

import { useActionState, useState } from "react";
import { addExpense, type AddState } from "@/app/add/actions";

export type Options = {
  categories: string[];
  subCategories: Record<string, string[]>;
  paymentMethods: string[];
};

const field =
  "w-full rounded-md border border-gray-300 dark:border-gray-600 bg-transparent px-3 py-2 text-sm focus:outline-none focus:border-blue-500";
const label = "block text-xs font-medium text-gray-500 mb-1";

export function AddForm({ options, today }: { options: Options; today: string }) {
  const [state, action, pending] = useActionState<AddState, FormData>(addExpense, { ok: true, message: "" });
  const [category, setCategory] = useState("");
  const subs = options.subCategories[category] ?? Object.values(options.subCategories).flat();

  return (
    // React resets the form after a successful action, so defaults come back for the next entry.
    <form action={action} className="mt-6 grid grid-cols-2 gap-3">
      <div className="col-span-2">
        <label htmlFor="amount" className={label}>Amount</label>
        <input id="amount" name="amount" inputMode="decimal" required autoFocus autoComplete="off" className={`${field} text-lg tabular-nums`} />
      </div>
      <div className="col-span-2">
        <label htmlFor="item_name" className={label}>Item</label>
        <input id="item_name" name="item_name" required autoComplete="off" className={field} />
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
        <input id="sub_category" name="sub_category" list="sub-categories" autoComplete="off" className={field} />
        <datalist id="sub-categories">
          {[...new Set(subs)].map((s) => <option key={s} value={s} />)}
        </datalist>
      </div>
      <div>
        <label htmlFor="date" className={label}>Date</label>
        <input id="date" name="date" type="date" required defaultValue={today} className={field} />
      </div>
      <div className="grid grid-cols-[1fr_auto] gap-2">
        <div>
          <label htmlFor="payment_method" className={label}>Paid with</label>
          <input id="payment_method" name="payment_method" list="payment-methods" defaultValue="Cash" autoComplete="off" className={field} />
          <datalist id="payment-methods">
            {options.paymentMethods.map((p) => <option key={p} value={p} />)}
          </datalist>
        </div>
        <div>
          <label htmlFor="currency" className={label}>Currency</label>
          <select id="currency" name="currency" defaultValue="JPY" className={field}>
            <option>JPY</option>
            <option>MYR</option>
          </select>
        </div>
      </div>
      <div className="col-span-2">
        <label htmlFor="notes" className={label}>Notes</label>
        <textarea id="notes" name="notes" rows={2} className={field} />
      </div>
      <div className="col-span-2 flex items-center gap-3">
        <button disabled={pending} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
          {pending ? "Saving…" : "Add expense"}
        </button>
        <p aria-live="polite" className={`text-sm ${state.ok ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
          {state.message}
        </p>
      </div>
    </form>
  );
}
