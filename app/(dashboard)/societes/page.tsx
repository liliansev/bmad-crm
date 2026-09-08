import { redirect } from "next/navigation";
import { requireOwner } from "@/lib/auth";

export default async function CompaniesPage() {
  await requireOwner();
  redirect("/pipeline");
}
