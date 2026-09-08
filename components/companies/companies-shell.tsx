"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { type ExchangeEditorHandle } from "@/components/exchanges/exchange-editor";
import { OpportunityLinks } from "@/components/opportunities/opportunity-links";
import { ExchangeHistory } from "@/components/exchanges/exchange-history";
import { CompanyEditor, type EditorHandle } from "@/components/companies/company-editor";
import { fetchCompany, fetchCompanies, fetchCompanyContacts } from "@/lib/companies-transport";
import { createCompaniesCache } from "@/lib/companies-cache";
import { draftTargets, readDraft } from "@/lib/companies-drafts";
import { type Company, type CompanyReadResult, type CompaniesPage, type CompanyContactsPage } from "@/lib/validations/companies";

type NavigationTarget = { panel: string | null; page: number };
type Props = { ownerId: string; initial: CompaniesPage; initialPage: number; initialPanel: string | null };
function writeUrl(panel: string | null, page: number) {
  const url = new URL(window.location.href);
  if (panel) url.searchParams.set("panel", panel); else url.searchParams.delete("panel");
  if (page > 1) url.searchParams.set("page", String(page)); else url.searchParams.delete("page");
  window.history.replaceState(null, "", url);
}
export function CompaniesShell({ ownerId, initial, initialPage, initialPanel }: Props) {
  const router = useRouter();
  const [cache] = useState(() => createCompaniesCache(ownerId));
  const [list, setList] = useState<CompaniesPage>(initial);
  const [page, setPage] = useState(initialPage);
  const pageRef = useRef(page);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string | null>(initialPanel);
  const selectedRef = useRef(selected);
  const [editorTarget, setEditorTarget] = useState(initialPanel);
  const [editorKey, setEditorKey] = useState(0);
  const [panel, setPanel] = useState<CompanyReadResult | null>(() => initialPanel && cache.get(initialPanel) ? { status: "success", company: cache.get(initialPanel)! } : null);
  const [panelError, setPanelError] = useState("");
  const [drafts, setDrafts] = useState<string[]>([]);
  const listGeneration = useRef(0);
  const panelGeneration = useRef(0);
  const permitted = useRef(true);
  const lifecycle = useRef(0);
  const pendingNavigation = useRef<NavigationTarget | null>(null);
  const pendingHref = useRef<string | null>(null);
  const applyNavigation = useRef<((destination: NavigationTarget) => void) | null>(null);
  const editor = useRef<EditorHandle | null>(null);
  const companyEditor = useRef<EditorHandle | null>(null);
  const exchangeHistory = useRef<ExchangeEditorHandle | null>(null);
  const [exchangeClosing,setExchangeClosing]=useState(false),[exchangeBusy,setExchangeBusy]=useState(false);
  const exchangeDialog=useRef<HTMLDivElement>(null);
  const cancelExchangeClose=()=>{setExchangeClosing(false);pendingNavigation.current=null;pendingHref.current=null;};
  editor.current={requestClose:()=>{if(exchangeHistory.current?.busy()||exchangeHistory.current?.dirty())setExchangeClosing(true);else if(companyEditor.current)companyEditor.current.requestClose();else close();}};
  const returnFocus = useRef<HTMLElement | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const addRef = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => {
    if (exchangeHistory.current?.busy() || exchangeHistory.current?.dirty()) { setExchangeClosing(true); return; }
    panelGeneration.current++;
    setSelected(null); selectedRef.current = null; setPanel(null); editor.current = null; companyEditor.current = null; exchangeHistory.current = null;
    writeUrl(null, pageRef.current); setDrafts(draftTargets(ownerId));
    const destination = pendingNavigation.current; pendingNavigation.current = null;
    const href = pendingHref.current; pendingHref.current = null;
    if (href) router.push(href); else if (destination) applyNavigation.current?.(destination);
  }, [ownerId, router]);
  const denied = (status: string) => { if (status === "unauthenticated" || status === "forbidden") window.dispatchEvent(new Event("crm-session-denied")); };
  const refreshList = useCallback(async (requested = pageRef.current) => {
    const generation = ++listGeneration.current;
    setLoading(true);
    let result: CompaniesPage;
    try { result = await fetchCompanies(requested); }
    catch { result = { status: "unavailable", message: "Impossible de charger les sociétés. Votre brouillon est conservé." }; }
    if (!permitted.current || generation !== listGeneration.current) return;
    if (result.status === "success") {
      // List summaries never seed the complete-detail cache.
      const lastPage = Math.max(1, Math.ceil(result.total / 25));
      if (requested > lastPage) { pageRef.current = lastPage; setPage(lastPage); writeUrl(selectedRef.current, lastPage); await refreshList(lastPage); return; }
    } else denied(result.status);
    setList(result); setLoading(false);
  }, [cache]);
  const refreshPanel = useCallback(async (id: string) => {
    if (id === "new") return;
    const generation = ++panelGeneration.current;
    let result: CompanyReadResult;
    try { result = await cache.load(id, fetchCompany); }
    catch { result = { status: "unavailable", message: "Impossible de charger la fiche. Réessayez." }; }
    if (!permitted.current || generation !== panelGeneration.current || id !== selectedRef.current) return;
    denied(result.status);
    if (result.status === "success") { setPanelError(""); setPanel(result); }
    else { setPanelError(result.message); setPanel((previous) => previous?.status === "success" ? previous : result); }
  }, [cache]);
  const open = useCallback((id: string) => {
    returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    companyEditor.current = null; exchangeHistory.current = null;
    selectedRef.current = id; setSelected(id); setEditorTarget(id); setEditorKey((key) => key + 1);
    setPanelError("");
    const seed = cache.get(id); setPanel(seed ? { status: "success", company: seed } : null);
    writeUrl(id, pageRef.current);
    refreshPanel(id).catch(() => setPanel({ status: "unavailable", message: "Impossible de charger la fiche." }));
  }, [cache, refreshPanel]);
  const prefetch = useCallback((id: string) => { const started = lifecycle.current; cache.load(id, fetchCompany).then((result) => { if (permitted.current && started === lifecycle.current) denied(result.status); }).catch(() => undefined); }, [cache]);
  applyNavigation.current = (destination) => {
    if (destination.page !== pageRef.current) { pageRef.current = destination.page; setPage(destination.page); refreshList(destination.page).catch(() => undefined); }
    if (destination.panel && destination.panel !== selectedRef.current) open(destination.panel);
    else writeUrl(destination.panel, destination.page);
  };
  useEffect(() => {
    setDrafts(draftTargets(ownerId));
    refreshList().catch(() => undefined);
    const expired = () => { permitted.current = false; listGeneration.current++; panelGeneration.current++; cache.clear(); setList({ status: "unauthenticated", message: "Session terminée." }); setPanel(null); setSelected(null); };
    const refresh = () => { if (!permitted.current) return; refreshList().catch(() => undefined); if (selectedRef.current) refreshPanel(selectedRef.current).catch(() => undefined); };
    const pop = () => {
      const url = new URL(window.location.href);
      const requestedPanel = url.searchParams.get("panel");
      const numericPage = Number(url.searchParams.get("page") ?? 1);
      const destination = { panel: requestedPanel && (requestedPanel === "new" || /^[0-9a-f-]{36}$/i.test(requestedPanel)) ? requestedPanel : null, page: Number.isInteger(numericPage) && numericPage >= 1 && numericPage <= 100000 ? numericPage : 1 };
      if (destination.panel !== selectedRef.current && selectedRef.current && editor.current) {
        pendingNavigation.current = destination;
        writeUrl(selectedRef.current, pageRef.current);
        editor.current.requestClose();
      } else if (destination.panel !== selectedRef.current && !destination.panel) {
        pendingNavigation.current = destination; close();
      } else applyNavigation.current?.(destination);
    };
    window.addEventListener("crm-session-expired", expired);
    window.addEventListener("crm-session-ready", refresh);
    window.addEventListener("online", refresh);
    window.addEventListener("focus", refresh);
    window.addEventListener("crm-data-changed", refresh);
    const visible = () => { if (document.visibilityState === "visible") refresh(); };
    document.addEventListener("visibilitychange", visible);
    window.addEventListener("popstate", pop);
    if (selectedRef.current) refreshPanel(selectedRef.current).catch(() => undefined);
    return () => { lifecycle.current++; listGeneration.current++; panelGeneration.current++; window.removeEventListener("crm-session-expired", expired); window.removeEventListener("crm-session-ready", refresh); window.removeEventListener("online", refresh); window.removeEventListener("focus", refresh); window.removeEventListener("crm-data-changed", refresh); document.removeEventListener("visibilitychange", visible); window.removeEventListener("popstate", pop); cache.clear(); };
  }, [ownerId, cache, refreshList, refreshPanel, open, close]);
  useEffect(() => {
    if (list.status !== "success" || !selected) return;
    const index = list.companies.findIndex((company) => company.id === selected);
    list.companies.slice(Math.max(0, index - 3), index + 4).forEach((company) => prefetch(company.id));
  }, [list, selected, prefetch]);
  const saved = (company: Company) => {
    cache.put(company); setPanel({ status: "success", company: cache.get(company.id) ?? company }); selectedRef.current = company.id; setSelected(company.id); writeUrl(company.id, pageRef.current);
    window.dispatchEvent(new Event("crm-data-changed"));
  };
  const requestOpen = (id: string) => { if (selectedRef.current && selectedRef.current !== id && editor.current) { pendingNavigation.current = { panel: id, page: pageRef.current }; editor.current.requestClose(); } else open(id); };
  const changePage = (next: number) => { if (selectedRef.current && editor.current) { pendingNavigation.current = { panel: null, page: next }; editor.current.requestClose(); } else { pageRef.current = next; setPage(next); writeUrl(null, next); refreshList(next).catch(() => undefined); } };
  const company = panel?.status === "success" ? panel.company : null;
  return <>
    <header className="mb-6 flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-[length:var(--text-heading)] font-semibold tracking-tight">Sociétés</h1><p className="mt-2 text-sm text-muted-foreground">Vos relations dans leur contexte d’entreprise.</p></div><Button ref={addRef} className="min-h-11" onClick={() => requestOpen('new')}><Plus aria-hidden="true" />Ajouter une société</Button></header>
    {drafts.length ? <div className="mb-5 flex flex-wrap items-center gap-3 rounded-md border p-3"><p className="text-sm">{drafts.length} saisie{drafts.length>1?'s':''} à reprendre dans cet onglet.</p>{drafts.map((target,index)=><Button key={target} variant="outline" className="h-auto min-h-11 max-w-full whitespace-normal" onClick={()=>requestOpen(target)} aria-label={`Reprendre la société ${index+1}`}>{readDraft(ownerId,target)?.values.name||'Nouvelle société'}</Button>)}</div>:null}
    <div className="mb-3 flex items-center justify-between gap-3"><p className="text-xs text-muted-foreground" role="status">{list.status==='success'?`${list.total} société${list.total>1?'s':''}`:'Liste indisponible'}{loading?' · Actualisation…':''}</p><Button variant="ghost" className="min-h-11" disabled={loading} onClick={()=>refreshList().catch(()=>undefined)}><RefreshCw aria-hidden="true" className="size-3.5" />Actualiser</Button></div>
    {list.status!=='success'?<div className="rounded-md border p-6" role="alert"><p>{list.message}</p><Button className="mt-4 min-h-11" onClick={()=>refreshList().catch(()=>undefined)}>Réessayer</Button></div>:list.total===0?<div className="rounded-md border px-6 py-12 text-center"><h2 className="font-medium">Aucune société pour le moment</h2><p className="mt-2 text-sm text-muted-foreground">Ajoutez le nom d’une entreprise pour lui relier vos contacts.</p><Button className="mt-5 min-h-11" variant="outline" onClick={()=>requestOpen('new')}>Ajouter votre première société</Button></div>:<>
      <div className="overflow-hidden rounded-md border" aria-busy={loading}><Table><TableHeader><TableRow className="bg-muted/60"><TableHead className="px-4">Nom</TableHead></TableRow></TableHeader><TableBody>{list.companies.map(item=><TableRow key={item.id} data-company-id={item.id} className="cursor-pointer hover:bg-accent/60" onMouseEnter={()=>{prefetch(item.id);router.prefetch('/societes');}} onClick={()=>requestOpen(item.id)}><TableCell className="px-4 py-0"><Button variant="ghost" className="h-auto min-h-11 w-full justify-start overflow-hidden px-0 text-left font-normal hover:bg-transparent" onFocus={()=>prefetch(item.id)} onClick={event=>{event.stopPropagation();requestOpen(item.id);}} aria-label={`Ouvrir ${item.name}`}><span className="truncate">{item.name}</span></Button></TableCell></TableRow>)}</TableBody></Table></div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-muted-foreground">Page {page} sur {Math.max(1,Math.ceil(list.total/25))} · 25 par page</p><div className="flex gap-2"><Button className="min-h-11" variant="outline" disabled={loading||page<=1} onClick={()=>changePage(page-1)}>Précédent</Button><Button className="min-h-11" variant="outline" disabled={loading||page*25>=list.total} onClick={()=>changePage(page+1)}>Suivant</Button></div></div>
    </>}
    <Sheet open={Boolean(selected)} onOpenChange={value=>{if(!value){if(editor.current)editor.current.requestClose();else close();}}}><SheetContent ref={sheetRef} showCloseButton={false} className="w-full gap-5 sm:max-w-[440px]" tabIndex={-1} onOpenAutoFocus={event=>{event.preventDefault();sheetRef.current?.focus();}} onCloseAutoFocus={event=>{event.preventDefault();const target=returnFocus.current;if(target?.isConnected&&target!==document.body)target.focus();else addRef.current?.focus();}}><SheetHeader className="border-b px-5 py-5 pr-16"><SheetTitle>{selected==='new'?'Nouvelle société':'Fiche société'}</SheetTitle><SheetDescription>{selected==='new'?'Ajoutez une entreprise à votre carnet.':'Son nom et les contacts qui lui sont rattachés.'}</SheetDescription></SheetHeader><Button className="absolute right-3 top-3 min-h-11 min-w-11" variant="ghost" size="icon" aria-label="Fermer la société" onClick={()=>{if(editor.current)editor.current.requestClose();else close();}}><X /></Button>
      {panelError&&company?<p className="px-5 text-sm text-destructive" role="alert">{panelError}</p>:null}
      {selected==='new'||company?<div className="flex min-h-0 flex-1 flex-col overflow-y-auto"><CompanyEditor key={editorKey} ownerId={ownerId} target={editorTarget??'new'} company={company} handle={companyEditor} onSaved={saved} onClose={close} onCancelClose={()=>{pendingNavigation.current=null;pendingHref.current=null;}} />{company?<><div className="mx-5 mb-5"><OpportunityLinks companyId={company.id} onNavigate={href=>{pendingHref.current=href;if(editor.current)editor.current.requestClose();else close();}} /></div><CompanyContacts key={company.id} companyId={company.id} onNavigate={href=>{pendingHref.current=href;if(editor.current)editor.current.requestClose();else close();}} /><div className="mx-5 mb-5"><ExchangeHistory ownerId={ownerId} handle={exchangeHistory} onBusyChange={setExchangeBusy} key={company.id} companyId={company.id} onNavigate={href=>{pendingHref.current=href;if(editor.current)editor.current.requestClose();else close();}} /></div></>:null}</div>:panel?<div className="space-y-4 px-5" role="alert"><p>{panel.status==='success'?'':panel.message}</p><Button className="min-h-11" variant="outline" onClick={()=>{if(selected)refreshPanel(selected).catch(()=>undefined);}}>Réessayer</Button></div>:<div className="space-y-5 px-5" role="status" aria-label="Chargement de la société"><Skeleton className="h-5 w-24"/><Skeleton className="h-11 w-full"/><Skeleton className="h-36 w-full"/></div>}
    </SheetContent></Sheet>
    <Dialog open={exchangeClosing} onOpenChange={open=>{if(!open)cancelExchangeClose();}}><DialogContent ref={exchangeDialog} tabIndex={-1} onOpenAutoFocus={event=>{event.preventDefault();exchangeDialog.current?.focus();}} onCloseAutoFocus={event=>{if(exchangeHistory.current?.focusInvalid())event.preventDefault();}}><DialogHeader><DialogTitle>Conserver cette correction ?</DialogTitle><DialogDescription>La correction de l’échange n’est pas encore confirmée.</DialogDescription></DialogHeader><DialogFooter><Button className="min-h-11" disabled={exchangeBusy} onClick={()=>{const save=async()=>{if(exchangeHistory.current?.busy())return;const confirmed=await exchangeHistory.current?.save();if(!confirmed){cancelExchangeClose();return;}setExchangeClosing(false);if(companyEditor.current)companyEditor.current.requestClose();else close();};save().catch(cancelExchangeClose);}}>Enregistrer</Button><Button className="min-h-11" variant="outline" disabled={exchangeBusy} onClick={()=>{if(exchangeHistory.current?.busy())return;if(exchangeHistory.current?.discard()===false){cancelExchangeClose();return;}setExchangeClosing(false);if(companyEditor.current)companyEditor.current.requestClose();else close();}}>Abandonner</Button><Button className="min-h-11" variant="ghost" onClick={cancelExchangeClose}>Continuer la saisie</Button></DialogFooter></DialogContent></Dialog>
  </>;
}
function CompanyContacts({companyId,onNavigate}:{companyId:string;onNavigate:(href:string)=>void}) {
  const [result,setResult]=useState<CompanyContactsPage|null>(null),[page,setPage]=useState(1),[loading,setLoading]=useState(false);
  const generation=useRef(0);
  const refresh=useCallback(async()=>{const stamp=++generation.current;setLoading(true);const data=await fetchCompanyContacts(companyId,page);if(stamp!==generation.current)return;if(data.status==='unauthenticated'||data.status==='forbidden'){setResult(null);window.dispatchEvent(new Event('crm-session-denied'));return;}if(data.status==='success'&&page>Math.max(1,Math.ceil(data.total/25))){setPage(Math.max(1,Math.ceil(data.total/25)));return;}setResult(data);setLoading(false);},[companyId,page]);
  useEffect(()=>{refresh().catch(()=>setLoading(false));const run=()=>{refresh().catch(()=>setLoading(false));};const expire=()=>{generation.current++;setResult(null);};window.addEventListener('crm-data-changed',run);window.addEventListener('focus',run);window.addEventListener('online',run);window.addEventListener('crm-session-expired',expire);return()=>{generation.current++;window.removeEventListener('crm-data-changed',run);window.removeEventListener('focus',run);window.removeEventListener('online',run);window.removeEventListener('crm-session-expired',expire);};},[refresh]);
  return <section className="mx-5 mb-5 space-y-3 border-t pt-5" aria-label="Contacts de la société" aria-busy={loading}><h2 className="font-medium">Contacts{result?.status==='success'?` (${result.total})`:''}</h2>{!result?<Skeleton className="h-16 w-full"/>:result.status!=='success'?<><p role="alert" className="text-sm">{result.message}</p><Button variant="outline" onClick={()=>refresh().catch(()=>setLoading(false))}>Réessayer</Button></>:result.total===0?<p className="text-sm text-muted-foreground">Aucun contact rattaché.</p>:<><ul className="space-y-1">{result.contacts.map(contact=><li key={contact.id}><Link className="inline-flex min-h-11 max-w-full items-center break-words text-sm underline underline-offset-4" href={`/contacts?panel=${contact.id}`} onClick={event=>{if(!event.metaKey&&!event.ctrlKey&&!event.shiftKey&&!event.altKey){event.preventDefault();onNavigate(`/contacts?panel=${contact.id}`);}}}>{[contact.first_name,contact.last_name].filter(Boolean).join(' ')}</Link></li>)}</ul><div className="flex flex-wrap items-center gap-2"><Button variant="outline" className="min-h-11" disabled={loading||page<=1} onClick={()=>setPage(p=>p-1)}>Contacts précédents</Button><span className="text-xs">{page} / {Math.max(1,Math.ceil(result.total/25))}</span><Button variant="outline" className="min-h-11" disabled={loading||page*25>=result.total} onClick={()=>setPage(p=>p+1)}>Contacts suivants</Button></div></>}</section>;
}
