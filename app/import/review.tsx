"use client";

import { useState, useTransition } from "react";
import { commitStatements, previewStatements, type Preview, type PreviewRow } from "@/app/import/actions";

const field =
  "w-full rounded-md border border-gray-300 dark:border-gray-600 bg-transparent px-2 py-1 text-xs focus:outline-none focus:border-blue-500";

const yen = (n: number) => new Intl.NumberFormat("en", { style: "currency", currency: "JPY" }).format(n);

export function Import({ categories, subCategories }: { categories: string[]; subCategories: string[] }) {
  const [preview, setPreview] = useState<Preview | null>(null);
  const [rows, setRows] = useState<(PreviewRow & { include: boolean })[]>([]);
  const [message, setMessage] = useState("");
  const [pending, start] = useTransition();

  function load(formData: FormData) {
    setMessage("");
    start(async () => {
      const p = await previewStatements(formData);
      setPreview(p);
      setRows(p.rows.map((r) => ({ ...r, include: true })));
      if (p.error) setMessage(p.error);
    });
  }

  function edit(i: number, change: Partial<PreviewRow & { include: boolean }>) {
    setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...change } : r)));
  }

  function commit() {
    start(async () => {
      const chosen: PreviewRow[] = rows.filter((r) => r.include);
      const res = await commitStatements(chosen);
      setMessage(res.error ? `Couldn't save: ${res.error}` : `Added ${res.inserted}, merged ${res.merged}.`);
      if (!res.error) {
        setPreview(null);
        setRows([]);
      }
    });
  }

  const chosen = rows.filter((r) => r.include);
  const missing = chosen.filter((r) => !r.category).length;

  return (
    <div className="mt-6">
      <form action={load} className="flex flex-wrap items-center gap-3">
        <input name="files" type="file" accept=".csv,text/csv" multiple required className="text-sm" />
        <button disabled={pending} className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm disabled:opacity-50">
          {pending && !preview ? "Reading…" : "Preview"}
        </button>
      </form>
      {message && <p aria-live="polite" className="mt-3 text-sm">{message}</p>}

      {preview && !preview.error && (
        <>
          <p className="mt-4 text-sm text-gray-500">
            {preview.files} file(s): {rows.length} new, {rows.filter((r) => r.match).length} matching an earlier entry,{" "}
            {preview.alreadyImported} already imported.
          </p>
          <datalist id="import-sub-categories">
            {subCategories.map((s) => <option key={s} value={s} />)}
          </datalist>
          <ul className="mt-2 divide-y divide-gray-100 dark:divide-gray-800">
            {rows.map((r, i) => (
              <li key={r.external_id} className={`py-2 grid grid-cols-[auto_1fr_auto] gap-x-3 gap-y-1 items-start ${r.include ? "" : "opacity-40"}`}>
                <input type="checkbox" checked={r.include} onChange={(e) => edit(i, { include: e.target.checked })} className="mt-1" />
                <div className="min-w-0">
                  <p className="text-sm truncate" title={r.raw_description}>{r.item_name}</p>
                  <p className="text-xs text-gray-500">
                    {r.date}
                    {r.match && <span className="ml-2 text-amber-600 dark:text-amber-400">merges with “{r.match.item_name}”</span>}
                    {r.notes && <span className="ml-2">{r.notes}</span>}
                  </p>
                </div>
                <p className="text-sm tabular-nums">{yen(r.amount)}</p>
                <div className="col-start-2 col-span-2 grid grid-cols-2 gap-2">
                  <select value={r.category ?? ""} onChange={(e) => edit(i, { category: e.target.value })} className={field}>
                    <option value="" disabled>Category…</option>
                    {categories.map((c) => <option key={c}>{c}</option>)}
                  </select>
                  <input value={r.sub_category ?? ""} onChange={(e) => edit(i, { sub_category: e.target.value })} list="import-sub-categories" placeholder="Sub-category" className={field} />
                </div>
              </li>
            ))}
          </ul>
          {rows.length > 0 && (
            <div className="mt-4 flex items-center gap-3">
              <button onClick={commit} disabled={pending || !chosen.length} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
                {pending ? "Saving…" : `Import ${chosen.length} rows`}
              </button>
              <p className="text-sm text-gray-500">
                {yen(chosen.reduce((s, r) => s + r.amount, 0))}
                {missing > 0 && `, ${missing} without a category`}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
