import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function HomeSkeleton() {
  return <div aria-hidden="true">
    <header className="mb-8">
      <Skeleton className="w-fit text-[length:var(--text-heading)] font-semibold tracking-tight text-transparent">Accueil</Skeleton>
      <Skeleton className="mt-2 w-fit text-sm text-transparent">Votre espace de suivi commercial.</Skeleton>
    </header>
    <Card className="max-w-2xl shadow-none"><CardContent className="flex gap-4 p-6">
      <Skeleton className="mt-0.5 size-5 shrink-0" />
      <div><Skeleton className="w-fit text-base font-medium text-transparent">Votre espace privé est ouvert</Skeleton>
        <Skeleton className="mt-2 max-w-lg text-sm leading-6 text-transparent">Vous êtes connecté. Votre CRM est prêt à accueillir votre suivi commercial.</Skeleton>
      </div>
    </CardContent></Card>
  </div>;
}

export function DashboardSkeleton() {
  return <div aria-hidden="true" className="min-h-svh md:grid md:grid-cols-[208px_minmax(0,1fr)]">
    <aside className="flex flex-col border-b border-border bg-sidebar px-4 py-5 md:min-h-svh md:border-r md:border-b-0">
      <Skeleton className="mb-5 h-7 w-32 md:mb-8" />
      <Skeleton className="h-11 w-full" />
      <Skeleton className="mt-auto hidden h-4 w-24 md:block" />
    </aside>
    <div className="min-w-0 p-6 md:p-8"><HomeSkeleton /></div>
  </div>;
}
