"use client";

import { useActionState } from "react";
import { signIn } from "@/app/login/actions";

const field =
  "w-full rounded-md border border-gray-300 dark:border-gray-600 bg-transparent px-3 py-2 text-base sm:text-sm focus:outline-none focus:border-blue-500";

export function LoginForm() {
  const [error, action, pending] = useActionState(signIn, "");
  return (
    <form action={action} className="mt-6 grid gap-3">
      <input name="email" type="email" autoComplete="username" required placeholder="Email" className={field} />
      <input name="password" type="password" autoComplete="current-password" required placeholder="Password" className={field} />
      <button disabled={pending} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
        {pending ? "Signing in…" : "Sign in"}
      </button>
      <p aria-live="polite" className="text-sm text-red-600 dark:text-red-400">{error}</p>
    </form>
  );
}
