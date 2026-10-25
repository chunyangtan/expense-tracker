// Dates as plain YYYY-MM-DD strings. "Today" is Tokyo's date (data-model rule 8).

export function today() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Tokyo" });
}

export function addDays(date: string, days: number) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// Months as YYYY-MM.
export function isMonth(v: unknown): v is string {
  return typeof v === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(v);
}

export function addMonths(month: string, n: number) {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return d.toISOString().slice(0, 7);
}

export function daysInMonth(month: string) {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

// First day of the month, and first day of the next one, for `date >= start and date < end`.
export function monthRange(month: string) {
  return { start: `${month}-01`, end: `${addMonths(month, 1)}-01` };
}

export function monthLabel(month: string, style: "long" | "short" = "long") {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleString("en", { month: style, year: style === "long" ? "numeric" : undefined, timeZone: "UTC" });
}

// e.g. "Sat 24 Oct"
export function dayLabel(date: string) {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
}

// 0 = Sunday
export function weekday(date: string) {
  return new Date(`${date}T00:00:00Z`).getUTCDay();
}
