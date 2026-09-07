import { ContactsSkeleton } from "@/components/dashboard-skeleton";
export default function ContactsLoading() {
  return <div role="status" aria-label="Chargement des contacts"><ContactsSkeleton /></div>;
}
