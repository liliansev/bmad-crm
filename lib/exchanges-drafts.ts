import { z } from 'zod';
import { exchangeCreateCommandSchema,exchangeUpdateCommandSchema } from '@/lib/validations/exchanges';
import { parisLocalNow } from '@/lib/exchange-date';
const valuesSchema=z.object({local:z.string(),occurrence:z.string(),channel:z.enum(['','phone','email','video','other']),notes:z.string(),company_id:z.uuid().nullable()});
const draftSchema=z.object({contact_id:z.uuid(),generation:z.number().int().nonnegative(),values:valuesSchema,pending:z.object({command:exchangeCreateCommandSchema,generation:z.number().int().nonnegative()}).nullable()});
export type ExchangeDraft=z.infer<typeof draftSchema>;
const prefix=(owner:string)=>`crm:exchanges:draft:v1:${owner}:`;
export function freshExchangeDraft(contact_id:string,company_id:string|null):ExchangeDraft{return {contact_id,generation:0,values:{local:parisLocalNow(),occurrence:'',channel:'',notes:'',company_id},pending:null};}
export function exchangeDirty(draft:ExchangeDraft){return draft.generation>0||Boolean(draft.pending);}
export function writeExchangeDraft(owner:string,draft:ExchangeDraft){try{sessionStorage.setItem(prefix(owner)+draft.contact_id,JSON.stringify(draft));return true;}catch{return false;}}
export function removeExchangeDraft(owner:string,id:string){try{sessionStorage.removeItem(prefix(owner)+id);}catch{/* In-memory draft remains. */}}
export function readExchangeDraft(owner:string,id:string):ExchangeDraft|null{try{const parsed=draftSchema.safeParse(JSON.parse(sessionStorage.getItem(prefix(owner)+id)??'null'));return parsed.success&&parsed.data.contact_id===id?parsed.data:null;}catch{return null;}}
export function exchangeDraftTargets(owner:string){try{return Object.keys(sessionStorage).filter(k=>k.startsWith(prefix(owner))).map(k=>k.slice(prefix(owner).length)).filter(id=>readExchangeDraft(owner,id));}catch{return [];}}
export function acknowledgeExchange(draft:ExchangeDraft):ExchangeDraft{return draft.pending&&draft.generation===draft.pending.generation?freshExchangeDraft(draft.contact_id,draft.values.company_id):{...draft,pending:null};}

// Corrections use a separate namespace: creation v1 receipts and drafts stay intact.
import { exchangeSchema, type Exchange, type ExchangeField, type ExchangeUpdateCommand } from '@/lib/validations/exchanges';
const updateValuesSchema=valuesSchema.extend({contact_id:z.uuid()});
const generationSchema=z.number().int().nonnegative();
const generationsSchema=z.object({occurred_at:generationSchema,channel:generationSchema,notes:generationSchema,contact_id:generationSchema,company_id:generationSchema});
const updateDraftSchema=z.object({base:exchangeSchema,values:updateValuesSchema,generations:generationsSchema,pending:z.object({command:exchangeUpdateCommandSchema,generations:generationsSchema,confirmed:exchangeSchema.optional()}).nullable()});
export type ExchangeUpdateDraft=z.infer<typeof updateDraftSchema>;
export const EXCHANGE_EDIT_FIELDS:ExchangeField[]=['occurred_at','channel','notes','contact_id','company_id'];
export function updateExchangeValues(exchange:Exchange):ExchangeUpdateDraft['values']{return {contact_id:exchange.contact_id,company_id:exchange.company_id,local:parisLocalNow(new Date(exchange.occurred_at)),occurrence:new Date(exchange.occurred_at).toISOString().replace(/:\d{2}\.\d{3}Z$/,':00.000Z'),channel:exchange.channel,notes:exchange.notes};}
export function freshExchangeUpdate(exchange:Exchange):ExchangeUpdateDraft{return {base:exchange,values:updateExchangeValues(exchange),generations:{occurred_at:0,channel:0,notes:0,contact_id:0,company_id:0},pending:null};}
export function changedExchangeFields(draft:ExchangeUpdateDraft):ExchangeField[]{const original=updateExchangeValues(draft.base);return EXCHANGE_EDIT_FIELDS.filter(field=>field==='occurred_at'?draft.values.local!==original.local||draft.values.occurrence!==original.occurrence:draft.values[field]!==original[field]);}
export function exchangeUpdateDirty(draft:ExchangeUpdateDraft){return Boolean(draft.pending)||changedExchangeFields(draft).length>0;}
const updatePrefix=(owner:string)=>`crm:exchanges:update:v1:${owner}:`;
export function readExchangeUpdate(owner:string,id:string):ExchangeUpdateDraft|null{try{const parsed=updateDraftSchema.safeParse(JSON.parse(sessionStorage.getItem(updatePrefix(owner)+id)??'null'));return parsed.success&&parsed.data.base.id===id&&(!parsed.data.pending||parsed.data.pending.command.operation==='update'&&parsed.data.pending.command.exchange_id===id)?parsed.data:null;}catch{return null;}}
export function writeExchangeUpdate(owner:string,draft:ExchangeUpdateDraft){try{sessionStorage.setItem(updatePrefix(owner)+draft.base.id,JSON.stringify(draft));return true;}catch{return false;}}
export function removeExchangeUpdate(owner:string,id:string){try{sessionStorage.removeItem(updatePrefix(owner)+id);return true;}catch{return false;}}
export function exchangeUpdateTargets(owner:string){try{return Object.keys(sessionStorage).filter(key=>key.startsWith(updatePrefix(owner))).map(key=>key.slice(updatePrefix(owner).length)).filter(id=>readExchangeUpdate(owner,id));}catch{return [];}}
export function acknowledgeExchangeUpdate(draft:ExchangeUpdateDraft,confirmed:Exchange,actual:Exchange=confirmed):ExchangeUpdateDraft{
 const next=freshExchangeUpdate({...actual,field_versions:{...actual.field_versions}});
 for(const field of EXCHANGE_EDIT_FIELDS){
  if(draft.generations[field]!==draft.pending?.generations[field]){
   // A later local edit has not observed any write after its own command.
   const observed=draft.pending?.command.fields[field]!==undefined?confirmed:draft.base;
   Object.assign(next.base,{[field]:observed[field]});next.base.field_versions[field]=observed.field_versions[field];
   if(field==='occurred_at'){next.values.local=draft.values.local;next.values.occurrence=draft.values.occurrence;}else Object.assign(next.values,{[field]:draft.values[field]});
  }
 }
 return {...next,generations:draft.generations};
}
export function exchangeUpdateCommand(draft:ExchangeUpdateDraft,instant:string):ExchangeUpdateCommand{const fields:ExchangeUpdateCommand['fields']={},base_versions:ExchangeUpdateCommand['base_versions']={};for(const field of changedExchangeFields(draft)){Object.assign(fields,{[field]:field==='occurred_at'?instant:draft.values[field]});base_versions[field]=draft.base.field_versions[field];}return {operation:'update',command_id:crypto.randomUUID(),exchange_id:draft.base.id,fields,base_versions};}
/** Refresh untouched fields while retaining the original versions of local edits. */
export function revalidateExchangeUpdate(draft:ExchangeUpdateDraft,exchange:Exchange):ExchangeUpdateDraft{
 if(exchange.revision<draft.base.revision)return draft;
 const protectedFields=new Set<ExchangeField>([...changedExchangeFields(draft),...Object.keys(draft.pending?.command.fields??{}) as ExchangeField[]]);
 const next={...draft,base:{...exchange,field_versions:{...exchange.field_versions}},values:updateExchangeValues(exchange)};
 for(const field of protectedFields){Object.assign(next.base,{[field]:draft.base[field]});next.base.field_versions[field]=draft.base.field_versions[field];if(field==='occurred_at'){next.values.local=draft.values.local;next.values.occurrence=draft.values.occurrence;}else Object.assign(next.values,{[field]:draft.values[field]});}
 return next;
}
