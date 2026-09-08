import 'server-only';
import { contactsClient } from '@/lib/contacts';
import { opportunityReadSchema,opportunitiesPageSchema,type OpportunityReadResult,type OpportunitiesPage } from '@/lib/validations/opportunities';
const unavailable={status:'unavailable' as const,message:'Lecture indisponible. Votre saisie est conservée.'};
export async function readOpportunity(id:string):Promise<OpportunityReadResult>{try{const auth=await contactsClient();if(auth.status!=='success')return auth;const {data,error}=await auth.client.rpc('opportunity_read',{p_id:id});if(error)return unavailable;return opportunityReadSchema.parse(data);}catch{return unavailable;}}
export async function readOpportunities(page:number,context?:{contact_id?:string;company_id?:string}):Promise<OpportunitiesPage>{try{const auth=await contactsClient();if(auth.status!=='success')return auth;const {data,error}=await auth.client.rpc('opportunities_page',{p_page:page,p_contact_id:context?.contact_id??null,p_company_id:context?.company_id??null});if(error)return unavailable;return opportunitiesPageSchema.parse(data);}catch{return unavailable;}}
