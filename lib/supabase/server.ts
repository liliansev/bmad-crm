import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getServerEnv } from "@/lib/env";
import { authFetch } from "./fetch";

export async function createClient({ writable = false }: { writable?: boolean } = {}) {
  const env = getServerEnv();
  const cookieStore = await cookies();
  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    global: { fetch: authFetch },
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(cookiesToSet) {
        // Server Components are read-only; middleware already refreshed these cookies.
        // Actions and route handlers opt in, so real write errors propagate.
        if (!writable) return;
        cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
      },
    },
  });
}
