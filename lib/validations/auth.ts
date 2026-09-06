import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().min(1, "Saisissez votre adresse e-mail.").email("Saisissez une adresse e-mail valide.").max(254, "Adresse e-mail trop longue."),
  password: z.string().min(1, "Saisissez votre mot de passe.").max(1024, "Mot de passe trop long."),
});
export type LoginInput = z.infer<typeof loginSchema>;
export type LoginResult = { ok: true } | { ok: false; message: string; fields?: Partial<Record<keyof LoginInput, string>> };
export const sessionStatusSchema = z.object({ authenticated: z.boolean() });
