import { z } from "zod";
const version = z.number().int().min(1).max(2147483646);
export const companyNameSchema = z.string().trim().min(1, "Indiquez un nom de société.").refine(value => !/[\u0000\uD800-\uDFFF]/u.test(value), "Ce texte contient un caractère non pris en charge.").refine(value => Array.from(value).length <= 200, "Maximum 200 caractères.");
export const companySchema = z.object({ id: z.uuid(), name: companyNameSchema, field_versions: z.object({ name: version }).strict(), revision: version, created_at: z.string(), updated_at: z.string() });
export const companyCommandSchema = z.discriminatedUnion("operation", [
 z.object({ operation: z.literal("create"), command_id: z.uuid(), fields: z.object({ name: companyNameSchema }).strict() }).strict(),
 z.object({ operation: z.literal("update"), command_id: z.uuid(), company_id: z.uuid(), fields: z.object({ name: companyNameSchema }).strict(), base_versions: z.object({ name: version }).strict() }).strict(),
]);
export const companyFailureSchema = z.object({ status: z.enum(["validation", "unauthenticated", "forbidden", "not_found", "unavailable"]), message: z.string() });
export const companyReadSchema = z.union([z.object({ status: z.literal("success"), company: companySchema }), companyFailureSchema]);
export const companyResultSchema = z.union([companyReadSchema, z.object({ status: z.literal("conflict"), company: companySchema, message: z.string() })]);
export const companiesPageSchema = z.union([z.object({ status: z.literal("success"), companies: z.array(companySchema), total: z.number().int().nonnegative(), page: version }), companyFailureSchema]);
export const companyContactsPageSchema = z.union([z.object({ status: z.literal("success"), contacts: z.array(z.object({id:z.uuid(),first_name:z.string(),last_name:z.string()})), total:z.number().int().nonnegative(),page:version }),companyFailureSchema]);
export const contactCompanySchema = z.object({contact_id:z.uuid(),company:z.object({id:z.uuid(),name:companyNameSchema}).nullable(),version});
export const contactCompanyReadSchema = z.union([z.object({status:z.literal("success"),relation:contactCompanySchema}),companyFailureSchema]);
export const contactCompanyCommandSchema = z.object({command_id:z.uuid(),contact_id:z.uuid(),company_id:z.uuid().nullable(),base_version:version}).strict();
export const contactCompanyResultSchema = z.union([contactCompanyReadSchema,z.object({status:z.literal("conflict"),relation:contactCompanySchema,message:z.string()})]);
export type Company=z.infer<typeof companySchema>;
export type CompanyCommand=z.infer<typeof companyCommandSchema>;
export type CompanyResult=z.infer<typeof companyResultSchema>;
export type CompanyReadResult=z.infer<typeof companyReadSchema>;
export type CompaniesPage=z.infer<typeof companiesPageSchema>;
export type CompanyContactsPage=z.infer<typeof companyContactsPageSchema>;
export type ContactCompany=z.infer<typeof contactCompanySchema>;
export type ContactCompanyCommand=z.infer<typeof contactCompanyCommandSchema>;
export type ContactCompanyResult=z.infer<typeof contactCompanyResultSchema>;
