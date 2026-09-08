import {type Opportunity,type OpportunityReadResult,type OpportunityResult} from '@/lib/validations/opportunities';
import {fetchOpportunity,sendOpportunityCommand,type OpportunityContext} from '@/lib/opportunities-transport';
import {OpportunityInputError,acknowledgeOpportunity,changedOpportunityFields,commandOpportunityFields,freshOpportunityDraft,makeOpportunityCommand,opportunityDirty,readOpportunityDraft,removeOpportunityDraft,revalidateOpportunity,writeOpportunityDraft,OPPORTUNITY_EDIT_FIELDS,type OpportunityDraft,type OpportunityEditField} from '@/lib/opportunities-drafts';
export type OpportunityEditorState={draft:OpportunityDraft;busy:boolean;message:string;errors:Partial<Record<OpportunityEditField,string>>;storageError:boolean;cleanupBlocked:boolean;conflict:Extract<OpportunityResult,{status:'conflict'}>|null};
type Entry={state:OpportunityEditorState;listeners:Set<()=>void>;queue:Set<OpportunityEditField>;running:Promise<boolean>|null};
export function createOpportunitiesCache(ownerId:string){const values=new Map<string,Opportunity>(),pending=new Map<string,Promise<OpportunityReadResult>>();let epoch=0;return {ownerId,get:(id:string)=>values.get(id),put:(item:Opportunity)=>{if((values.get(item.id)?.revision??0)<=item.revision)values.set(item.id,item);},clear:()=>{epoch++;values.clear();pending.clear();},async load(id:string,loader=fetchOpportunity){if(pending.has(id))return pending.get(id)!;const started=epoch;const request=loader(id).then(result=>{if(started!==epoch)return {status:'unauthenticated' as const,message:'Session terminée.'};if(result.status==='success'){const cached=values.get(id);if(cached&&cached.revision>result.opportunity.revision)return {status:'success' as const,opportunity:cached};values.set(id,result.opportunity);}return result;}).finally(()=>{if(pending.get(id)===request)pending.delete(id);});pending.set(id,request);return request;}};}
/** One owner-scoped entity store for panel and future card consumers. */
export function createOpportunityStore(ownerId:string,onConfirmed:(opportunity:Opportunity,target:string)=>void=()=>undefined,transport={send:sendOpportunityCommand,read:fetchOpportunity}){
 const entries=new Map<string,Entry>();let allowed=true;
 const emit=(entry:Entry,patch:Partial<OpportunityEditorState>)=>{entry.state={...entry.state,...patch};entry.listeners.forEach(listener=>listener());};
 const persist=(entry:Entry,draft:OpportunityDraft)=>{let storageError=false,cleanupBlocked=entry.state.cleanupBlocked;if(opportunityDirty(draft))storageError=!writeOpportunityDraft(ownerId,draft);else {cleanupBlocked=!removeOpportunityDraft(ownerId,draft.target);storageError=cleanupBlocked;}emit(entry,{draft,storageError:storageError||cleanupBlocked,cleanupBlocked});};
 const ensure=(target:string,base:Opportunity|null,context:OpportunityContext={})=>{let entry=entries.get(target)??[...entries.values()].find(entry=>entry.state.draft.base?.id===target);if(entry&&base===null&&target.startsWith('new')&&entry.state.draft.base&&!entry.state.busy&&!opportunityDirty(entry.state.draft)&&!entry.state.cleanupBlocked)entry=undefined;if(!entry){const draft=readOpportunityDraft(ownerId,target)??freshOpportunityDraft(target,base,context);entry={state:{draft,busy:false,message:'',errors:{},storageError:false,cleanupBlocked:false,conflict:null},listeners:new Set(),queue:new Set(),running:null};}entries.set(target,entry);return entry;};
 const denied=(status:string)=>{if(status==='unauthenticated'||status==='forbidden'){allowed=false;window.dispatchEvent(new Event('crm-session-denied'));return true;}return false;};
 type PendingCommand = NonNullable<OpportunityDraft['pending']>;
 type Preparation =
  | {status: 'ready'; pending: PendingCommand}
  | {status: 'unchanged'}
  | {status: 'invalid'};

 const preparePendingCommand = (entry: Entry, requested: OpportunityEditField[]): Preparation => {
  if (entry.state.draft.pending) return {status: 'ready', pending: entry.state.draft.pending};

  let command;
  try {
   command = makeOpportunityCommand(entry.state.draft, requested);
  } catch (error) {
   const field = error instanceof OpportunityInputError
    ? error.field
    : requested.find(field => changedOpportunityFields(entry.state.draft).includes(field)) ?? 'title';
   emit(entry, {
    errors: {[field]: error instanceof Error ? error.message : 'Valeur invalide.'},
    message: 'Corrigez le champ indiqué. Votre saisie est conservée.',
   });
   entry.queue.clear();
   return {status: 'invalid'};
  }

  if (!command) {
   if (entry.state.cleanupBlocked && !removeOpportunityDraft(ownerId, entry.state.draft.target)) {
    emit(entry, {message: 'Brouillon non effacé du stockage. Gardez la fiche ouverte.'});
    return {status: 'invalid'};
   }
   emit(entry, {cleanupBlocked: false, storageError: false});
   return {status: 'unchanged'};
  }

  if (command.operation === 'update' && requested.includes('stage') && changedOpportunityFields(entry.state.draft).includes('stage')) {
   entry.queue.add('stage');
  }
  const pending = {command, generations: {...entry.state.draft.generations}};
  persist(entry, {...entry.state.draft, pending});
  return {status: 'ready', pending};
 };

 const sendPendingCommand = (entry: Entry, pending: PendingCommand) => {
  emit(entry, {busy: true, message: 'Enregistrement…', errors: {}});
  return transport.send(pending.command);
 };

 const acceptCommandResult = (entry: Entry, pending: PendingCommand, result: OpportunityResult) => {
  if (result.status === 'success') window.dispatchEvent(new Event('crm-data-changed'));
  if (!allowed || denied(result.status)) return false;
  if (result.status === 'success') return true;

  if (result.status !== 'unavailable') persist(entry, {...entry.state.draft, pending: null});
  emit(entry, {
   message: result.message,
   conflict: result.status === 'conflict'
    ? {...result, conflicting_fields: result.conflicting_fields ?? commandOpportunityFields(pending.command)}
    : null,
   errors: result.status === 'validation' && result.field ? {[result.field]: result.message} : {},
  });
  entry.queue.clear();
  return false;
 };

 const readSavedOpportunity = (entry: Entry, pending: PendingCommand, receipt: Opportunity) => {
  persist(entry, {...entry.state.draft, pending: {...pending, confirmed: receipt}});
  return transport.read(receipt.id);
 };

 const confirmSavedOpportunity = (
  entry: Entry,
  receipt: Opportunity,
  actual: Opportunity,
  resuming: boolean,
  requested: OpportunityEditField[],
  requestedGenerations: OpportunityDraft['generations'],
 ) => {
  const next = acknowledgeOpportunity(entry.state.draft, receipt, actual);
  if (!opportunityDirty(next) && !removeOpportunityDraft(ownerId, next.target)) {
   emit(entry, {cleanupBlocked: true, storageError: true, message: 'Brouillon non effacé du stockage. Réessayez la confirmation.'});
   entry.queue.clear();
   return false;
  }

  persist(entry, next);
  if (resuming) {
   for (const field of changedOpportunityFields(next)) {
    if (requested.includes(field) && next.generations[field] <= requestedGenerations[field]) entry.queue.add(field);
   }
  }
  entries.set(actual.id, entry);
  onConfirmed(actual, next.target);
  window.dispatchEvent(new Event('crm-data-changed'));
  emit(entry, {message: opportunityDirty(next)
   ? 'Enregistrement confirmé. Une nouvelle saisie reste à enregistrer.'
   : 'Opportunité enregistrée.'});
  return true;
 };

 const process = async (entry: Entry): Promise<boolean> => {
  while (entry.queue.size || entry.state.draft.pending) {
   if (!allowed || entry.state.conflict) return false;
   const requested = [...entry.queue];
   const requestedGenerations = {...entry.state.draft.generations};
   const resuming = Boolean(entry.state.draft.pending);
   entry.queue.clear();

   const prepared = preparePendingCommand(entry, requested);
   if (prepared.status === 'invalid') return false;
   if (prepared.status === 'unchanged') continue;
   const {pending} = prepared;

   const result = await sendPendingCommand(entry, pending);
   if (!acceptCommandResult(entry, pending, result) || result.status !== 'success') return false;

   const receipt = pending.confirmed ?? result.opportunity;
   const read = await readSavedOpportunity(entry, pending, receipt);
   if (!allowed || denied(read.status)) return false;
   if (read.status !== 'success') {
    emit(entry, {message: 'Commande reçue. Relecture indisponible ; réessayez la confirmation.'});
    entry.queue.clear();
    return false;
   }
   if (!confirmSavedOpportunity(entry, receipt, read.opportunity, resuming, requested, requestedGenerations)) return false;
  }
  return !opportunityDirty(entry.state.draft) && !entry.state.cleanupBlocked;
 };
 const save=(target:string,fields:OpportunityEditField[]=OPPORTUNITY_EDIT_FIELDS):Promise<boolean>=>{const entry=entries.get(target);if(!entry||!allowed)return Promise.resolve(false);fields.forEach(field=>entry.queue.add(field));if(entry.running)return entry.running;entry.running=process(entry).catch(()=>{entry.queue.clear();emit(entry,{message:'Confirmation indisponible. Votre saisie est conservée.'});return false;}).finally(()=>{entry.running=null;emit(entry,{busy:false});});return entry.running;};
 return {ownerId,ensure:(target:string,base:Opportunity|null,context?:OpportunityContext)=>ensure(target,base,context).state,get:(target:string)=>entries.get(target)!.state,subscribe:(target:string,listener:()=>void)=>{const entry=entries.get(target)!;entry.listeners.add(listener);return()=>{entry.listeners.delete(listener);};},
  change(target:string,field:OpportunityEditField,value:string|null){const entry=entries.get(target)!;const draft=entry.state.draft;persist(entry,{...draft,values:{...draft.values,[field]:value},generations:{...draft.generations,[field]:draft.generations[field]+1}});emit(entry,{message:'Saisie non confirmée.',errors:{...entry.state.errors,[field]:undefined}});},save,
  refresh(target:string,actual:Opportunity){const entry=entries.get(target);if(entry&&!entry.state.busy)persist(entry,revalidateOpportunity(entry.state.draft,actual));},
  revalidate(target:string,actual:Opportunity){const entry=entries.get(target);if(entry&&!entry.state.busy)persist(entry,revalidateOpportunity(entry.state.draft,actual));},
  discard(target:string){const entry=entries.get(target);if(!entry||entry.state.busy)return false;if(!removeOpportunityDraft(ownerId,entry.state.draft.target)){emit(entry,{cleanupBlocked:true,storageError:true,message:'Brouillon non effacé du stockage. Gardez la fiche ouverte.'});return false;}const draft=entry.state.draft;emit(entry,{draft:freshOpportunityDraft(draft.target,draft.base),conflict:null,errors:{},message:'',storageError:false,cleanupBlocked:false});entry.queue.clear();return true;},
  resolve(target:string,choices:Partial<Record<OpportunityEditField,'mine'|'server'>>){const entry=entries.get(target)!;const conflict=entry.state.conflict;if(!conflict)return;const fields=conflict.conflicting_fields??commandOpportunityFields(entry.state.draft.pending!.command);if(fields.some(field=>!choices[field]))return;const current=entry.state.draft;const next=freshOpportunityDraft(current.target,conflict.opportunity);for(const field of OPPORTUNITY_EDIT_FIELDS){if(choices[field]==='mine'||(changedOpportunityFields(current).includes(field)&&choices[field]!=='server')){Object.assign(next.values,{[field]:current.values[field]});if(!fields.includes(field)&&current.base){Object.assign(next.base!,{[field]:current.base[field]});if(field==='stage')next.base!.workflow_revision=current.base.workflow_revision;else next.base!.field_versions[field]=current.base.field_versions[field];}}}persist(entry,{...next,generations:current.generations});emit(entry,{conflict:null,message:'Choix préparés. Enregistrez pour confirmer.'});},
  dirty:(target:string)=>{const state=entries.get(target)?.state;return Boolean(state&&(opportunityDirty(state.draft)||state.cleanupBlocked));},busy:(target:string)=>Boolean(entries.get(target)?.state.busy),expire(){allowed=false;},
 };
}
export type OpportunityStore=ReturnType<typeof createOpportunityStore>;
