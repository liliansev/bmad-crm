import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { getServerEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export async function ownerStatus({ writable = false }: { writable?: boolean } = {}) {
  const supabase = await createClient({ writable });
  const { data, error } = await supabase.auth.getUser();
  if (error && (error.status === undefined || error.status >= 500)) return "unavailable" as const;
  return !error && data.user?.id === getServerEnv().SUPABASE_OWNER_ID ? "owner" as const : "denied" as const;
}

// React cache is scoped to one Server Component render, never shared across requests.
const renderOwnerStatus = cache(() => ownerStatus());

export async function requireOwner() {
  const status = await renderOwnerStatus();
  if (status !== "owner") redirect(status === "unavailable" ? "/connexion?session=verification" : "/connexion?session=expired");
}
