"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { login } from "@/app/actions/auth";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const attempt = useRef(0);
  useEffect(() => () => { attempt.current++; }, []);
  const [message, setMessage] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);
  const { register, handleSubmit, setError, resetField, formState: { errors, isSubmitting } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" },
  });
  const pending = isSubmitting || redirecting;

  async function submit(input: LoginInput) {
    setMessage(null);
    const current = ++attempt.current;
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const result = await Promise.race([
        login(input),
        new Promise<never>((_, reject) => {
          // Middleware plus action may each contact Auth; allow their bounded requests.
          timer = setTimeout(() => reject(new Error("login_timeout")), 45_000);
        }),
      ]);
      if (current !== attempt.current) return;
      resetField("password");
      if (!result.ok) {
        setMessage(result.message);
        if (result.fields?.email) setError("email", { message: result.fields.email });
        if (result.fields?.password) setError("password", { message: result.fields.password });
        return;
      }
      setRedirecting(true);
      // A full navigation discards any previous router cache and password state.
      window.location.replace("/");
    } catch {
      if (current !== attempt.current) return;
      resetField("password");
      setMessage("La connexion a été interrompue. Vérifiez votre réseau puis réessayez.");
    } finally {
      clearTimeout(timer);
      input.password = "";
    }
  }

  return <form noValidate onSubmit={handleSubmit(submit)} aria-busy={pending} className="space-y-5">
    <div className="space-y-2">
      <Label htmlFor="email">Adresse e-mail</Label>
      <Input id="email" type="email" autoComplete="username" inputMode="email" autoCapitalize="none" spellCheck={false} {...register("email")} aria-invalid={!!errors.email} aria-describedby={errors.email ? "email-error" : undefined} disabled={pending} className="h-11" />
      {errors.email ? <p id="email-error" className="text-sm text-destructive">{errors.email.message}</p> : null}
    </div>
    <div className="space-y-2">
      <Label htmlFor="password">Mot de passe</Label>
      <Input id="password" type="password" autoComplete="current-password" {...register("password")} aria-invalid={!!errors.password} aria-describedby={errors.password ? "password-error" : undefined} disabled={pending} className="h-11" />
      {errors.password ? <p id="password-error" className="text-sm text-destructive">{errors.password.message}</p> : null}
    </div>
    <p role="alert" aria-live="polite" className="min-h-10 text-sm leading-5 text-destructive">{message}</p>
    <Button type="submit" disabled={pending} className="h-11 w-full gap-2">
      {pending ? <><LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> Connexion en cours…</> : <>Se connecter <ArrowRight className="size-4" aria-hidden="true" /></>}
    </Button>
    <Button asChild variant="link" className="min-h-11 w-full"><Link href="/mot-de-passe-oublie">Mot de passe oublié</Link></Button>
  </form>;
}
