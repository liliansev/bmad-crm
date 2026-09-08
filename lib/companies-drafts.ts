import { z } from 'zod';
import { companySchema, type Company, type CompanyCommand } from '@/lib/validations/companies';
const rawFields=z.object({name:z.string()});
const storedCommand=z.union([z.object({operation:z.literal('create'),command_id:z.uuid(),fields:rawFields}).strict(),z.object({operation:z.literal('update'),command_id:z.uuid(),company_id:z.uuid(),fields:rawFields,base_versions:z.object({name:z.number().int().positive()})}).strict()]);
const draftSchema=z.object({target:z.string(),generation:z.number().int().nonnegative(),values:rawFields,base:companySchema.nullable(),pending:z.object({command:storedCommand,generation:z.number().int().nonnegative(),values:rawFields}).nullable()});
export type CompanyDraft=z.infer<typeof draftSchema>;
const prefix=(owner:string)=>`crm:companies:draft:v1:${owner}:`;
export function freshDraft(target:string,base:Company|null):CompanyDraft{return {target,generation:0,values:{name:base?.name??''},base,pending:null};}
export function isDirty(draft:CompanyDraft){return Boolean(draft.pending||draft.values.name!==(draft.base?.name??''));}
export function writeDraft(owner:string,draft:CompanyDraft){try{sessionStorage.setItem(prefix(owner)+draft.target,JSON.stringify(draft));return true;}catch{return false;}}
export function removeDraft(owner:string,target:string){try{sessionStorage.removeItem(prefix(owner)+target);}catch{/* In-memory state remains available. */}}
export function readDraft(owner:string,target:string):CompanyDraft|null{try{const p=draftSchema.safeParse(JSON.parse(sessionStorage.getItem(prefix(owner)+target)??'null'));return p.success&&p.data.target===target?p.data:null;}catch{return null;}}
export function draftTargets(owner:string){try{return Object.keys(sessionStorage).filter(k=>k.startsWith(prefix(owner))).map(k=>k.slice(prefix(owner).length)).filter(target=>readDraft(owner,target)!==null);}catch{return [];}}
export function makeCommand(draft:CompanyDraft):CompanyCommand{if(draft.pending)return draft.pending.command;return draft.base?{operation:'update',command_id:crypto.randomUUID(),company_id:draft.base.id,fields:{name:draft.values.name.trim()},base_versions:{name:draft.base.field_versions.name}}:{operation:'create',command_id:crypto.randomUUID(),fields:{name:draft.values.name.trim()}};}
export function acknowledge(draft:CompanyDraft,company:Company):CompanyDraft{return {...draft,target:company.id,base:company,pending:null,values:{name:draft.pending&&draft.values.name===draft.pending.values.name?company.name:draft.values.name}};}
