import { supabase } from "@/lib/supabase";
import { requireUser } from "@/lib/auth";
import { Nav } from "@/app/nav";
import { Import } from "@/app/import/review";

export default async function ImportPage() {
  await requireUser();
  const { data, error } = await supabase.from("expenses").select("category, sub_category");
  if (error) throw error;
  const distinct = (values: (string | null)[]) => [...new Set(values.filter((v): v is string => !!v))].sort();

  return (
    <main className="max-w-3xl w-full mx-auto px-4 pb-12">
      <header className="py-4 border-b border-gray-200 dark:border-gray-700 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
        <div>
          <h1 className="text-xl font-semibold">Import statements</h1>
          <p className="text-sm text-gray-500">Rakuten Card CSVs from e-NAVI. Review, then import.</p>
        </div>
        <Nav current="/import" />
      </header>
      <Import categories={distinct(data.map((r) => r.category))} subCategories={distinct(data.map((r) => r.sub_category))} />
    </main>
  );
}
