'use server';
import { contactsClient } from '@/lib/contacts';
import { opportunityCommandSchema,opportunityResultSchema,type OpportunityResult } from '@/lib/validations/opportunities';
export async function saveOpportunityAction(input:unknown):Promise<OpportunityResult>{const parsed=opportunityCommandSchema.safeParse(input);if(!parsed.success)return {status:'validation',message:parsed.error.issues[0]?.message??'Commande invalide.'};try{const auth=await contactsClient();if(auth.status!=='success')return auth;const {data,error}=await auth.client.rpc('opportunity_command',{p_command:parsed.data});if(error)throw error;return opportunityResultSchema.parse(data);}catch{return {status:'unavailable',message:'Confirmation indisponible. Réessayez la même commande.'};}}
