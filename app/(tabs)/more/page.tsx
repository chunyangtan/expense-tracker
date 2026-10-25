import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { signOut } from "@/app/login/actions";

export default async function More() {
  await requireUser();
  return (
    <main className="max-w-3xl w-full mx-auto px-4 pb-12">
      <header className="py-4 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-xl font-semibold">More</h1>
      </header>

      <ul className="mt-4 divide-y divide-gray-100 dark:divide-gray-800">
        <li>
          <Link href="/import" className="flex items-center justify-between gap-4 min-h-14 py-2">
            <span>
              <span className="block text-sm">Import statement</span>
              <span className="block text-xs text-gray-500">Rakuten Card CSV from e-NAVI</span>
            </span>
            <span aria-hidden="true" className="text-gray-400">›</span>
          </Link>
        </li>
        <li>
          <form action={signOut}>
            <button className="w-full text-left min-h-14 py-2 text-sm text-red-700 dark:text-red-400">Sign out</button>
          </form>
        </li>
      </ul>
    </main>
  );
}
