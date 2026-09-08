"use server";
import { z } from "zod";
import { contactsClient, readContact, readContacts } from "@/lib/contacts";
import { CONTACT_FIELDS, contactTransportCommandSchema, contactResultSchema, legacyCommandSchema, legacyResultSchema, contactsPageInputSchema, type ContactResult, type ContactReadResult, type ContactsPage } from "@/lib/validations/contacts";

export async function listContactsAction(input: unknown): Promise<ContactsPage> {
  const parsed = contactsPageInputSchema.safeParse(input);
  if (!parsed.success) return { status: "unavailable", message: "Page non valide." };
  return readContacts(parsed.data.page);
}
export async function getContactAction(input: unknown): Promise<ContactReadResult> {
  const parsed = z.uuid().safeParse(input);
  if (!parsed.success) return { status: "not_found", message: "Fiche non valide." };
  return readContact(parsed.data);
}
export async function saveContactAction(input: unknown): Promise<ContactResult | z.infer<typeof legacyResultSchema>> {
  const isV2 = typeof input === "object" && input !== null && "version" in input;
  const parsed = (isV2 ? contactTransportCommandSchema : legacyCommandSchema).safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const field = CONTACT_FIELDS.find(field => issue?.path.includes(field));
    return { status: "validation", message: issue?.message ?? "Saisie non valide.", ...(isV2 && field ? { field } : {}) };
  }
  try {
    const auth = await contactsClient();
    if (auth.status !== "success") return auth;
    const { data, error } = await auth.client.rpc(isV2 ? "contact_command_v2" : "contact_command", { p_command: isV2 ? input : parsed.data });
    if (error) return { status: "unavailable", message: "La confirmation n’a pas été reçue. Réessayez la même commande pour vérifier l’enregistrement." };
    return (isV2 ? contactResultSchema : legacyResultSchema).parse(data);
  } catch { return { status: "unavailable", message: "La confirmation n’a pas été reçue. Votre saisie est conservée." }; }
}
