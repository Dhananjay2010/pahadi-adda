import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * `null` until NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are
 * set (see .env.local.example) — callers must handle the absent case so the
 * site still renders (without live presence) before those are configured.
 */
export const supabase =
  url && anonKey ? createClient(url, anonKey) : null;
