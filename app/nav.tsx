import Link from "next/link";

const pages = [
  { href: "/", label: "Chat" },
  { href: "/dashboard", label: "Overview" },
  { href: "/expenses", label: "Expenses" },
  { href: "/add", label: "Add" },
];

// Links to the other pages, for each page's header.
export function Nav({ current }: { current: string }) {
  return (
    <nav className="flex gap-4 text-sm">
      {pages
        .filter((p) => p.href !== current)
        .map((p) => (
          <Link key={p.href} href={p.href} className="text-blue-600 dark:text-blue-400 hover:underline">
            {p.label}
          </Link>
        ))}
    </nav>
  );
}
