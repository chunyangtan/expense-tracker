import "server-only";

type Page<T> = PromiseLike<{ data: T[] | null; error: { message: string } | null }>;

// The API returns at most 1000 rows per request (data-model rule 11), so anything that
// reads every row pages through. The query must have a stable order, e.g. by id.
// Example: selectAll((from, to) => supabase.from("expenses").select("id").order("id").range(from, to))
export async function selectAll<T>(page: (from: number, to: number) => Page<T>): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await page(from, from + 999);
    if (error) throw new Error(error.message);
    rows.push(...(data ?? []));
    if (!data || data.length < 1000) return rows;
  }
}
