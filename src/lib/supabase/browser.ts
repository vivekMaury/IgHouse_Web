import { createBrowserClient } from "@supabase/ssr";

const DEFAULT_SUPABASE_URL = "https://nnfmkhepnddevymtmyss.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5uZm1raGVwbmRkZXZ5bXRteXNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIzOTg5ODQsImV4cCI6MjEwNzk3NDk4NH0.6uEXvHH3A_uzp_HCKm2-f6F0iU0yMBF8Jn3guIRRdYU";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

  return createBrowserClient(url, key);
}
