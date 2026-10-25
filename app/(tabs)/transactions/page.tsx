import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { requireUser } from "@/lib/auth";
import { selectAll } from "@/lib/select-all";
import { currentBook } from "@/lib/book";
import { daysInMonth, dayLabel, isMonth, monthRange, today, weekday } from "@/lib/dates";
import { money } from "@/app/_entry/values";
import { BookSwitch } from "@/app/_shared/book-switch";
import { MonthSwitch } from "@/app/_shared/month-switch";
import { EntryRow } from "@/app/_shared/entry-row";

type Params = { month?: string; view?: string; day?: string; q?: string; cat?: string; pay?: string; check?: string };

// Spending leaves out transfers (data-model rule 1).
const spent = (rows: { amount: number; kind: string }[]) => rows.filter((r) => r.kind !== "transfer").reduce((s, r) => s + r.amount, 0);

// Calendar cells: ¥3.4k, ¥12k, RM 86
function short(amount: number, currency: string) {
  if (currency !== "JPY") return String(Math.round(amount));
  const k = amount / 1000;
  return Math.abs(amount) < 1000 ? String(Math.round(amount)) : `${k.toFixed(Math.abs(k) < 10 ? 1 : 0)}k`;
}

const chip = (on: boolean) =>
  `shrink-0 min-h-9 px-3 rounded-full border text-sm flex items-center ${
    on ? "bg-gray-900 text-white border-gray-900 dark:bg-gray-100 dark:text-gray-900 dark:border-gray-100" : "border-gray-300 dark:border-gray-600"
  }`;

export default async function Transactions({ searchParams }: { searchParams: Promise<Params> }) {
  await requireUser();
  const p = await searchParams;
  const book = await currentBook();
  const now = today();
  const month = isMonth(p.month) ? p.month : now.slice(0, 7);
  const calendar = p.view === "calendar";
  // PostgREST's or() syntax uses these characters, so they're dropped from the search text.
  const q = (p.q ?? "").replace(/[,()%*\\]/g, " ").trim();

  // Search spans every month; otherwise one month of the current book.
  const base = await selectAll((from, to) => {
    let query = supabase
      .from("expenses")
      .select("id, date, item_name, category, sub_category, payment_method, amount, currency, kind, confirmed_at, notes")
      .eq("currency", book);
    if (q) query = query.or(`item_name.ilike.%${q}%,notes.ilike.%${q}%,raw_description.ilike.%${q}%`);
    else query = query.gte("date", monthRange(month).start).lt("date", monthRange(month).end);
    return query.order("date", { ascending: false }).order("created_at", { ascending: false }).order("id").range(from, to);
  });

  const rows = base.filter(
    (r) => (!p.cat || r.category === p.cat) && (!p.pay || r.payment_method === p.pay) && (!p.check || r.confirmed_at === null),
  );
  const categories = [...new Set(base.map((r) => r.category).filter((c): c is string => !!c))].sort();
  const payments = [...new Set(base.map((r) => r.payment_method).filter((c): c is string => !!c))].sort();
  const unchecked = base.filter((r) => r.confirmed_at === null).length;

  // Links keep every other setting and change only what's given.
  const href = (change: Partial<Params>) => {
    const next = { month, view: calendar ? "calendar" : undefined, day: p.day, q: p.q, cat: p.cat, pay: p.pay, check: p.check, ...change };
    const s = new URLSearchParams(Object.entries(next).filter((e): e is [string, string] => !!e[1]));
    return `/transactions${s.size ? `?${s}` : ""}`;
  };

  const days = new Map<string, typeof rows>();
  for (const r of rows) days.set(r.date, [...(days.get(r.date) ?? []), r]);

  const selected = calendar ? (p.day?.startsWith(month) ? p.day : now.startsWith(month) ? now : undefined) : undefined;

  return (
    <main className="max-w-3xl w-full mx-auto px-4 pb-12">
      <header className="pt-3 pb-3 border-b border-gray-200 dark:border-gray-700 flex flex-col gap-3">
        <BookSwitch current={book} />
        {q ? (
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold">Results for “{q}”</h1>
            <Link href={href({ q: undefined })} className="min-h-11 flex items-center text-sm text-blue-600 dark:text-blue-400">Clear</Link>
          </div>
        ) : (
          <MonthSwitch month={month} href={(m) => href({ month: m, day: undefined })}>
            <p className="text-xs text-gray-500 tabular-nums">
              {money(spent(rows), book)} spent · {rows.length} {rows.length === 1 ? "entry" : "entries"}
            </p>
          </MonthSwitch>
        )}

        {!q && (
          <div className="grid grid-cols-2 rounded-lg bg-gray-100 dark:bg-gray-800 p-0.5 text-sm" aria-label="View">
            {[["List", false], ["Calendar", true]].map(([label, cal]) => (
              <Link
                key={String(label)}
                href={href({ view: cal ? "calendar" : undefined })}
                aria-current={calendar === cal ? "page" : undefined}
                className={`min-h-9 rounded-md flex items-center justify-center ${calendar === cal ? "bg-white dark:bg-gray-950 font-semibold shadow-sm" : "text-gray-500"}`}
              >
                {label}
              </Link>
            ))}
          </div>
        )}

        <form action="/transactions" className="flex items-center gap-2 min-h-11 px-3 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
          <label htmlFor="q" className="sr-only">Search all months</label>
          <input id="q" name="q" type="search" defaultValue={p.q ?? ""} placeholder="Search item, notes, statement text" className="flex-1 bg-transparent text-base sm:text-sm text-gray-900 dark:text-gray-100 outline-none" />
        </form>

        <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Filters">
          <Link href={href({ cat: undefined, pay: undefined, check: undefined })} className={chip(!p.cat && !p.pay && !p.check)}>All</Link>
          {unchecked > 0 && <Link href={href({ check: p.check ? undefined : "1" })} className={chip(!!p.check)}>To check · {unchecked}</Link>}
          {categories.map((c) => (
            <Link key={c} href={href({ cat: p.cat === c ? undefined : c })} className={chip(p.cat === c)}>{c}</Link>
          ))}
          {payments.map((m) => (
            <Link key={m} href={href({ pay: p.pay === m ? undefined : m })} className={chip(p.pay === m)}>{m}</Link>
          ))}
        </div>
      </header>

      {calendar && !q && (
        <div className="mt-3">
          <div className="grid grid-cols-7 text-center text-[11px] font-medium text-gray-500 pb-1">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => <span key={d}>{d}</span>)}
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {Array.from({ length: weekday(`${month}-01`) }, (_, i) => <span key={`blank-${i}`} />)}
            {Array.from({ length: daysInMonth(month) }, (_, i) => {
              const d = `${month}-${String(i + 1).padStart(2, "0")}`;
              const list = days.get(d);
              const on = d === selected;
              return (
                <Link
                  key={d}
                  href={href({ day: d })}
                  aria-label={`${dayLabel(d)}${list ? `, ${money(spent(list), book)}` : ", nothing logged"}`}
                  aria-current={on ? "date" : undefined}
                  className={`h-13 rounded-lg flex flex-col items-center pt-1.5 gap-0.5 ${
                    on ? "bg-blue-600 text-white" : d === now ? "ring-1 ring-blue-600" : d > now ? "text-gray-400" : ""
                  }`}
                >
                  <span className="text-sm">{i + 1}</span>
                  <span className={`text-[10px] tabular-nums ${on ? "text-white" : "text-gray-500"}`}>{list ? short(spent(list), book) : d > now ? "" : "–"}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {rows.length === 0 && (
        <p className="mt-16 text-center text-sm text-gray-500">
          {q ? "Nothing matches." : "No entries this month yet. Tap ＋ to add one."}
        </p>
      )}

      {[...days]
        .filter(([d]) => !calendar || q || d === selected)
        .map(([date, list]) => (
          <section key={date} className="mt-5">
            <h2 className="flex justify-between text-xs font-medium text-gray-500 mb-1 tabular-nums">
              <span>{q ? `${dayLabel(date)} ${date.slice(0, 4)}` : dayLabel(date)}</span>
              <span>{money(spent(list), book)}</span>
            </h2>
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {list.map((e) => <EntryRow key={e.id} e={e} from="/transactions" />)}
            </ul>
          </section>
        ))}
      {calendar && !q && selected && !days.get(selected) && (
        <p className="mt-6 text-center text-sm text-gray-500">Nothing logged on {dayLabel(selected)}.</p>
      )}
    </main>
  );
}
