import type { Metadata } from "next";
import { LockKeyhole } from "lucide-react";
import { requireOwner } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
export const metadata: Metadata = { title: "Accueil" };
export default async function HomePage() {
  await requireOwner();
  return <><header className="mb-8"><h1 className="text-[length:var(--text-heading)] font-semibold tracking-tight">Accueil</h1><p className="mt-2 text-sm text-muted-foreground">Votre espace de suivi commercial.</p></header>
    <Card className="max-w-2xl shadow-none"><CardContent className="flex gap-4 p-6"><LockKeyhole className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden="true" /><div><h2 className="text-base font-medium">Votre espace privé est ouvert</h2><p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">Vous êtes connecté. Votre CRM est prêt à accueillir votre suivi commercial.</p></div></CardContent></Card>
  </>;
}
