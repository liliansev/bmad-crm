'use server';
import {contactsClient} from '@/lib/contacts';
import {exchangeCommandSchema,exchangeResultSchema,type ExchangeResult} from '@/lib/validations/exchanges';
export async function saveExchangeAction(input:unknown):Promise<ExchangeResult>{
 const parsed=exchangeCommandSchema.safeParse(input);if(!parsed.success)return {status:'validation',message:parsed.error.issues[0]?.message??'Commande invalide.',...(parsed.error.issues[0]?.path.includes('occurred_at')?{field:'occurred_at' as const}:{})};
 try{const auth=await contactsClient();if(auth.status!=='success')return auth;const {data,error}=await auth.client.rpc('exchange_command',{p_command:parsed.data});if(error)throw error;return exchangeResultSchema.parse(data);}catch{return {status:'unavailable',message:'Confirmation non reçue. Réessayez la même commande ; votre saisie est conservée.'};}
}
