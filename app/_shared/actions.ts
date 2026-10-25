"use server";

import { requireUser } from "@/lib/auth";
import { isCurrency, rememberBook } from "@/lib/book";

export async function chooseBook(formData: FormData) {
  await requireUser();
  const currency = formData.get("currency");
  if (isCurrency(currency)) await rememberBook(currency);
}
