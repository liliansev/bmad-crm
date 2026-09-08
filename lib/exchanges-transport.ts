import { exchangesPageSchema, exchangeResultSchema, type ExchangeCommand, type ExchangeResult, type ExchangesPage } from '@/lib/validations/exchanges';
export async function fetchExchanges(target: {contact_id:string}|{company_id:string}, page:number):Promise<ExchangesPage> {
 try { const query=new URLSearchParams({...target,page:String(page)}); const response=await fetch(`/api/exchanges?${query}`,{cache:'no-store',credentials:'same-origin',signal:AbortSignal.timeout(15000)});return exchangesPageSchema.parse(await response.json()); }
 catch {return {status:'unavailable',message:'Historique indisponible. Réessayez.'};}
}
export async function sendExchangeCommand(command:ExchangeCommand):Promise<ExchangeResult> {
 try {const response=await fetch('/api/exchanges/command',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(command),signal:AbortSignal.timeout(15000)});return exchangeResultSchema.parse(await response.json());}
 catch{return {status:'unavailable',message:'Confirmation non reçue. Réessayez la même commande ; votre saisie est conservée.'};}
}
