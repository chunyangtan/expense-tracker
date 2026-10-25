"use client";

import { useEffect, useRef, useState } from "react";
import { categoryColor } from "@/lib/categories";

type Sub = { name: string; category: string; uses: number };

// Every sub-category, searchable, grouped under its category with the current one first.
// With no exact match, the search text can become a new sub-category of the chosen category.
export function SubSheet({
  subs,
  categories,
  category,
  onPick,
  onClose,
}: {
  subs: Sub[];
  categories: string[];
  category: string;
  onPick: (sub: string, category: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const search = useRef<HTMLInputElement>(null);
  useEffect(() => search.current?.focus(), []);

  const q = query.trim().toLowerCase();
  const order = [category, ...categories.filter((c) => c !== category)].filter(Boolean);
  const groups = order
    .map((c) => ({ category: c, subs: subs.filter((s) => s.category === c && (!q || s.name.toLowerCase().includes(q))) }))
    .filter((g) => g.subs.length);
  const exact = subs.some((s) => s.name.toLowerCase() === q);

  return (
    <div className="fixed inset-0 z-20 bg-black/40 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="sub-sheet-title"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
        className="w-full max-w-lg h-[85dvh] sm:h-[70dvh] bg-white dark:bg-gray-950 rounded-t-2xl sm:rounded-2xl flex flex-col"
      >
        <div className="flex items-center justify-between pl-4 pr-2 pt-2">
          <h2 id="sub-sheet-title" className="text-base font-semibold">Choose sub-category</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="size-11 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
        <div className="px-4 pb-2">
          <label className="flex items-center gap-2 min-h-11 px-3 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
            <span className="sr-only">Search sub-categories</span>
            <input ref={search} type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search" className="flex-1 bg-transparent text-base text-gray-900 dark:text-gray-100 outline-none" />
          </label>
        </div>
        <div className="flex-1 overflow-y-auto px-4 pb-6">
          {groups.map((g) => (
            <section key={g.category} className="mt-3">
              <h3 className="flex items-center gap-1.5 py-1 text-xs font-semibold text-gray-500">
                <span className="size-2 rounded-full" style={{ background: categoryColor(g.category) }} />
                {g.category}
              </h3>
              <ul className="divide-y divide-gray-100 dark:divide-gray-800 border-t border-gray-100 dark:border-gray-800">
                {g.subs.map((s) => (
                  <li key={s.name}>
                    <button type="button" onClick={() => onPick(s.name, s.category)} className="w-full min-h-12 flex items-center justify-between px-1 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-900">
                      <span>{s.name}</span>
                      <span className="text-xs text-gray-500 tabular-nums">{s.uses}×</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
          {q && !exact && (
            <button
              type="button"
              disabled={!category}
              onClick={() => onPick(query.trim(), category)}
              className="mt-4 w-full min-h-12 rounded-lg border border-dashed border-gray-400 text-sm font-medium text-blue-600 dark:text-blue-400 disabled:text-gray-400"
            >
              {category ? `+ New sub-category “${query.trim()}” in ${category}` : "Choose a category first to add a new sub-category"}
            </button>
          )}
          {!groups.length && !q && <p className="mt-8 text-center text-sm text-gray-500">No sub-categories yet.</p>}
        </div>
      </div>
    </div>
  );
}
