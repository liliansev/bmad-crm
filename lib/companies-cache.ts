import type { Company, CompanyReadResult } from "@/lib/validations/companies";

// One instance per authenticated shell. Never a module-global, cross-owner cache.
export function createCompaniesCache(ownerId: string) {
  const entries = new Map<string, Company>();
  const pending = new Map<string, Promise<CompanyReadResult>>();
  let epoch = 0;
  return {
    ownerId,
    get(id: string) { return entries.get(id); },
    put(company: Company) { if ((entries.get(company.id)?.revision ?? 0) <= company.revision) entries.set(company.id, company); },
    clear() { epoch++; entries.clear(); pending.clear(); },
    async load(id: string, loader: (id: string) => Promise<CompanyReadResult>) {
      const existing = pending.get(id);
      if (existing) return existing;
      const started = epoch;
      const request = loader(id).then((result): CompanyReadResult => {
        if (started !== epoch) return { status: "unauthenticated", message: "Session terminée." };
        if (result.status === "success") {
          const cached = entries.get(id);
          if (!cached || cached.revision <= result.company.revision) entries.set(id, result.company);
          else return { status: "success", company: cached };
        }
        return result;
      }).finally(() => { if (pending.get(id) === request) pending.delete(id); });
      pending.set(id, request);
      return request;
    },
  };
}
