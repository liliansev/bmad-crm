import { z } from "zod";

export const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url().refine((value) => value.startsWith("https://")),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().trim().min(20).refine((value) => {
    if (/^sb_publishable_[A-Za-z0-9_-]+$/.test(value)) return true;
    try {
      const payload: unknown = JSON.parse(atob(value.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
      return z.object({ role: z.literal("anon") }).safeParse(payload).success;
    } catch { return false; }
  }),
});

export const serverEnvSchema = publicEnvSchema.extend({
  SUPABASE_OWNER_ID: z.uuid(),
});

// Report names only: validation errors must never include supplied secrets.
export function parseServerEnv(input: unknown) {
  const parsed = serverEnvSchema.safeParse(input);
  if (!parsed.success) {
    const fields = [...new Set(parsed.error.issues.map((issue) => issue.path.join(".")))];
    throw new Error(`Configuration CRM manquante ou invalide : ${fields.join(", ")}`);
  }
  return parsed.data;
}

export function getServerEnv() {
  return parseServerEnv({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL?.trim(),
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim(),
    SUPABASE_OWNER_ID: process.env.SUPABASE_OWNER_ID?.trim(),
  });
}
