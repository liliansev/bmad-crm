"use client";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { requestPasswordReset } from "@/app/actions/recovery";
import { recoveryRequestSchema, type RecoveryRequestInput, type RecoveryResult } from "@/lib/validations/recovery";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RecoveryRequestForm() {
  const attempt = useRef(0);
  const busy = useRef(false);
  useEffect(() => () => { attempt.current++; }, []);
  const [result, setResult] = useState<RecoveryResult | null>(null);
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<RecoveryRequestInput>({ resolver: zodResolver(recoveryRequestSchema), defaultValues: { email: "" } });
  async function submit(input: RecoveryRequestInput) {
    if (busy.current) return;
    busy.current = true;
    const current = ++attempt.current;
    setResult(null);
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const response = await Promise.race([requestPasswordReset(input), new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error("timeout")), 45_000); })]);
      if (current !== attempt.current) return;
      setResult(response);
      if (!response.ok && response.fields?.email) setError("email", { message: response.fields.email });
    } catch {
      if (current === attempt.current) setResult({ ok: false, message: "L’envoi a été interrompu. Vérifiez votre réseau puis réessayez." });
    } finally { clearTimeout(timer); busy.current = false; }
  }
  return <form noValidate onSubmit={handleSubmit(submit)} aria-busy={isSubmitting} className="space-y-5">
    <div className="space-y-2">
      <Label htmlFor="email">Adresse e-mail</Label>
      <Input id="email" type="email" autoComplete="username" inputMode="email" autoCapitalize="none" spellCheck={false} {...register("email")} disabled={isSubmitting} aria-invalid={!!errors.email} aria-describedby={errors.email ? "email-error" : undefined} className="h-11" />
      {errors.email ? <p id="email-error" className="text-sm text-destructive">{errors.email.message}</p> : null}
    </div>
    <p role={result?.ok ? "status" : "alert"} aria-live="polite" className={`min-h-15 text-sm leading-5 ${result?.ok ? "text-muted-foreground" : "text-destructive"}`}>{result?.message}</p>
    <Button type="submit" disabled={isSubmitting} className="h-11 w-full">{isSubmitting ? <><LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> Envoi en cours…</> : "Envoyer le lien"}</Button>
  </form>;
}
