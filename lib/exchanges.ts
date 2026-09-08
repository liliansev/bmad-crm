import 'server-only';
import {contactsClient} from '@/lib/contacts';
import {exchangesPageSchema,type ExchangesPage} from '@/lib/validations/exchanges';
export async function readExchanges(target:{contact_id:string}|{company_id:string},page:number):Promise<ExchangesPage>{
 try{const auth=await contactsClient();if(auth.status!=='success')return auth;const {data,error}=await auth.client.rpc('exchanges_read',{p_contact_id:'contact_id' in target?target.contact_id:null,p_company_id:'company_id' in target?target.company_id:null,p_page:page});if(error)throw error;return exchangesPageSchema.parse(data);}catch{return {status:'unavailable',message:'Historique indisponible. Réessayez.'};}
}
