import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getServerEnv } from "@/lib/env";
import { authFetch } from "./fetch";

export async function updateSession(request: NextRequest) {
  const env = getServerEnv();
  let response = NextResponse.next({ request });
  const supabase = createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    global: { fetch: authFetch },
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        const previousCookies = response.cookies.getAll();
        response = NextResponse.next({ request });
        previousCookies.forEach((cookie) => response.cookies.set(cookie));
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers).forEach(([name, value]) => response.headers.set(name, value));
      },
    },
  });
  const { data, error } = await supabase.auth.getUser();
  const isOwner = !error && data.user?.id === env.SUPABASE_OWNER_ID;
  const publicPath = request.nextUrl.pathname === "/connexion";
  const sessionPath = request.nextUrl.pathname === "/api/session";
  const unavailable = !!error && (error.status === undefined || error.status >= 500);

  if (!isOwner && !unavailable) {
    const prefix = `sb-${new URL(env.NEXT_PUBLIC_SUPABASE_URL).hostname.split(".")[0]}-auth-token`;
    request.cookies.getAll().filter(({ name }) => name === prefix || name.startsWith(`${prefix}.`)).forEach(({ name }) => {
      request.cookies.delete(name);
      response.cookies.set(name, "", { path: "/", maxAge: 0 });
    });
  }
  if (!isOwner && !publicPath && !sessionPath) {
    const url = new URL("/connexion", request.url);
    if (unavailable) url.searchParams.set("session", "verification");
    const redirectResponse = NextResponse.redirect(url);
    response.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie));
    for (const name of ["Cache-Control", "Expires", "Pragma"]) {
      const value = response.headers.get(name);
      if (value) redirectResponse.headers.set(name, value);
    }
    response = redirectResponse;
  }
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  return response;
}
