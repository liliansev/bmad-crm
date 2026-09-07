import "server-only";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getServerEnv } from "@/lib/env";
import { contactSchema, type ContactReadResult, type ContactsPage } from "@/lib/validations/contacts";

export const CONTACT_PAGE_SIZE = 25;
const columns = "id,first_name,last_name,field_versions,revision,created_at,updated_at";

export async function contactsClient() {
  const client = await createClient({ writable: true });
  const { data, error } = await client.auth.getUser();
  if (error && (error.status === undefined || error.status >= 500)) return { status: "unavailable" as const, message: "La vérification de session est indisponible. Votre brouillon est conservé." };
  if (!data.user || error) return { status: "unauthenticated" as const, message: "Reconnectez-vous pour retrouver votre brouillon." };
  if (data.user.id !== getServerEnv().SUPABASE_OWNER_ID) return { status: "forbidden" as const, message: "Cet espace est privé." };
  return { status: "success" as const, client, ownerId: data.user.id };
}

export async function readContacts(page: number): Promise<ContactsPage> {
  try {
    const auth = await contactsClient();
    if (auth.status !== "success") return auth;
    const { data, error, count } = await auth.client.from("contacts").select(columns, { count: "exact" }).order("last_name").order("first_name").order("id").range((page - 1) * CONTACT_PAGE_SIZE, page * CONTACT_PAGE_SIZE - 1);
    if (error || count === null) return { status: "unavailable", message: "Impossible de charger les contacts. Réessayez." };
    return { status: "success", contacts: z.array(contactSchema).parse(data), total: count, page };
  } catch { return { status: "unavailable", message: "Impossible de charger les contacts. Réessayez." }; }
}

export async function readContact(id: string): Promise<ContactReadResult> {
  try {
    const auth = await contactsClient();
    if (auth.status !== "success") return auth;
    const { data, error } = await auth.client.from("contacts").select(columns).eq("id", id).maybeSingle();
    if (error) return { status: "unavailable", message: "Impossible de charger la fiche. Votre brouillon est conservé." };
    if (!data) return { status: "not_found", message: "Cette fiche n’existe pas ou n’est pas accessible." };
    return { status: "success", contact: contactSchema.parse(data) };
  } catch { return { status: "unavailable", message: "Impossible de charger la fiche. Réessayez." }; }
}
