"use server";
import { cookies } from "next/headers";
import { getServerEnv } from "@/lib/env";
import { loginSchema, type LoginResult } from "@/lib/validations/auth";
import { createClient } from "@/lib/supabase/server";

const denied = "Connexion impossible avec ces identifiants. Vérifiez votre saisie et réessayez.";
const unavailable = "Le service de connexion est momentanément indisponible. Réessayez dans un instant.";

export async function login(input: unknown): Promise<LoginResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    const fields: Partial<Record<"email" | "password", string>> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if ((key === "email" || key === "password") && !fields[key]) fields[key] = issue.message;
    }
    return { ok: false, message: "Vérifiez les champs indiqués.", fields };
  }
  const supabase = await createClient({ writable: true });
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { ok: false, message: error.status && error.status < 500 ? denied : unavailable };
  const { data, error: identityError } = await supabase.auth.getUser();
  if (identityError || data.user?.id !== getServerEnv().SUPABASE_OWNER_ID) {
    // Discard the rejected session locally without affecting any other device.
    const cookieStore = await cookies();
    const prefix = `sb-${new URL(getServerEnv().NEXT_PUBLIC_SUPABASE_URL).hostname.split(".")[0]}-auth-token`;
    cookieStore.getAll().filter(({ name }) => name === prefix || name.startsWith(`${prefix}.`)).forEach(({ name }) => cookieStore.set(name, "", { path: "/", maxAge: 0 }));
    return { ok: false, message: identityError && (!identityError.status || identityError.status >= 500) ? unavailable : denied };
  }
  return { ok: true };
}
