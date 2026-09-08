import "server-only";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getServerEnv } from "@/lib/env";
import { contactSchema, contactSummarySchema, detailsVersionsSchema, duplicatesResultSchema, type DuplicatesResult, type ContactReadResult, type ContactsPage } from "@/lib/validations/contacts";

export const CONTACT_PAGE_SIZE = 25;
const columns = "id,first_name,last_name,email,job_title,linkedin_url,field_versions,details_versions,revision,created_at,updated_at";
function projectContact(value: unknown) {
  const parsed = z.object({ field_versions: z.record(z.string(), z.unknown()), details_versions: detailsVersionsSchema }).passthrough().parse(value);
  const { details_versions, ...rest } = parsed;
  return { ...rest, field_versions: { ...parsed.field_versions, ...details_versions } };
}

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
    const { data, error, count } = await auth.client.from("contacts").select(`${columns},company:companies!contacts_company_owner_fk(id,name)`, { count: "exact" }).order("last_name").order("first_name").order("id").range((page - 1) * CONTACT_PAGE_SIZE, page * CONTACT_PAGE_SIZE - 1);
    if (error || count === null) return { status: "unavailable", message: "Impossible de charger les contacts. Réessayez." };
    const contacts = z.array(z.unknown()).parse(data).map(value => contactSummarySchema.parse(projectContact(value)));
    const projection = await auth.client.rpc("contacts_last_interactions", { p_ids: contacts.map(contact => contact.id) });
    if (projection.error) return { status: "unavailable", message: "Impossible de charger les dernières interactions. Réessayez." };
    const dates = z.record(z.uuid(), z.string().nullable()).parse(projection.data);
    return { status: "success", contacts: contacts.map(contact => ({ ...contact, last_interaction: dates[contact.id] ?? null })), total: count, page };
  } catch { return { status: "unavailable", message: "Impossible de charger les contacts. Réessayez." }; }
}

export async function readContact(id: string): Promise<ContactReadResult> {
  try {
    const auth = await contactsClient();
    if (auth.status !== "success") return auth;
    const { data, error } = await auth.client.from("contacts").select(`${columns},notes`).eq("id", id).maybeSingle();
    if (error) return { status: "unavailable", message: "Impossible de charger la fiche. Votre brouillon est conservé." };
    if (!data) return { status: "not_found", message: "Cette fiche n’existe pas ou n’est pas accessible." };
    return { status: "success", contact: contactSchema.parse(projectContact(data)) };
  } catch { return { status: "unavailable", message: "Impossible de charger la fiche. Réessayez." }; }
}

export async function readEmailDuplicates(email: string, excludeId: string | null, page: number): Promise<DuplicatesResult> {
  try {
    const auth = await contactsClient();
    if (auth.status !== "success") return auth;
    const { data, error } = await auth.client.rpc("contact_email_duplicates", { p_email: email, p_exclude_id: excludeId, p_page: page });
    if (error) return { status: "unavailable", message: "La vérification des doublons est indisponible. Vous pouvez enregistrer." };
    return duplicatesResultSchema.parse(data);
  } catch { return { status: "unavailable", message: "La vérification des doublons est indisponible. Vous pouvez enregistrer." }; }
}
