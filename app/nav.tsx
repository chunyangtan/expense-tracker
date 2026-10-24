import Link from "next/link";
import { signOut } from "@/app/login/actions";

const pages = [
  { href: "/", label: "Chat" },
  { href: "/dashboard", label: "Overview" },
  { href: "/expenses", label: "Expenses" },
  { href: "/add", label: "Add" },
  { href: "/import", label: "Import" },
];

// Links to the other pages, for each page's header.
export function Nav({ current }: { current: string }) {
  return (
    <nav className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
      {pages
        .filter((p) => p.href !== current)
        .map((p) => (
          <Link key={p.href} href={p.href} className="text-blue-600 dark:text-blue-400 hover:underline">
            {p.label}
          </Link>
        ))}
      <form action={signOut}>
        <button className="text-gray-500 hover:underline">Sign out</button>
      </form>
    </nav>
  );
}
