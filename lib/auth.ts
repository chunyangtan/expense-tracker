import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";

// Supabase Auth client bound to the request's cookies. Only used for the session;
// data goes through lib/supabase.ts after the check below.
export async function createAuthClient() {
  const store = await cookies();
  return createServerClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (toSet) => {
        try {
          toSet.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // Server Components can't set cookies; proxy.ts refreshes the session instead.
        }
      },
    },
  });
}

// The owner's email when they're signed in, otherwise null. Single user: any other
// account is treated as signed out, even if one is created by mistake.
export const currentUser = cache(async () => {
  const supabase = await createAuthClient();
  const { data } = await supabase.auth.getClaims();
  const email = data?.claims.email;
  return email && email === process.env.ALLOWED_EMAIL ? email : null;
});

// Call at the top of every page and Server Action: redirects to /login unless signed in.
export async function requireUser() {
  const email = await currentUser();
  if (!email) redirect("/login");
  return email;
}
