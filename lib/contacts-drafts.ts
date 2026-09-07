import { z } from "zod";
import { CONTACT_FIELDS, canonicalField, contactSchema, legacyCommandSchema, legacyContactSchema, rawContactFieldsSchema, type Contact, type ContactCommand, type ContactFields } from "@/lib/validations/contacts";

// Validate without transforming commands: an already pending v1 fingerprint is immutable.
const storedCommandShape = z.union([
  z.object({ operation: z.literal("create"), command_id: z.uuid(), fields: z.record(z.string(), z.string()), version: z.literal(2).optional() }).strict(),
  z.object({ operation: z.literal("update"), command_id: z.uuid(), contact_id: z.uuid(), fields: z.record(z.string(), z.string()), base_versions: z.record(z.string(), z.number().int().positive()), version: z.literal(2).optional() }).strict(),
]);
// Storage validation is structural. Tightened write rules must not erase an old
// pending command or its editable raw values on restore.
const preservedCommandSchema = z.custom<ContactCommand>(value => storedCommandShape.safeParse(value).success);
const draftSchema = z.object({ version: z.literal(2), target: z.string(), generation: z.number().int().nonnegative(), values: rawContactFieldsSchema, base: contactSchema.nullable(), legacy_base: legacyContactSchema.nullable().optional(), pending: z.object({ command: preservedCommandSchema, generation: z.number().int().nonnegative(), values: rawContactFieldsSchema }).nullable() });
const legacyDraftSchema = z.object({ target: z.string(), generation: z.number().int().nonnegative(), values: z.object({ first_name: z.string(), last_name: z.string() }), base: legacyContactSchema.nullable(), pending: z.object({ command: z.custom<z.infer<typeof legacyCommandSchema>>(value => legacyCommandSchema.safeParse(value).success), generation: z.number().int().nonnegative(), values: z.object({ first_name: z.string(), last_name: z.string() }) }).nullable() });
export type ContactDraft = z.infer<typeof draftSchema>;
const prefix = (owner: string, version = 2) => `crm:contacts:draft:v${version}:${owner}:`;
const emptyDetails = { email: "", job_title: "", linkedin_url: "", notes: "" };
export function freshDraft(target: string, base: Contact | null): ContactDraft {
  return { version: 2, target, generation: 0, values: Object.fromEntries(CONTACT_FIELDS.map(field => [field, base?.[field] ?? ""])) as ContactFields, base, pending: null };
}
export function writeDraft(owner: string, draft: ContactDraft): boolean {
  try { sessionStorage.setItem(prefix(owner) + draft.target, JSON.stringify(draft)); sessionStorage.removeItem(prefix(owner, 1) + draft.target); return true; } catch { return false; }
}
export function readDraft(owner: string, target: string): ContactDraft | null {
  try {
    const parsed = draftSchema.safeParse(JSON.parse(sessionStorage.getItem(prefix(owner) + target) ?? "null"));
    if (parsed.success && parsed.data.target === target) return parsed.data;
    const legacy = legacyDraftSchema.safeParse(JSON.parse(sessionStorage.getItem(prefix(owner, 1) + target) ?? "null"));
    if (!legacy.success || legacy.data.target !== target) return null;
    const old = legacy.data;
    return { version: 2, target, generation: old.generation, values: { ...emptyDetails, ...old.values }, base: null, legacy_base: old.base, pending: old.pending ? { ...old.pending, values: { ...emptyDetails, ...old.pending.values } } : null };
  } catch { return null; }
}
// Only a real detail read may supply new fields to a 2.1 draft.
export function connectLegacyDraft(draft: ContactDraft, contact: Contact | null): ContactDraft {
  if (!draft.legacy_base || !contact || draft.legacy_base.id !== contact.id) return draft;
  const details = { email: contact.email, job_title: contact.job_title, linkedin_url: contact.linkedin_url, notes: contact.notes };
  return { ...draft, legacy_base: undefined, base: { ...contact, first_name: draft.legacy_base.first_name, last_name: draft.legacy_base.last_name, field_versions: { ...contact.field_versions, ...draft.legacy_base.field_versions } }, values: { ...draft.values, ...details }, pending: draft.pending ? { ...draft.pending, values: { ...draft.pending.values, ...details } } : null };
}
export function removeDraft(owner: string, target: string) { try { sessionStorage.removeItem(prefix(owner) + target); sessionStorage.removeItem(prefix(owner, 1) + target); } catch { /* The in-memory draft remains usable. */ } }
export function draftTargets(owner: string): string[] {
  try { return [...new Set(Object.keys(sessionStorage).flatMap(key => [1, 2].filter(version => key.startsWith(prefix(owner, version))).map(version => key.slice(prefix(owner, version).length))))].filter(target => readDraft(owner, target) !== null); } catch { return []; }
}
export function isDirty(draft: ContactDraft) { return Boolean(draft.pending || draft.legacy_base || CONTACT_FIELDS.some(field => draft.values[field] !== (draft.base?.[field] ?? ""))); }
export function makeCommand(draft: ContactDraft): ContactCommand {
  if (draft.pending) return draft.pending.command;
  if (draft.legacy_base) throw new Error("La fiche doit être relue avant de reprendre la saisie.");
  if (!draft.base) return { version: 2, operation: "create", command_id: crypto.randomUUID(), fields: { ...draft.values } };
  const fields: Partial<ContactFields> = {};
  const base_versions: Partial<Contact["field_versions"]> = {};
  for (const field of CONTACT_FIELDS) if (canonicalField(field, draft.values[field]) !== draft.base[field]) { fields[field] = draft.values[field]; base_versions[field] = draft.base.field_versions[field]; }
  return { version: 2, operation: "update", command_id: crypto.randomUUID(), contact_id: draft.base.id, fields, base_versions };
}
export function acknowledge(draft: ContactDraft, contact: Contact): ContactDraft {
  const pending = draft.pending;
  const values = { ...draft.values };
  for (const field of CONTACT_FIELDS) if (pending && draft.values[field] === pending.values[field]) values[field] = contact[field];
  return { ...draft, target: contact.id, values, base: contact, legacy_base: undefined, pending: null };
}
