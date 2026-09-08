import { redirect } from "next/navigation";
import { requireOwner } from "@/lib/auth";

export default async function HomePage() {
  await requireOwner();
  redirect("/pipeline");
}
