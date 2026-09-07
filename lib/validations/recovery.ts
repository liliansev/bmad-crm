import { z } from "zod";
import { loginSchema } from "./auth";

export const recoveryRequestSchema = loginSchema.pick({ email: true });
export const recoveryPasswordSchema = z.object({
  password: z.string().min(6, "Utilisez au moins 6 caractères.").max(1024, "Mot de passe trop long."),
  confirmation: z.string().min(1, "Confirmez votre nouveau mot de passe."),
}).refine((value) => value.password === value.confirmation, {
  message: "Les mots de passe ne correspondent pas.", path: ["confirmation"],
});
export const recoveryProofSchema = z.object({
  accessToken: z.string().min(1).max(16384).regex(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/),
  refreshToken: z.string().min(1).max(2048).regex(/^[A-Za-z0-9_-]+$/),
});
export const recoveryMutationSchema = recoveryPasswordSchema.safeExtend(recoveryProofSchema.shape);
export const recoveryClaimsSchema = z.object({
  sub: z.uuid(), session_id: z.uuid(), exp: z.number().int(),
  amr: z.array(z.object({ method: z.string(), timestamp: z.number().int() })),
});
export type RecoveryProof = z.infer<typeof recoveryProofSchema>;
export type RecoveryRequestInput = z.infer<typeof recoveryRequestSchema>;
export type RecoveryPasswordInput = z.infer<typeof recoveryPasswordSchema>;
export type RecoveryResult = { ok: true; message: string } | {
  ok: false; message: string; needsNewLink?: boolean;
  fields?: Partial<Record<"email" | "password" | "confirmation", string>>;
};
