"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { changePassword } from "@/app/actions/recovery";
import { recoveryPasswordSchema, recoveryProofSchema, type RecoveryProof, type RecoveryPasswordInput, type RecoveryResult } from "@/lib/validations/recovery";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

export function RecoveryPasswordForm() {
  const token = useRef<RecoveryProof | null>(null);
  const initialized = useRef(false);
  const busy = useRef(false);
  const attempt = useRef(0);
  const [ready, setReady] = useState(false);
  const [result, setResult] = useState<RecoveryResult | null>(null);
  const { register, handleSubmit, setError, resetField, formState: { errors, isSubmitting } } = useForm<RecoveryPasswordInput>({ resolver: zodResolver(recoveryPasswordSchema), defaultValues: { password: "", confirmation: "" } });
  useEffect(() => {
    // StrictMode can repeat effects; a cleaned URL must not overwrite the memory token.
    const readFragment = () => {
      if (busy.current) {
        window.history.replaceState(window.history.state, "", window.location.pathname);
        return;
      }
      const hash = new URLSearchParams(window.location.hash.slice(1));
      window.history.replaceState(window.history.state, "", window.location.pathname);
      const parsed = recoveryProofSchema.safeParse({ accessToken: hash.get("access_token"), refreshToken: hash.get("refresh_token") });
      token.current = parsed.success && hash.get("type") === "recovery" && !hash.has("error") && !hash.has("error_code") && hash.getAll("access_token").length === 1 && hash.getAll("refresh_token").length === 1 ? parsed.data : null;
      setResult(token.current ? null : { ok: false, needsNewLink: true, message: "Ce lien est absent ou inutilisable. Demandez un nouveau lien." });
      resetField("password"); resetField("confirmation");
      setReady(true);
    };
    if (!initialized.current) { initialized.current = true; readFragment(); }
    window.addEventListener("hashchange", readFragment);
    return () => { attempt.current++; window.removeEventListener("hashchange", readFragment); };
  }, [resetField]);
  const clearPasswords = () => { resetField("password", { keepError: true }); resetField("confirmation", { keepError: true }); };
  async function submit(input: RecoveryPasswordInput) {
    if (busy.current || !token.current) return;
    busy.current = true;
    const current = ++attempt.current;
    setResult(null);
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const response = await Promise.race([changePassword({ ...input, ...token.current }), new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error("timeout")), 60_000); })]);
      if (current !== attempt.current) return;
      setResult(response);
      if (response.ok || response.needsNewLink) token.current = null;
      if (!response.ok) {
        for (const field of ["password", "confirmation"] as const) if (response.fields?.[field]) setError(field, { message: response.fields[field] });
      }
    } catch {
      if (current !== attempt.current) return;
      token.current = null;
      setResult({ ok: false, needsNewLink: true, message: "Le changement a été interrompu et n’a pas pu être confirmé. Essayez de vous connecter avec le nouveau mot de passe, ou demandez un nouveau lien." });
    } finally {
      clearTimeout(timer);
      input.password = ""; input.confirmation = "";
      clearPasswords(); busy.current = false;
    }
  }
  if (!ready) return <div role="status" aria-label="Lecture du lien" className="space-y-5"><Skeleton className="h-20 w-full" /><Skeleton className="h-20 w-full" /><Skeleton className="h-15 w-full" /><Skeleton className="h-11 w-full" /></div>;
  if (result?.ok || (result && !result.ok && result.needsNewLink)) return <div className="space-y-5">
    <p role={result.ok ? "status" : "alert"} className={`text-sm leading-6 ${result.ok ? "text-muted-foreground" : "text-destructive"}`}>{result.message}</p>
    {!result.ok ? <Button asChild className="min-h-11 w-full"><Link href="/mot-de-passe-oublie">Demander un nouveau lien</Link></Button> : null}
  </div>;
  return <form noValidate onSubmit={handleSubmit(submit, clearPasswords)} aria-busy={isSubmitting} className="space-y-5">
    <div className="space-y-2"><Label htmlFor="password">Nouveau mot de passe</Label><Input id="password" type="password" autoComplete="new-password" {...register("password")} disabled={isSubmitting} aria-invalid={!!errors.password} aria-describedby={errors.password ? "password-error password-hint" : "password-hint"} className="h-11" /><p id="password-hint" className="text-xs text-muted-foreground">Au moins 6 caractères.</p>{errors.password ? <p id="password-error" className="text-sm text-destructive">{errors.password.message}</p> : null}</div>
    <div className="space-y-2"><Label htmlFor="confirmation">Confirmer le mot de passe</Label><Input id="confirmation" type="password" autoComplete="new-password" {...register("confirmation")} disabled={isSubmitting} aria-invalid={!!errors.confirmation} aria-describedby={errors.confirmation ? "confirmation-error" : undefined} className="h-11" />{errors.confirmation ? <p id="confirmation-error" className="text-sm text-destructive">{errors.confirmation.message}</p> : null}</div>
    <p role="alert" aria-live="polite" className="min-h-10 text-sm leading-5 text-destructive">{result?.message}</p>
    <Button type="submit" disabled={isSubmitting} className="h-11 w-full">{isSubmitting ? <><LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> Enregistrement…</> : "Enregistrer le mot de passe"}</Button>
  </form>;
}
