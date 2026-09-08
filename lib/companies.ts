import "server-only";
import { contactsClient } from "@/lib/contacts";
import { companySchema, companiesPageSchema, companyContactsPageSchema, contactCompanyReadSchema, type CompaniesPage, type CompanyReadResult, type CompanyContactsPage } from "@/lib/validations/companies";
const unavailable = { status: "unavailable" as const, message: "Lecture indisponible. Votre saisie est conservée." };
export async function readCompanies(page: number): Promise<CompaniesPage> {
 try {const auth=await contactsClient();if(auth.status!=="success")return auth;
 const {data,error,count}=await auth.client.from("companies").select("id,name,field_versions,revision,created_at,updated_at",{count:"exact"}).order("name").order("id").range((page-1)*25,page*25-1);
 if(error||count===null)return unavailable;return companiesPageSchema.parse({status:"success",companies:data,total:count,page});}catch{return unavailable;}
}
export async function readCompany(id:string):Promise<CompanyReadResult>{
 try{const auth=await contactsClient();if(auth.status!=="success")return auth;const {data,error}=await auth.client.from("companies").select("id,name,field_versions,revision,created_at,updated_at").eq("id",id).maybeSingle();if(error)return unavailable;if(!data)return {status:"not_found",message:"Cette société n’existe pas ou n’est pas accessible."};return {status:"success",company:companySchema.parse(data)};}catch{return unavailable;}
}
export async function readCompanyContacts(id:string,page:number):Promise<CompanyContactsPage>{
 try{const auth=await contactsClient();if(auth.status!=="success")return auth;const existence=await auth.client.from("companies").select("id").eq("id",id).maybeSingle();if(existence.error)return unavailable;if(!existence.data)return {status:"not_found",message:"Cette société n’existe pas ou n’est pas accessible."};const {data,error,count}=await auth.client.from("contacts").select("id,first_name,last_name",{count:"exact"}).eq("company_id",id).order("last_name").order("first_name").order("id").range((page-1)*25,page*25-1);if(error||count===null)return unavailable;return companyContactsPageSchema.parse({status:"success",contacts:data,total:count,page});}catch{return unavailable;}
}
export async function readContactCompany(id:string){try{const auth=await contactsClient();if(auth.status!=="success")return auth;const {data,error}=await auth.client.rpc("contact_company_read",{p_contact_id:id});if(error)return unavailable;return contactCompanyReadSchema.parse(data);}catch{return unavailable;}}
