"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { sessionStatusSchema } from "@/lib/validations/auth";
import { DashboardSkeleton } from "@/components/dashboard-skeleton";

export function SessionGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const contentRef = useRef<HTMLDivElement>(null);
  const [checking, setChecking] = useState(false);
  useEffect(() => {
    const lifecycle = new AbortController();
    let disposed = false;
    let leaving = false;
    let generation = 0;
    let active: AbortController | undefined;
    const invalidate = () => { generation++; active?.abort(); active = undefined; };
    const hide = () => {
      invalidate();
      // Keep the measured layout, but remove private content from view and accessibility.
      if (contentRef.current) {
        contentRef.current.style.visibility = "hidden";
        contentRef.current.inert = true;
      }
      document.documentElement.dataset.privateState = "checking";
      setChecking(true);
    };
    const leave = (reason: "expired" | "verification") => {
      if (disposed || leaving) return;
      leaving = true;
      hide();
      window.dispatchEvent(new Event("crm-session-expired"));
      window.location.replace(`/connexion?session=${reason}`);
    };
    const check = async (foreground: boolean) => {
      if (disposed || leaving || document.visibilityState === "hidden") return;
      if (!foreground && active) return;
      if (foreground) hide();
      const current = ++generation;
      active = new AbortController();
      const isCurrent = () => !disposed && !leaving && current === generation && document.visibilityState === "visible";
      try {
        const response = await fetch("/api/session", { cache: "no-store", credentials: "same-origin", signal: AbortSignal.any([active.signal, AbortSignal.timeout(45_000)]) });
        const payload = sessionStatusSchema.safeParse(await response.json());
        if (!isCurrent()) return;
        if (!response.ok || !payload.success || !payload.data.authenticated) {
          leave(response.status === 401 ? "expired" : "verification");
          return;
        }
        if (contentRef.current) {
          contentRef.current.style.visibility = "visible";
          contentRef.current.inert = false;
        }
        delete document.documentElement.dataset.privateState;
        setChecking(false);
        window.dispatchEvent(new Event("crm-session-ready"));
      } catch {
        if (isCurrent()) leave("verification");
      } finally {
        if (current === generation) active = undefined;
      }
    };
    const foregroundCheck = () => { check(true).catch(() => leave("verification")); };
    const backgroundCheck = () => { check(false).catch(() => leave("verification")); };
    const visibility = () => { if (document.visibilityState === "hidden") hide(); else foregroundCheck(); };
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") leave("expired");
      else if (event === "TOKEN_REFRESHED" || event === "SIGNED_IN") backgroundCheck();
    });
    window.addEventListener("crm-session-denied", () => leave("expired"), { signal: lifecycle.signal });
    window.addEventListener("focus", foregroundCheck);
    window.addEventListener("pageshow", foregroundCheck);
    window.addEventListener("pagehide", hide);
    document.addEventListener("visibilitychange", visibility);
    const interval = window.setInterval(backgroundCheck, 30_000);
    foregroundCheck();
    return () => {
      disposed = true;
      lifecycle.abort();
      delete document.documentElement.dataset.privateState;
      invalidate();
      subscription.unsubscribe();
      window.clearInterval(interval);
      window.removeEventListener("focus", foregroundCheck);
      window.removeEventListener("pageshow", foregroundCheck);
      window.removeEventListener("pagehide", hide);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, []);
  return <div className="relative">
    {checking ? <div role="status" className="absolute inset-0"><span className="sr-only">Vérification de votre session…</span><DashboardSkeleton section={pathname === "/contacts" ? "contacts" : "home"} /></div> : null}
    <div ref={contentRef} data-session-content>{children}</div>
  </div>;
}
