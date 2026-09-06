import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function NotFound() {
  return <main className="mx-auto max-w-lg px-6 py-20"><h1 className="text-[length:var(--text-heading)] font-semibold">Page introuvable</h1><p className="mt-3 text-muted-foreground">Cette page n’existe pas dans votre CRM.</p><Button asChild className="mt-6 min-h-11"><Link href="/">Revenir à l’accueil</Link></Button></main>;
}
