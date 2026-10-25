"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const icon = {
  home: "M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z",
  list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  chat: "M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z",
  more: "M5 12h.01M12 12h.01M19 12h.01",
};

// Pages that belong to a tab without being its href, e.g. Import is reached from More.
const tabs = [
  { href: "/", label: "Home", d: icon.home, also: [] as string[] },
  { href: "/transactions", label: "Transactions", d: icon.list, also: [] },
  { href: "/ask", label: "Ask", d: icon.chat, also: [] },
  { href: "/more", label: "More", d: icon.more, also: ["/import"] },
];

function isActive(path: string, tab: (typeof tabs)[number]) {
  if (tab.href === "/") return path === "/";
  return [tab.href, ...tab.also].some((p) => path === p || path.startsWith(`${p}/`));
}

function Tab({ tab, active }: { tab: (typeof tabs)[number]; active: boolean }) {
  return (
    <Link
      href={tab.href}
      aria-current={active ? "page" : undefined}
      className={`flex flex-col items-center justify-center gap-0.5 min-h-12 text-[11px] ${
        active ? "text-blue-600 dark:text-blue-400 font-semibold" : "text-gray-500"
      }`}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d={tab.d} />
      </svg>
      {tab.label}
    </Link>
  );
}

// Bottom tab bar for every page in the (tabs) group. The centre + opens /add, which sits
// outside the group so the entry form gets the whole screen.
export function TabBar() {
  const path = usePathname();
  const [home, transactions, ask, more] = tabs;
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-10 border-t border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-950/95 backdrop-blur pb-[env(safe-area-inset-bottom)]"
    >
      <div className="max-w-lg mx-auto h-16 grid grid-cols-5 items-center px-2">
        <Tab tab={home} active={isActive(path, home)} />
        <Tab tab={transactions} active={isActive(path, transactions)} />
        <Link
          href="/add"
          aria-label="Add entry"
          className="justify-self-center -mt-6 size-14 rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/30 flex items-center justify-center hover:bg-blue-700"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </Link>
        <Tab tab={ask} active={isActive(path, ask)} />
        <Tab tab={more} active={isActive(path, more)} />
      </div>
    </nav>
  );
}
