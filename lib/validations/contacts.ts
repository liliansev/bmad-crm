import { z } from "zod";
import { CONTACT_NAME_DIGITS } from "./contact-name-digits";
import { contactTransportCommandSchema as legacyCommandSchema, contactSchema as legacyContactSchema, contactResultSchema as legacyResultSchema } from "./contacts-v1";
export { legacyCommandSchema, legacyContactSchema, legacyResultSchema };
export const CONTACT_FIELDS = ["first_name", "last_name", "email", "job_title", "linkedin_url", "notes"] as const;
export const FIELD_LABELS = { first_name: "Prénom", last_name: "Nom", email: "E-mail", job_title: "Titre professionnel", linkedin_url: "LinkedIn", notes: "Notes" } as const;
export const FIELD_LIMITS = { first_name: 200, last_name: 200, email: 254, job_title: 200, linkedin_url: 2048, notes: 20000 } as const;
const bounded = (limit: number) => z.string().refine(value => !/[\u0000\uD800-\uDFFF]/u.test(value), "Ce texte contient un caractère non pris en charge. Corrigez-le pour enregistrer.").refine(value => Array.from(value).length <= limit, `Maximum ${limit.toLocaleString("fr-FR")} caractères.`);
export const rawContactNameSchema = bounded(200);
export const emailSchema = z.string().trim().pipe(bounded(254)).refine(value => value === "" || z.email().safeParse(value).success, "Indiquez une adresse e-mail valide.");
export const linkedinSchema = z.string().trim().pipe(bounded(2048)).refine(value => { if (!value) return true; if (/[\\\s\x00-\x1f\x7f]/u.test(value)) return false; try { const url = new URL(value); return /^https?:\/\//i.test(value) && (url.protocol === "https:" || url.protocol === "http:") && Boolean(url.hostname); } catch { return false; } }, "Indiquez une URL absolue HTTP ou HTTPS.");
const storedFieldsSchema = z.object({ first_name: z.string().trim().pipe(bounded(200)), last_name: z.string().trim().pipe(bounded(200)), email: emailSchema, job_title: z.string().trim().pipe(bounded(200)), linkedin_url: linkedinSchema, notes: bounded(20000) }).strict();
// Only new names are constrained; stored contacts and immutable receipts remain readable.
const newNameSchema = z.string().trim().pipe(bounded(200)).refine(value => !CONTACT_NAME_DIGITS.test(value), "Le prénom et le nom ne doivent pas contenir de chiffres.");
export const contactFieldsSchema = storedFieldsSchema.extend({ first_name: newNameSchema, last_name: newNameSchema });
export function contactEditorSchema(base: { first_name: string; last_name: string } | null) {
  return storedFieldsSchema.superRefine((values, ctx) => {
    for (const field of ["first_name", "last_name"] as const) {
      if ((!base || values[field] !== base[field]) && CONTACT_NAME_DIGITS.test(values[field])) ctx.addIssue({ code: "custom", path: [field], message: "Le prénom et le nom ne doivent pas contenir de chiffres." });
    }
    if (!values.first_name && !values.last_name) ctx.addIssue({ code: "custom", path: ["first_name"], message: "Indiquez un prénom ou un nom." });
  });
}
export const rawContactFieldsSchema = z.object({ first_name: z.string(), last_name: z.string(), email: z.string(), job_title: z.string(), linkedin_url: z.string(), notes: z.string() }).strict();
export const contactNamesSchema = contactFieldsSchema.refine(v => Boolean(v.first_name || v.last_name), { message: "Indiquez un prénom ou un nom.", path: ["first_name"] });
const version = z.number().int().positive();
export const fieldVersionsSchema = z.object({ first_name: version, last_name: version, email: version, job_title: version, linkedin_url: version, notes: version }).strict();
export const detailsVersionsSchema = fieldVersionsSchema.omit({ first_name: true, last_name: true });
// Stored reads must remain recoverable even when a direct RPC accepted an exotic
// host that WHATWG URL rejects. The editor/commands keep full semantic validation;
// rendered links separately require linkedinSchema, never this storage schema.
const storedLinkedinSchema = bounded(2048).refine(value => value === "" || /^https?:\/\//i.test(value), "Protocole du lien stocké non valide.");
export const contactSchema = storedFieldsSchema.extend({ linkedin_url: storedLinkedinSchema, id: z.uuid(), field_versions: fieldVersionsSchema, revision: version, created_at: z.string(), updated_at: z.string() });
export const contactSummarySchema = contactSchema.omit({ notes: true }).extend({ last_interaction: z.string().nullable().optional(), company: z.object({ id: z.uuid(), name: z.string() }).nullable().optional() });
const patchSchema = contactFieldsSchema.partial().refine(v => Object.keys(v).length > 0, "Aucun champ modifié.");
export const contactCommandSchema = z.discriminatedUnion("operation", [
  z.object({ version: z.literal(2), operation: z.literal("create"), command_id: z.uuid(), fields: contactNamesSchema }).strict(),
  z.object({ version: z.literal(2), operation: z.literal("update"), command_id: z.uuid(), contact_id: z.uuid(), fields: patchSchema, base_versions: fieldVersionsSchema.partial() }).strict().refine(v => Object.keys(v.fields).sort().join() === Object.keys(v.base_versions).sort().join(), "Versions requises pour chaque champ modifié."),
]);
const transportPatchSchema = storedFieldsSchema.partial().refine(v => Object.keys(v).length > 0, "Aucun champ modifié.");
export const contactTransportCommandSchema = z.discriminatedUnion("operation", [
  z.object({ version: z.literal(2), operation: z.literal("create"), command_id: z.uuid(), fields: storedFieldsSchema.refine(v => Boolean(v.first_name || v.last_name), { message: "Indiquez un prénom ou un nom.", path: ["first_name"] }) }).strict(),
  z.object({ version: z.literal(2), operation: z.literal("update"), command_id: z.uuid(), contact_id: z.uuid(), fields: transportPatchSchema, base_versions: fieldVersionsSchema.partial() }).strict().refine(v => Object.keys(v.fields).sort().join() === Object.keys(v.base_versions).sort().join(), "Versions requises pour chaque champ modifié."),
]);
export const contactResultSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("success"), contact: contactSchema }),
  z.object({ status: z.literal("conflict"), contact: contactSchema, message: z.string(), fields: z.array(z.enum(CONTACT_FIELDS)) }),
  z.object({ status: z.enum(["validation", "unauthenticated", "forbidden", "not_found", "unavailable"]), message: z.string(), field: z.enum(CONTACT_FIELDS).optional() }),
]);
export const contactsPageInputSchema = z.object({ page: z.number().int().min(1).max(100000) }).strict();
export const duplicatesInputSchema = z.object({ email: emailSchema, exclude_id: z.uuid().nullable(), page: z.number().int().min(1).max(100000) }).strict();
export const duplicatesResultSchema = z.union([z.object({ status: z.literal("success"), contacts: z.array(z.object({ id: z.uuid(), first_name: z.string(), last_name: z.string() }).strict()), total: z.number().int().nonnegative(), page: z.number().int().positive() }), z.object({ status: z.enum(["validation", "unavailable", "unauthenticated", "forbidden"]), message: z.string() })]);
export type DuplicatesResult = z.infer<typeof duplicatesResultSchema>;
export type Contact = z.infer<typeof contactSchema>;
export type ContactSummary = z.infer<typeof contactSummarySchema>;
export type ContactFields = z.infer<typeof contactFieldsSchema>;
export type ContactCommand = z.infer<typeof contactCommandSchema> | z.infer<typeof legacyCommandSchema>;
export type ContactResult = z.infer<typeof contactResultSchema>;
export type ContactReadResult = { status: "success"; contact: Contact } | { status: "not_found" | "unavailable" | "unauthenticated" | "forbidden"; message: string };
export type ContactsPage = { status: "success"; contacts: ContactSummary[]; total: number; page: number } | { status: "unavailable" | "unauthenticated" | "forbidden"; message: string };
export const canonicalField = (field: keyof ContactFields, value: string) => field === "notes" ? value : value.trim();
