import {z} from 'zod';
import {opportunitySchema,opportunityCommandSchema,opportunityStageSchema,opportunityFieldsSchema,decimalToCents,centsToDecimal,type Opportunity,type OpportunityField,type OpportunityStage,type OpportunityCommand} from '@/lib/validations/opportunities';
export type OpportunityEditField=OpportunityField|'stage';
export const OPPORTUNITY_FIELDS:OpportunityField[]=['title','amount_cents','notes','company_id','primary_contact_id'];
export const OPPORTUNITY_EDIT_FIELDS:OpportunityEditField[]=[...OPPORTUNITY_FIELDS,'stage'];
const valuesSchema=z.object({title:z.string(),amount_cents:z.string(),notes:z.string(),company_id:z.uuid().nullable(),primary_contact_id:z.uuid().nullable(),stage:opportunityStageSchema});
const generation=z.number().int().nonnegative();
const generationsSchema=z.object({title:generation,amount_cents:generation,notes:generation,company_id:generation,primary_contact_id:generation,stage:generation});
const draftSchema=z.object({target:z.string(),base:opportunitySchema.nullable(),values:valuesSchema,initial:valuesSchema,generations:generationsSchema,pending:z.object({command:opportunityCommandSchema,generations:generationsSchema,confirmed:opportunitySchema.optional()}).nullable()});
export type OpportunityDraft=z.infer<typeof draftSchema>;
export function opportunityValues(value:Opportunity):OpportunityDraft['values']{return {title:value.title,amount_cents:centsToDecimal(value.amount_cents),notes:value.notes,company_id:value.company_id,primary_contact_id:value.primary_contact_id,stage:value.stage};}
export function freshOpportunityDraft(target:string,base:Opportunity|null,context:{contact_id?:string;company_id?:string}={}):OpportunityDraft{const values=base?opportunityValues(base):{title:'',amount_cents:'',notes:'',company_id:context.company_id??null,primary_contact_id:context.contact_id??null,stage:'qualifying' as const};return {target,base:base?{...base,field_versions:{...base.field_versions}}:null,values,initial:{...values},generations:{title:0,amount_cents:0,notes:0,company_id:0,primary_contact_id:0,stage:0},pending:null};}
export function canonicalOpportunityValue(field:OpportunityEditField,values:OpportunityDraft['values']){if(field==='amount_cents'){try{return decimalToCents(values.amount_cents);}catch{return values.amount_cents;}}if(field==='title')return values.title.trim();return values[field];}
export function changedOpportunityFields(draft:OpportunityDraft):OpportunityEditField[]{return OPPORTUNITY_EDIT_FIELDS.filter(field=>canonicalOpportunityValue(field,draft.values)!==(draft.base?draft.base[field]:canonicalOpportunityValue(field,draft.initial)));}
export function opportunityDirty(draft:OpportunityDraft){return Boolean(draft.pending)||changedOpportunityFields(draft).length>0;}
const prefix=(owner:string)=>`crm:opportunities:draft:v1:${owner}:`;
export function writeOpportunityDraft(owner:string,draft:OpportunityDraft){try{sessionStorage.setItem(prefix(owner)+draft.target,JSON.stringify(draft));return true;}catch{return false;}}
export function removeOpportunityDraft(owner:string,target:string){try{sessionStorage.removeItem(prefix(owner)+target);return true;}catch{return false;}}
export function readOpportunityDraft(owner:string,target:string):OpportunityDraft|null{try{const direct=draftSchema.safeParse(JSON.parse(sessionStorage.getItem(prefix(owner)+target)??'null'));if(direct.success&&direct.data.target===target)return direct.data;for(const key of Object.keys(sessionStorage).filter(key=>key.startsWith(prefix(owner)))){const parsed=draftSchema.safeParse(JSON.parse(sessionStorage.getItem(key)??'null'));if(parsed.success&&parsed.data.base?.id===target)return parsed.data;}return null;}catch{return null;}}
export function opportunityDraftTargets(owner:string){try{return Object.keys(sessionStorage).filter(key=>key.startsWith(prefix(owner))).map(key=>key.slice(prefix(owner).length)).filter(target=>readOpportunityDraft(owner,target));}catch{return [];}}
export function commandOpportunityFields(command:OpportunityCommand):OpportunityEditField[]{return command.operation==='transition'?['stage']:Object.keys(command.fields) as OpportunityField[];}
export function acknowledgeOpportunity(draft:OpportunityDraft,receipt:Opportunity,actual:Opportunity=receipt):OpportunityDraft{
 const next=freshOpportunityDraft(draft.target,actual);const sent=commandOpportunityFields(draft.pending!.command);
 for(const field of OPPORTUNITY_EDIT_FIELDS){if(draft.generations[field]===draft.pending?.generations[field]&&(sent.includes(field)||!changedOpportunityFields(draft).includes(field)))continue;Object.assign(next.values,{[field]:draft.values[field]});const observed=sent.includes(field)?receipt:draft.base;if(observed){Object.assign(next.base!,{[field]:observed[field]});if(field==='stage')next.base!.workflow_revision=observed.workflow_revision;else next.base!.field_versions[field]=observed.field_versions[field];}}
 return {...next,generations:{...draft.generations}};
}
export function revalidateOpportunity(draft:OpportunityDraft,actual:Opportunity):OpportunityDraft{
 if(!draft.base||actual.revision<draft.base.revision)return draft;
 const protectedFields=new Set([...changedOpportunityFields(draft),...(draft.pending?commandOpportunityFields(draft.pending.command):[])]);const next={...draft,base:{...actual,field_versions:{...actual.field_versions}},values:opportunityValues(actual)};
 for(const field of protectedFields){Object.assign(next.values,{[field]:draft.values[field]});Object.assign(next.base,{[field]:draft.base[field]});if(field==='stage')next.base.workflow_revision=draft.base.workflow_revision;else next.base.field_versions[field]=draft.base.field_versions[field];}return next;
}
export class OpportunityInputError extends Error {constructor(public field:OpportunityEditField,message:string){super(message);}}
function parseField(field: OpportunityField, draft: OpportunityDraft) {
  try {
    const value = field === 'amount_cents'
      ? decimalToCents(draft.values.amount_cents)
      : draft.values[field];
    return opportunityFieldsSchema.shape[field].parse(value);
  } catch (error) {
    const message = error instanceof z.ZodError
      ? error.issues[0]?.message ?? 'Valeur invalide.'
      : error instanceof Error ? error.message : 'Valeur invalide.';
    throw new OpportunityInputError(field, message);
  }
}

function makeCreateOpportunityCommand(
  draft: OpportunityDraft,
): Extract<OpportunityCommand, {operation: 'create'}> {
  const values = Object.fromEntries(
    OPPORTUNITY_FIELDS.map(field => [field, parseField(field, draft)]),
  );
  const fields = opportunityFieldsSchema.parse(values);
  return {operation: 'create', command_id: crypto.randomUUID(), fields};
}

export function makeOpportunityCommand(draft:OpportunityDraft,requested:OpportunityEditField[]):OpportunityCommand|null{
 if(draft.pending)return draft.pending.command;
 if(!draft.base)return makeCreateOpportunityCommand(draft);
 const changed=changedOpportunityFields(draft).filter(field=>requested.includes(field));if(!changed.length)return null;
 const first=changed[0];if(first==='stage')return {operation:'transition',command_id:crypto.randomUUID(),opportunity_id:draft.base.id,stage:draft.values.stage,base_workflow_revision:draft.base.workflow_revision};
 const fields:Extract<OpportunityCommand,{operation:'update'}>['fields']={},base_versions:Partial<Record<OpportunityField,number>>={};for(const field of changed.filter((field):field is OpportunityField=>field!=='stage')){Object.assign(fields,{[field]:parseField(field,draft)});base_versions[field]=draft.base.field_versions[field];}return {operation:'update',command_id:crypto.randomUUID(),opportunity_id:draft.base.id,fields,base_versions};
}
