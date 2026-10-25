"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { importStatements, type ImportResult } from "@/app/(tabs)/import/actions";

export function Upload() {
  const [result, setResult] = useState<ImportResult | null>(null);
  const [pending, start] = useTransition();

  return (
    <div className="mt-6">
      <form action={(data) => start(async () => setResult(await importStatements(data)))} className="flex flex-col gap-3">
        <input name="files" type="file" accept=".csv,text/csv" multiple required className="text-sm" />
        <button disabled={pending} className="self-start min-h-11 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
          {pending ? "Importing…" : "Import"}
        </button>
      </form>

      {result && (
        <div aria-live="polite" className="mt-6 text-sm">
          {result.error ? (
            <p className="text-red-600 dark:text-red-400">{result.error}</p>
          ) : (
            <>
              <p>
                {result.files} file(s): {result.added} added, {result.merged} merged into entries you&apos;d typed in, {result.skipped} already here and skipped.
              </p>
              {result.added + result.merged > 0 && (
                <Link href="/to-check" className="mt-3 inline-flex min-h-11 items-center font-medium text-blue-600 dark:text-blue-400">
                  Check {result.added + result.merged} entries ›
                </Link>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
