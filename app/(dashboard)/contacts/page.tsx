import type { Metadata } from "next";
import { requireOwner } from "@/lib/auth";
import { getServerEnv } from "@/lib/env";
import { readContacts } from "@/lib/contacts";
import { ContactsShell } from "@/components/contacts/contacts-shell";
import { z } from "zod";
export const metadata: Metadata = { title: "Contacts" };
const querySchema = z.object({ page: z.coerce.number().int().min(1).max(100000).catch(1), panel: z.union([z.uuid(), z.literal("new")]).optional().catch(undefined) });
export default async function ContactsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireOwner();
  const query = querySchema.parse(await searchParams);
  const initial = await readContacts(query.page);
  return <ContactsShell ownerId={getServerEnv().SUPABASE_OWNER_ID} initial={initial} initialPage={query.page} initialPanel={query.panel ?? null} />;
}
