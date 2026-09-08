import { z } from 'zod';
import { exchangeCommandSchema } from '@/lib/validations/exchanges';
import { parisLocalNow } from '@/lib/exchange-date';
const valuesSchema=z.object({local:z.string(),occurrence:z.string(),channel:z.enum(['','phone','email','video','other']),notes:z.string(),company_id:z.uuid().nullable()});
const draftSchema=z.object({contact_id:z.uuid(),generation:z.number().int().nonnegative(),values:valuesSchema,pending:z.object({command:exchangeCommandSchema,generation:z.number().int().nonnegative()}).nullable()});
export type ExchangeDraft=z.infer<typeof draftSchema>;
const prefix=(owner:string)=>`crm:exchanges:draft:v1:${owner}:`;
export function freshExchangeDraft(contact_id:string,company_id:string|null):ExchangeDraft{return {contact_id,generation:0,values:{local:parisLocalNow(),occurrence:'',channel:'',notes:'',company_id},pending:null};}
export function exchangeDirty(draft:ExchangeDraft){return draft.generation>0||Boolean(draft.pending);}
export function writeExchangeDraft(owner:string,draft:ExchangeDraft){try{sessionStorage.setItem(prefix(owner)+draft.contact_id,JSON.stringify(draft));return true;}catch{return false;}}
export function removeExchangeDraft(owner:string,id:string){try{sessionStorage.removeItem(prefix(owner)+id);}catch{/* In-memory draft remains. */}}
export function readExchangeDraft(owner:string,id:string):ExchangeDraft|null{try{const parsed=draftSchema.safeParse(JSON.parse(sessionStorage.getItem(prefix(owner)+id)??'null'));return parsed.success&&parsed.data.contact_id===id?parsed.data:null;}catch{return null;}}
export function exchangeDraftTargets(owner:string){try{return Object.keys(sessionStorage).filter(k=>k.startsWith(prefix(owner))).map(k=>k.slice(prefix(owner).length)).filter(id=>readExchangeDraft(owner,id));}catch{return [];}}
export function acknowledgeExchange(draft:ExchangeDraft):ExchangeDraft{return draft.pending&&draft.generation===draft.pending.generation?freshExchangeDraft(draft.contact_id,draft.values.company_id):{...draft,pending:null};}
