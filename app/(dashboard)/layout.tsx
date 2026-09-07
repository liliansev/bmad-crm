import { DashboardNav } from "@/components/dashboard-nav";
import { LockKeyhole } from "lucide-react";
import { requireOwner } from "@/lib/auth";
import { SessionGuard } from "@/components/auth/session-guard";
export const dynamic = "force-dynamic";
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await requireOwner();
  return <SessionGuard><div className="min-h-svh md:grid md:grid-cols-[208px_minmax(0,1fr)]">
    <aside className="flex flex-col border-b border-border bg-sidebar px-4 py-5 md:min-h-svh md:border-r md:border-b-0">
      <div className="mb-5 flex items-center gap-2.5 px-2 text-sm font-semibold md:mb-8"><span aria-hidden="true" className="flex size-7 items-center justify-center rounded-md bg-primary text-[11px] text-primary-foreground">crm</span> Mon espace</div>
      <DashboardNav />
      <p className="mt-auto hidden items-center gap-2 px-3 pt-8 text-xs text-muted-foreground md:flex"><LockKeyhole className="size-3.5" aria-hidden="true" /> Espace privé</p>
    </aside>
    <main className="min-w-0 p-6 md:p-8">{children}</main>
  </div></SessionGuard>;
}
