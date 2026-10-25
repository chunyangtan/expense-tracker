import "server-only";
import { cookies } from "next/headers";

// The Japan and Malaysia books (docs/ui.md, Books). Until accounts exist, a book is its currency.
export const books = [
  { currency: "JPY", label: "Japan · ¥" },
  { currency: "MYR", label: "Malaysia · RM" },
] as const;
export type Currency = (typeof books)[number]["currency"];

export const BOOK_COOKIE = "book";

export function isCurrency(v: unknown): v is Currency {
  return v === "JPY" || v === "MYR";
}

// The book last used, remembered in a cookie so a week in KL stays on Malaysia.
export async function currentBook(): Promise<Currency> {
  const v = (await cookies()).get(BOOK_COOKIE)?.value;
  return isCurrency(v) ? v : "JPY";
}

export async function rememberBook(currency: Currency) {
  (await cookies()).set(BOOK_COOKIE, currency, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
}
