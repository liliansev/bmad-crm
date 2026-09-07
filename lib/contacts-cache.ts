import type { Contact, ContactReadResult } from "@/lib/validations/contacts";

// One instance per authenticated shell. Never a module-global, cross-owner cache.
export function createContactsCache(ownerId: string) {
  const entries = new Map<string, Contact>();
  const pending = new Map<string, Promise<ContactReadResult>>();
  let epoch = 0;
  return {
    ownerId,
    get(id: string) { return entries.get(id); },
    put(contact: Contact) { if ((entries.get(contact.id)?.revision ?? 0) <= contact.revision) entries.set(contact.id, contact); },
    clear() { epoch++; entries.clear(); pending.clear(); },
    async load(id: string, loader: (id: string) => Promise<ContactReadResult>) {
      const existing = pending.get(id);
      if (existing) return existing;
      const started = epoch;
      const request = loader(id).then((result): ContactReadResult => {
        if (started !== epoch) return { status: "unauthenticated", message: "Session terminée." };
        if (result.status === "success") {
          const cached = entries.get(id);
          if (!cached || cached.revision <= result.contact.revision) entries.set(id, result.contact);
          else return { status: "success", contact: cached };
        }
        return result;
      }).finally(() => { if (pending.get(id) === request) pending.delete(id); });
      pending.set(id, request);
      return request;
    },
  };
}
