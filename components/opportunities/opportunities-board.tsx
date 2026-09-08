'use client';
import {useCallback,useSyncExternalStore} from 'react';
import {Button} from '@/components/ui/button';
import {Card} from '@/components/ui/card';
import {Label} from '@/components/ui/label';
import {Input} from '@/components/ui/input';
import {Textarea} from '@/components/ui/textarea';
import {Skeleton} from '@/components/ui/skeleton';
import {type OpportunityStore} from '@/lib/opportunities-cache';
import {OPPORTUNITY_STAGE_LABELS,opportunityStageSchema,type Opportunity} from '@/lib/validations/opportunities';

function OpportunityCard({item,store,selected,onOpen,onPrefetch}:{item:Opportunity;store:OpportunityStore;selected:boolean;onOpen:()=>void;onPrefetch:()=>void}){
 const subscribe=useCallback((listener:()=>void)=>store.subscribe(item.id,listener),[store,item.id]);
 const state=useSyncExternalStore(subscribe,()=>store.get(item.id),()=>store.get(item.id));
 const save=(field:'amount_cents'|'notes')=>store.save(item.id,[field]).catch(()=>undefined);
 return <Card data-opportunity-id={item.id} className={`min-w-0 gap-2 p-3 shadow-none ${selected?'border-ring':''}`} onMouseEnter={onPrefetch}>
  <Button variant="ghost" className="h-auto min-h-11 justify-start whitespace-normal px-0 text-left [overflow-wrap:anywhere]" aria-label={`Ouvrir ${state.draft.values.title}`} onFocus={onPrefetch} onClick={onOpen}>{state.draft.values.title}</Button>
  <Label className="text-xs text-muted-foreground" htmlFor={`card-amount-${item.id}`}>Montant EUR HT</Label>
  <Input id={`card-amount-${item.id}`} className="min-h-11 min-w-0 text-base" inputMode="decimal" placeholder="Non renseigné" value={state.draft.values.amount_cents} onChange={event=>store.change(item.id,'amount_cents',event.target.value)} onBlur={()=>save('amount_cents')} aria-invalid={Boolean(state.errors.amount_cents)} aria-describedby={`card-error-amount-${item.id}`}/>
  <p id={`card-error-amount-${item.id}`} className="text-xs text-destructive" role={state.errors.amount_cents?'alert':undefined}>{state.errors.amount_cents}</p>
  <Label className="text-xs text-muted-foreground" htmlFor={`card-notes-${item.id}`}>Notes</Label>
  <Textarea id={`card-notes-${item.id}`} className="h-20 min-h-20 min-w-0 resize-y text-base [field-sizing:fixed]" placeholder="Ajouter des notes" value={state.draft.values.notes} onChange={event=>store.change(item.id,'notes',event.target.value)} onBlur={()=>save('notes')} aria-invalid={Boolean(state.errors.notes)} aria-describedby={`card-error-notes-${item.id}`}/>
  <p id={`card-error-notes-${item.id}`} className="text-xs text-destructive" role={state.errors.notes?'alert':undefined}>{state.errors.notes}</p>
  {state.message?<p role="status" className="text-xs [overflow-wrap:anywhere]">{state.message}</p>:null}
  {state.conflict||state.draft.pending&&!state.busy||state.storageError?<Button variant="outline" className="min-h-11 whitespace-normal" onClick={onOpen}>Reprendre dans la fiche</Button>:null}
 </Card>;
}
export function OpportunitiesBoard({items,store,selected,mounted,onOpen,onPrefetch}:{items:Opportunity[];store:OpportunityStore;selected:string|null;mounted:boolean;onOpen:(id:string)=>void;onPrefetch:(id:string)=>void}){
 // The existing global page is authoritative; column counts deliberately describe this page only.
 if(mounted)for(const item of items)store.ensure(item.id,item);
 return <div className="min-w-0 overflow-x-auto pb-3" aria-label="Kanban des opportunités"><div className="grid min-w-[1160px] grid-cols-5 gap-3">
 {opportunityStageSchema.options.map(stage=>{const cards=items.filter(item=>item.stage===stage);return <section key={stage} data-stage={stage} className="min-w-0 rounded-md bg-muted p-2"><header className="mb-3 min-h-14 px-1"><h2 className="text-sm font-semibold">{OPPORTUNITY_STAGE_LABELS[stage]}</h2><p className="mt-1 text-xs text-muted-foreground">{cards.length} sur cette page</p></header><div className="space-y-2">{cards.length?cards.map(item=>mounted?<OpportunityCard key={item.id} item={item} store={store} selected={selected===item.id} onOpen={()=>onOpen(item.id)} onPrefetch={()=>onPrefetch(item.id)}/>:<Skeleton key={item.id} className="h-64 w-full"/>):<p className="px-1 py-8 text-xs text-muted-foreground">Aucune opportunité sur cette page.</p>}</div></section>;})}
 </div></div>;
}
