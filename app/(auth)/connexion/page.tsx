import type { Metadata } from "next";
import { LockKeyhole } from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";
export const metadata: Metadata = { title: "Connexion" };
export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const notice = params.session === "expired" ? "Votre session a pris fin. Reconnectez-vous pour retrouver votre espace." : params.session === "verification" ? "Votre session n’a pas pu être vérifiée. Reconnectez-vous lorsque le service est disponible." : null;
  return <main className="flex min-h-svh items-center justify-center px-6 py-12">
    <div className="w-full max-w-[360px]">
      <div className="mb-10 flex items-center gap-2.5 text-sm font-semibold"><span aria-hidden="true" className="flex size-8 items-center justify-center rounded-md bg-primary text-xs font-semibold tracking-tight text-primary-foreground">crm</span> Mon espace</div>
      <div className="mb-8"><h1 className="text-[length:var(--text-heading)] font-semibold tracking-tight">Bienvenue dans votre CRM</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">Connectez-vous pour ouvrir votre espace privé.</p></div>
      {notice ? <p role="status" className="mb-6 text-sm leading-6 text-muted-foreground">{notice}</p> : null}
      <LoginForm />
      <p className="mt-8 flex items-center justify-center gap-2 text-xs text-muted-foreground"><LockKeyhole className="size-3.5" aria-hidden="true" /> Accès réservé au propriétaire</p>
    </div>
  </main>;
}
