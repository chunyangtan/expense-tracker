import Link from "next/link";
import { addMonths, monthLabel } from "@/lib/dates";

const arrow = "size-11 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800";

// ‹ October 2026 ›. `href` builds the link for another month, keeping the page's other settings.
export function MonthSwitch({ month, href, children }: { month: string; href: (month: string) => string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <Link href={href(addMonths(month, -1))} aria-label="Previous month" className={arrow}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg>
      </Link>
      <div className="text-center">
        <h1 className="text-lg font-semibold">{monthLabel(month)}</h1>
        {children}
      </div>
      <Link href={href(addMonths(month, 1))} aria-label="Next month" className={arrow}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 18l6-6-6-6" /></svg>
      </Link>
    </div>
  );
}
