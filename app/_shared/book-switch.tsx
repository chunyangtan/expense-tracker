import { books, type Currency } from "@/lib/book";
import { chooseBook } from "@/app/_shared/actions";

// Japan · ¥ | Malaysia · RM. A plain form, so it works before JavaScript loads; setting the
// cookie in the action re-renders the page for the chosen book.
export function BookSwitch({ current }: { current: Currency }) {
  return (
    <form action={chooseBook} className="grid grid-cols-2 rounded-lg bg-gray-100 dark:bg-gray-800 p-0.5" aria-label="Book">
      {books.map((b) => (
        <button
          key={b.currency}
          name="currency"
          value={b.currency}
          aria-pressed={b.currency === current}
          className={`min-h-10 rounded-md text-sm ${
            b.currency === current ? "bg-white dark:bg-gray-950 font-semibold shadow-sm" : "text-gray-500"
          }`}
        >
          {b.label}
        </button>
      ))}
    </form>
  );
}
