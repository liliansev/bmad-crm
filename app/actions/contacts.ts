"use server";
import { z } from "zod";
import { contactsClient, readContact, readContacts } from "@/lib/contacts";
import { contactCommandSchema, contactResultSchema, contactsPageInputSchema, type ContactResult, type ContactReadResult, type ContactsPage } from "@/lib/validations/contacts";

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
export async function saveContactAction(input: unknown): Promise<ContactResult> {
  const parsed = contactCommandSchema.safeParse(input);
  if (!parsed.success) return { status: "validation", message: parsed.error.issues[0]?.message ?? "Saisie non valide." };
  try {
    const auth = await contactsClient();
    if (auth.status !== "success") return auth;
    const { data, error } = await auth.client.rpc("contact_command", { p_command: parsed.data });
    if (error) return { status: "unavailable", message: "La confirmation n’a pas été reçue. Réessayez la même commande pour vérifier l’enregistrement." };
    return contactResultSchema.parse(data);
  } catch { return { status: "unavailable", message: "La confirmation n’a pas été reçue. Votre saisie est conservée." }; }
}
