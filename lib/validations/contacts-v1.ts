import { z } from "zod";
import { CONTACT_NAME_DIGITS } from "./contact-name-digits";

// PostgreSQL char_length counts Unicode code points, including supplementary characters.
export const rawContactNameSchema = z.string().refine((value) => Array.from(value).length <= 200, "Maximum 200 caractères.");
const contactNameSchema = z.string().trim().pipe(rawContactNameSchema);
export const contactFieldsSchema = z.object({ first_name: contactNameSchema, last_name: contactNameSchema }).strict();
export const contactNamesSchema = contactFieldsSchema.refine((v) => Boolean(v.first_name || v.last_name), { message: "Indiquez un prénom ou un nom.", path: ["first_name"] });
export const fieldVersionsSchema = z.object({ first_name: z.number().int().positive(), last_name: z.number().int().positive() }).strict();
export const contactSchema = contactFieldsSchema.extend({ id: z.uuid(), field_versions: fieldVersionsSchema, revision: z.number().int().positive(), created_at: z.string(), updated_at: z.string() });
const patchSchema = contactFieldsSchema.partial().refine((v) => Object.keys(v).length > 0, "Aucun champ modifié.");
export const contactTransportCommandSchema = z.discriminatedUnion("operation", [
  z.object({ operation: z.literal("create"), command_id: z.uuid(), fields: contactNamesSchema }).strict(),
  z.object({ operation: z.literal("update"), command_id: z.uuid(), contact_id: z.uuid(), fields: patchSchema, base_versions: fieldVersionsSchema.partial() }).strict().refine((v) => Object.keys(v.fields).sort().join() === Object.keys(v.base_versions).sort().join(), "Versions requises pour chaque champ modifié."),
]);
const newFieldsSchema = contactFieldsSchema.extend({
  first_name: contactNameSchema.refine(value => !CONTACT_NAME_DIGITS.test(value), "Le prénom et le nom ne doivent pas contenir de chiffres."),
  last_name: contactNameSchema.refine(value => !CONTACT_NAME_DIGITS.test(value), "Le prénom et le nom ne doivent pas contenir de chiffres."),
});
export const contactCommandSchema = z.discriminatedUnion("operation", [
  z.object({ operation: z.literal("create"), command_id: z.uuid(), fields: newFieldsSchema.refine(v => Boolean(v.first_name || v.last_name), { message: "Indiquez un prénom ou un nom.", path: ["first_name"] }) }).strict(),
  z.object({ operation: z.literal("update"), command_id: z.uuid(), contact_id: z.uuid(), fields: newFieldsSchema.partial().refine(v => Object.keys(v).length > 0, "Aucun champ modifié."), base_versions: fieldVersionsSchema.partial() }).strict().refine((v) => Object.keys(v.fields).sort().join() === Object.keys(v.base_versions).sort().join(), "Versions requises pour chaque champ modifié."),
]);
export const contactResultSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("success"), contact: contactSchema }),
  z.object({ status: z.literal("conflict"), contact: contactSchema, message: z.string(), fields: z.array(z.enum(["first_name", "last_name"])) }),
  z.object({ status: z.enum(["validation", "unauthenticated", "forbidden", "not_found", "unavailable"]), message: z.string(), field: z.enum(["first_name", "last_name"]).optional() }),
]);
export const contactsPageInputSchema = z.object({ page: z.number().int().min(1).max(100000) }).strict();
export type Contact = z.infer<typeof contactSchema>;
export type ContactFields = z.infer<typeof contactFieldsSchema>;
export type ContactCommand = z.infer<typeof contactCommandSchema>;
export type ContactResult = z.infer<typeof contactResultSchema>;
export type ContactReadResult = { status: "success"; contact: Contact } | { status: "not_found" | "unavailable" | "unauthenticated" | "forbidden"; message: string };
export type ContactsPage = { status: "success"; contacts: Contact[]; total: number; page: number } | { status: "unavailable" | "unauthenticated" | "forbidden"; message: string };
