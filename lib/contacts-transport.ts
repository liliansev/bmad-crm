import { contactResultSchema, legacyResultSchema, duplicatesResultSchema, type DuplicatesResult, type ContactCommand, type ContactResult } from "@/lib/validations/contacts";
export async function sendContactCommand(command: ContactCommand): Promise<ContactResult> {
  const signal = AbortSignal.timeout(15_000);
  try {
    const response = await fetch("/api/contacts/command", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify(command), signal });
    const data: unknown = await response.json();
    if ("version" in command) return contactResultSchema.parse(data);
    const result = legacyResultSchema.parse(data);
    if (result.status !== "success" && result.status !== "conflict") return result;
    // A historical receipt cannot attest to newly introduced fields.
    const actual = await fetchContact(result.contact.id);
    if (actual.status === "unauthenticated" || actual.status === "forbidden") return actual;
    if (actual.status !== "success") return { status: "unavailable", message: "Commande ancienne reçue ; la fiche doit encore être relue. Réessayez la confirmation." };
    if (result.status === "success") return actual;
    const fields = command.operation === "update"
      ? (["first_name", "last_name"] as const).filter(field => field in command.fields && command.base_versions[field] !== actual.contact.field_versions[field])
      : result.fields;
    return { ...result, fields, contact: actual.contact };
  } catch {
    return { status: "unavailable", message: signal.aborted ? "La confirmation prend trop de temps. Votre saisie est conservée ; réessayez la même commande." : "La confirmation n’a pas été reçue. Votre saisie est conservée. Réessayez pour vérifier l’enregistrement." };
  }
}

import { z } from "zod";
import { contactSchema, contactSummarySchema, type ContactReadResult, type ContactsPage } from "@/lib/validations/contacts";
const readFailureSchema = z.object({ status: z.enum(["unavailable", "unauthenticated", "forbidden", "not_found"]), message: z.string() });
const contactReadSchema = z.union([z.object({ status: z.literal("success"), contact: contactSchema }), readFailureSchema]);
const contactsPageSchema = z.union([z.object({ status: z.literal("success"), contacts: z.array(contactSummarySchema), total: z.number().int().nonnegative(), page: z.number().int().positive() }), z.object({ status: z.enum(["unavailable", "unauthenticated", "forbidden"]), message: z.string() })]);
export async function fetchContact(id: string): Promise<ContactReadResult> {
  try { const response = await fetch(`/api/contacts?version=2&id=${encodeURIComponent(id)}`, { cache: "no-store", credentials: "same-origin", signal: AbortSignal.timeout(15_000) }); return contactReadSchema.parse(await response.json()); }
  catch { return { status: "unavailable", message: "Impossible de charger la fiche. Votre saisie est conservée. Réessayez." }; }
}
export async function fetchContacts(page: number): Promise<ContactsPage> {
  try { const response = await fetch(`/api/contacts?version=2&page=${page}`, { cache: "no-store", credentials: "same-origin", signal: AbortSignal.timeout(15_000) }); return contactsPageSchema.parse(await response.json()); }
  catch { return { status: "unavailable", message: "Impossible de charger les contacts. Votre saisie est conservée. Réessayez." }; }
}

export async function fetchEmailDuplicates(email: string, excludeId: string | null, page: number): Promise<DuplicatesResult> {
  try {
    const response = await fetch("/api/contacts/duplicates", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, exclude_id: excludeId, page }), cache: "no-store", signal: AbortSignal.timeout(15000) });
    return duplicatesResultSchema.parse(await response.json());
  } catch { return { status: "unavailable", message: "La vérification des doublons est indisponible. Vous pouvez enregistrer." }; }
}
