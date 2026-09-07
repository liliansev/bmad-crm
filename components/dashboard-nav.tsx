"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, Users } from "lucide-react";
import { cn } from "@/lib/utils";
export function DashboardNav() {
  const pathname = usePathname();
  return <nav aria-label="Navigation principale" className="flex gap-1 md:flex-col">{[{ href: "/", title: "Accueil", Icon: House }, { href: "/contacts", title: "Contacts", Icon: Users }].map(({ href, title, Icon }) => <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined} className={cn("flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors hover:bg-border", pathname === href && "bg-accent")}><Icon className="size-4" aria-hidden="true" />{title}</Link>)}</nav>;
}
