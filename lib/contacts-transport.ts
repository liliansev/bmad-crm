import { contactResultSchema, type ContactCommand, type ContactResult } from "@/lib/validations/contacts";
export async function sendContactCommand(command: ContactCommand): Promise<ContactResult> {
  const signal = AbortSignal.timeout(15_000);
  try {
    const response = await fetch("/api/contacts/command", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify(command), signal });
    return contactResultSchema.parse(await response.json());
  } catch {
    return { status: "unavailable", message: signal.aborted ? "La confirmation prend trop de temps. Votre saisie est conservée ; réessayez la même commande." : "La confirmation n’a pas été reçue. Votre saisie est conservée. Réessayez pour vérifier l’enregistrement." };
  }
}

import { z } from "zod";
import { contactSchema, type ContactReadResult, type ContactsPage } from "@/lib/validations/contacts";
const readFailureSchema = z.object({ status: z.enum(["unavailable", "unauthenticated", "forbidden", "not_found"]), message: z.string() });
const contactReadSchema = z.union([z.object({ status: z.literal("success"), contact: contactSchema }), readFailureSchema]);
const contactsPageSchema = z.union([z.object({ status: z.literal("success"), contacts: z.array(contactSchema), total: z.number().int().nonnegative(), page: z.number().int().positive() }), z.object({ status: z.enum(["unavailable", "unauthenticated", "forbidden"]), message: z.string() })]);
export async function fetchContact(id: string): Promise<ContactReadResult> {
  try { const response = await fetch(`/api/contacts?id=${encodeURIComponent(id)}`, { cache: "no-store", credentials: "same-origin", signal: AbortSignal.timeout(15_000) }); return contactReadSchema.parse(await response.json()); }
  catch { return { status: "unavailable", message: "Impossible de charger la fiche. Votre saisie est conservée. Réessayez." }; }
}
export async function fetchContacts(page: number): Promise<ContactsPage> {
  try { const response = await fetch(`/api/contacts?page=${page}`, { cache: "no-store", credentials: "same-origin", signal: AbortSignal.timeout(15_000) }); return contactsPageSchema.parse(await response.json()); }
  catch { return { status: "unavailable", message: "Impossible de charger les contacts. Votre saisie est conservée. Réessayez." }; }
}
