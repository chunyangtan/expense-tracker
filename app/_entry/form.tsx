"use client";

import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import type { EntryState } from "@/app/_entry/values";
import { SubSheet } from "@/app/_entry/sub-sheet";
import { categoryColor } from "@/lib/categories";

type Currency = "JPY" | "MYR";

export type BookOptions = {
  frequentItems: string[];
  topSubs: { name: string; category: string }[];
  payments: string[];
  lastPayment: string;
  // Each item name's last category and payment method, to fill them when the name is picked again.
  items: Record<string, { category: string | null; sub_category: string | null; payment_method: string | null }>;
};

export type Options = {
  categories: string[];
  subs: { name: string; category: string; uses: number }[];
  books: Record<Currency, BookOptions>;
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
  confirmed: boolean;
};

// text-base on phones: iOS Safari zooms into inputs with text under 16px.
const field =
  "w-full min-h-11 rounded-md border border-gray-300 dark:border-gray-600 bg-transparent px-3 py-2 text-base sm:text-sm focus:outline-none focus:border-blue-500";
const label = "block text-xs font-medium text-gray-500 mb-1";
const chip = (on: boolean) =>
  `shrink-0 min-h-9 px-3 rounded-full border text-sm ${
    on ? "border-blue-600 bg-blue-50 dark:bg-blue-950 font-medium" : "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-900"
  }`;
const segment = (on: boolean) =>
  `min-h-10 rounded-md text-sm text-center flex items-center justify-center cursor-pointer ${
    on ? "bg-white dark:bg-gray-950 font-semibold shadow-sm" : "text-gray-500"
  }`;

const kindHelp: Record<string, string> = {
  expense: "Counted in spending totals.",
  refund: "Money back. Saved as a negative amount and subtracted from totals.",
  transfer: "Money moving between your own accounts or the two books, like a card payment, top-up or Wise transfer. Left out of totals.",
};

// Statement imports that match a typed-in entry by date and amount (data-model rule 6).
const MATCHED_BY_IMPORT = new Set(["Rakuten Credit Card"]);

// One form for adding and editing (docs/ui.md, Entry form). Every field of the record is visible in
// both modes; the chips only fill fields faster. Add resets for the next entry after a save and
// offers Undo; edit keeps what was typed if the save fails.
export function EntryForm({
  mode,
  options,
  initial,
  today,
  action,
  undo,
}: {
  mode: "add" | "edit";
  options: Options;
  today: string;
  initial: EntryValues;
  action: (prev: EntryState, formData: FormData) => Promise<EntryState>;
  undo?: (id: string) => Promise<EntryState>;
}) {
  const [state, dispatch, pending] = useActionState(action, { ok: true, message: "" });
  const [currency, setCurrency] = useState<Currency>(initial.currency === "MYR" ? "MYR" : "JPY");
  const [kind, setKind] = useState(initial.kind);
  const [item, setItem] = useState(initial.item_name ?? "");
  const [category, setCategory] = useState(initial.category ?? "");
  const [sub, setSub] = useState(initial.sub_category ?? "");
  const [pay, setPay] = useState(initial.payment_method ?? "");
  const [date, setDate] = useState(initial.date);
  const [confirmed, setConfirmed] = useState(initial.confirmed);
  const [filled, setFilled] = useState("");
  const [sheet, setSheet] = useState(false);
  const [toast, setToast] = useState<{ message: string; id?: string } | null>(null);
  const form = useRef<HTMLFormElement>(null);
  // The first values, for resetting. A ref so a server refresh with new props doesn't reset again.
  const first = useRef(initial);

  const book = options.books[currency];
  const yesterday = new Date(Date.parse(`${today}T00:00:00Z`) - 864e5).toISOString().slice(0, 10);
  // The current choice is always among the chips, in front, without growing the row.
  const withCurrent = <T,>(list: T[], current: T | null, same: (a: T, b: T) => boolean, max: number) =>
    (current && !list.some((x) => same(x, current)) ? [current, ...list] : list).slice(0, max);
  const subChips = withCurrent(book.topSubs, sub ? { name: sub, category } : null, (a, b) => a.name === b.name, 6);
  const payChips = withCurrent(book.payments, pay || null, (a, b) => a === b, 4);

  useEffect(() => {
    if (!state.message) return;
    if (mode === "add" && state.ok) {
      form.current?.reset();
      const f = first.current;
      setKind(f.kind);
      setItem("");
      setCategory("");
      setSub("");
      setPay(options.books[currency].lastPayment);
      setDate(f.date);
      setFilled("");
      setToast({ message: state.message, id: state.id });
      form.current?.querySelector<HTMLInputElement>("#amount")?.focus();
    }
    // Only a new result should reset the form, not a change of book.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, mode]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 8000);
    return () => clearTimeout(t);
  }, [toast]);

  function chooseBook(c: Currency) {
    setCurrency(c);
    if (mode === "add") setPay(options.books[c].lastPayment);
  }

  // Picking a past item fills what it had last time (add only, so editing a name doesn't
  // silently change the category).
  function chooseItem(name: string) {
    setItem(name);
    const last = mode === "add" ? book.items[name] : undefined;
    if (!last) return setFilled("");
    if (last.category) setCategory(last.category);
    setSub(last.sub_category ?? "");
    if (last.payment_method) setPay(last.payment_method);
    setFilled(`Filled from the last time: ${[last.sub_category ?? last.category, last.payment_method].filter(Boolean).join(" · ")}`);
  }

  function chooseSub(name: string, cat: string) {
    setSub(name);
    if (cat) setCategory(cat);
    setSheet(false);
  }

  const submitLabel = mode === "add" ? "Save" : confirmed ? "Save changes" : "Save · still to check";

  return (
    <>
      {/* Submitting by hand rather than through `action` stops React resetting the form on every
          save, so a failed edit keeps its changes. */}
      <form
        ref={form}
        onSubmit={(e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          startTransition(() => dispatch(data));
        }}
        className="mt-4 flex flex-col gap-5"
      >
        {mode === "edit" && !initial.confirmed && (
          <p className="rounded-lg bg-amber-50 dark:bg-amber-950 px-3 py-2 text-sm text-amber-900 dark:text-amber-200">
            Imported, not checked yet. Fix anything that&apos;s wrong, then turn on Checked.
          </p>
        )}

        <fieldset>
          <legend className="sr-only">Book</legend>
          <div className="grid grid-cols-2 rounded-lg bg-gray-100 dark:bg-gray-800 p-0.5">
            {(["JPY", "MYR"] as const).map((c) => (
              <label key={c} className={segment(currency === c)}>
                <input type="radio" name="currency" value={c} checked={currency === c} onChange={() => chooseBook(c)} className="sr-only" />
                {c === "JPY" ? "Japan · ¥" : "Malaysia · RM"}
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor="amount" className={label}>Amount</label>
          <div className="flex items-center gap-2 rounded-xl border-2 border-blue-600 px-4 py-2">
            <span className="text-2xl font-semibold text-gray-500">{currency === "JPY" ? "¥" : "RM"}</span>
            <input
              id="amount"
              name="amount"
              inputMode="decimal"
              required
              autoFocus={mode === "add"}
              autoComplete="off"
              defaultValue={initial.amount ?? ""}
              placeholder="0"
              className="flex-1 min-w-0 bg-transparent text-3xl font-semibold tabular-nums outline-none"
            />
          </div>
        </div>

        <fieldset>
          <legend className={label}>Counts as</legend>
          <div className="grid grid-cols-3 rounded-lg bg-gray-100 dark:bg-gray-800 p-0.5">
            {(["expense", "refund", "transfer"] as const).map((k) => (
              <label key={k} className={`${segment(kind === k)} capitalize`}>
                <input type="radio" name="kind" value={k} checked={kind === k} onChange={() => setKind(k)} className="sr-only" />
                {k}
              </label>
            ))}
          </div>
          <p className="mt-1 text-xs text-gray-500">{kindHelp[kind]}</p>
        </fieldset>

        <div>
          <label htmlFor="item_name" className={label}>Item</label>
          <input id="item_name" name="item_name" required autoComplete="off" list="past-items" value={item} onChange={(e) => chooseItem(e.target.value)} className={field} />
          <datalist id="past-items">
            {Object.keys(book.items).map((n) => <option key={n} value={n} />)}
          </datalist>
          {mode === "add" && book.frequentItems.length > 0 && (
            <div className="mt-2 flex gap-2 overflow-x-auto pb-1" aria-label="Frequent items">
              {book.frequentItems.map((n) => (
                <button key={n} type="button" onClick={() => chooseItem(n)} className={chip(item === n)}>{n}</button>
              ))}
            </div>
          )}
          {filled && <p className="mt-1 text-xs text-gray-500" aria-live="polite">{filled}</p>}
        </div>

        <div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="category" className={label}>Category</label>
              <select id="category" name="category" required className={field} value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="" disabled>Choose…</option>
                {options.categories.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <span className={label} id="sub-label">Sub-category</span>
              <input type="hidden" name="sub_category" value={sub} />
              <button type="button" aria-labelledby="sub-label" onClick={() => setSheet(true)} className={`${field} flex items-center justify-between gap-2 text-left`}>
                <span className={`truncate ${sub ? "" : "text-gray-500"}`}>{sub || "Choose…"}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0 text-gray-500"><path d="M6 9l6 6 6-6" /></svg>
              </button>
            </div>
          </div>
          {subChips.length > 0 && (
            <div className="mt-2 flex gap-2 overflow-x-auto pb-1" aria-label="Most used sub-categories">
              {subChips.map((s) => (
                <button key={`${s.category}|${s.name}`} type="button" onClick={() => chooseSub(s.name, s.category)} className={`${chip(sub === s.name)} flex items-center gap-1.5`}>
                  <span className="size-2 rounded-full" style={{ background: categoryColor(s.category) }} />
                  {s.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="date" className={label}>Date</label>
              <input id="date" name="date" type="date" required value={date} onChange={(e) => setDate(e.target.value)} className={field} />
            </div>
            <div>
              <label htmlFor="payment_method" className={label}>Paid with</label>
              <input id="payment_method" name="payment_method" list="payment-methods" value={pay} onChange={(e) => setPay(e.target.value)} autoComplete="off" className={field} />
              <datalist id="payment-methods">
                {book.payments.map((p) => <option key={p} value={p} />)}
              </datalist>
            </div>
          </div>
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1" aria-label="Date and payment shortcuts">
            {[["Today", today], ["Yesterday", yesterday]].map(([l, d]) => (
              <button key={l} type="button" onClick={() => setDate(d)} className={chip(date === d)}>{l}</button>
            ))}
            <span className="shrink-0 w-px my-1.5 bg-gray-300 dark:bg-gray-600" aria-hidden="true" />
            {payChips.map((p) => (
              <button key={p} type="button" onClick={() => setPay(p)} className={chip(pay === p)}>{p}</button>
            ))}
          </div>
          {mode === "add" && MATCHED_BY_IMPORT.has(pay) && (
            <p className="mt-1 text-xs text-gray-500">Will be matched with its statement row when that&apos;s imported, not added twice.</p>
          )}
        </div>

        <div>
          <label htmlFor="notes" className={label}>Notes</label>
          <textarea id="notes" name="notes" rows={2} defaultValue={initial.notes ?? ""} className={field} />
        </div>

        {mode === "edit" && (
          <label className="flex items-center justify-between gap-3 min-h-14 px-3 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer">
            <span>
              <span className="block text-sm">Checked</span>
              <span className="block text-xs text-gray-500">{confirmed ? "Confirmed as right." : "Still to check. Turn on once it's right."}</span>
            </span>
            <input type="checkbox" name="confirmed" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="size-6 accent-blue-600" />
          </label>
        )}

        <div className="sticky bottom-0 -mx-4 px-4 py-3 bg-white/95 dark:bg-gray-950/95 backdrop-blur border-t border-gray-200 dark:border-gray-800 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          {!state.ok && <p aria-live="polite" className="mb-2 text-sm text-red-600 dark:text-red-400">{state.message}</p>}
          <button disabled={pending} className="w-full min-h-12 rounded-xl bg-blue-600 text-base font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
            {pending ? "Saving…" : submitLabel}
          </button>
        </div>
      </form>

      {toast && (
        <div role="status" className="fixed inset-x-4 bottom-24 z-30 mx-auto max-w-lg flex items-center justify-between gap-3 rounded-xl bg-gray-900 text-white pl-4 pr-2 min-h-12 text-sm shadow-lg">
          <span className="truncate">{toast.message}</span>
          {toast.id && undo && (
            <button
              type="button"
              onClick={async () => {
                const id = toast.id!;
                setToast(null);
                const res = await undo(id);
                setToast({ message: res.message });
              }}
              className="min-h-10 px-3 font-semibold text-blue-300"
            >
              Undo
            </button>
          )}
        </div>
      )}

      {sheet && (
        <SubSheet subs={options.subs} categories={options.categories} category={category} onPick={chooseSub} onClose={() => setSheet(false)} />
      )}
    </>
  );
}
