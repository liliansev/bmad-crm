"use client";
import { createBrowserClient } from "@supabase/ssr";
import { publicEnvSchema } from "@/lib/env";
import { authFetch } from "./fetch";

export function createClient() {
  const env = publicEnvSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
  return createBrowserClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, { global: { fetch: authFetch } });
}
