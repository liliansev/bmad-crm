import { z } from "zod";
import { contactCommandSchema, contactSchema, rawContactNameSchema, type Contact, type ContactCommand, type ContactFields } from "@/lib/validations/contacts";

const draftSchema = z.object({ target: z.string(), generation: z.number().int().nonnegative(), values: z.object({ first_name: rawContactNameSchema, last_name: rawContactNameSchema }), base: contactSchema.nullable(), pending: z.object({ command: contactCommandSchema, generation: z.number().int().nonnegative(), values: z.object({ first_name: rawContactNameSchema, last_name: rawContactNameSchema }) }).nullable() });
export type ContactDraft = z.infer<typeof draftSchema>;
const prefix = (owner: string) => `crm:contacts:draft:v1:${owner}:`;
export function freshDraft(target: string, base: Contact | null): ContactDraft {
  return { target, generation: 0, values: { first_name: base?.first_name ?? "", last_name: base?.last_name ?? "" }, base, pending: null };
}
export function writeDraft(owner: string, draft: ContactDraft): boolean {
  try { sessionStorage.setItem(prefix(owner) + draft.target, JSON.stringify(draft)); return true; } catch { return false; }
}
export function readDraft(owner: string, target: string): ContactDraft | null {
  try { const value = JSON.parse(sessionStorage.getItem(prefix(owner) + target) ?? "null"); const parsed = draftSchema.safeParse(value); return parsed.success && parsed.data.target === target ? parsed.data : null; } catch { return null; }
}
export function removeDraft(owner: string, target: string) { try { sessionStorage.removeItem(prefix(owner) + target); } catch { /* In-memory draft remains usable when storage is unavailable. */ } }
export function draftTargets(owner: string): string[] {
  try { return Object.keys(sessionStorage).filter((key) => key.startsWith(prefix(owner))).map((key) => key.slice(prefix(owner).length)).filter((target) => readDraft(owner, target) !== null); } catch { return []; }
}
export function isDirty(draft: ContactDraft) {
  return Boolean(draft.pending || draft.values.first_name !== (draft.base?.first_name ?? "") || draft.values.last_name !== (draft.base?.last_name ?? ""));
}
export function makeCommand(draft: ContactDraft): ContactCommand {
  if (draft.pending) return draft.pending.command;
  if (!draft.base) return { operation: "create", command_id: crypto.randomUUID(), fields: { ...draft.values } };
  const fields: Partial<ContactFields> = {};
  const base_versions: Partial<Contact["field_versions"]> = {};
  for (const field of ["first_name", "last_name"] as const) {
    if (draft.values[field].trim() !== draft.base[field]) { fields[field] = draft.values[field]; base_versions[field] = draft.base.field_versions[field]; }
  }
  return { operation: "update", command_id: crypto.randomUUID(), contact_id: draft.base.id, fields, base_versions };
}
// Only the acknowledged generation can be cleared. Later typing is rebased onto
// the committed versions, and unchanged fields pick up canonical server values.
export function acknowledge(draft: ContactDraft, contact: Contact): ContactDraft {
  const pending = draft.pending;
  const values = { ...draft.values };
  for (const field of ["first_name", "last_name"] as const) if (pending && draft.values[field] === pending.values[field]) values[field] = contact[field];
  return { ...draft, target: contact.id, values, base: contact, pending: null };
}
