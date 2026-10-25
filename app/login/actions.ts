"use server";

import { redirect } from "next/navigation";
import { createAuthClient } from "@/lib/auth";

export async function signIn(_prev: string, formData: FormData): Promise<string> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  // Same message for a wrong password and a stranger's account.
  if (email !== process.env.ALLOWED_EMAIL) return "Wrong email or password.";

  const supabase = await createAuthClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return "Wrong email or password.";
  redirect("/");
}

export async function signOut() {
  const supabase = await createAuthClient();
  await supabase.auth.signOut();
  redirect("/login");
}
