import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

// Server-only: the secret key bypasses RLS, so this must never be imported by a client component.
export const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { persistSession: false } },
);
