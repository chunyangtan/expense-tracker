import { requireUser } from "@/lib/auth";
import { Upload } from "@/app/(tabs)/import/upload";

export default async function ImportPage() {
  await requireUser();
  return (
    <main className="max-w-3xl w-full mx-auto px-4 pb-12">
      <header className="py-4 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-xl font-semibold">Import statements</h1>
        <p className="text-sm text-gray-500">
          Rakuten Card CSVs from e-NAVI. Every row goes in as to check; confirm them in To check afterwards.
        </p>
      </header>
      <Upload />
    </main>
  );
}
