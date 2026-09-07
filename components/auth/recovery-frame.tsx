import type { ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function RecoveryFrame({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return <main className="flex min-h-svh items-center justify-center px-6 py-12">
    <div className="w-full max-w-[360px]">
      <div className="mb-10 flex items-center gap-2.5 text-sm font-semibold"><span aria-hidden="true" className="flex size-8 items-center justify-center rounded-md bg-primary text-xs font-semibold tracking-tight text-primary-foreground">crm</span> Mon espace</div>
      <div className="mb-8"><h1 className="text-[length:var(--text-heading)] font-semibold tracking-tight">{title}</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p></div>
      {children}
      <Button asChild variant="link" className="mt-5 min-h-11 w-full"><Link href="/connexion">Retour à la connexion</Link></Button>
    </div>
  </main>;
}
