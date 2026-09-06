import { HomeSkeleton } from "@/components/dashboard-skeleton";
export default function Loading() {
  return <div role="status"><span className="sr-only">Chargement de l’accueil…</span><HomeSkeleton /></div>;
}
