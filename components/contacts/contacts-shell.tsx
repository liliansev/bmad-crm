"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { ContactEditor, type EditorHandle } from "@/components/contacts/contact-editor";
import { fetchContact, fetchContacts } from "@/lib/contacts-transport";
import { createContactsCache } from "@/lib/contacts-cache";
import { draftTargets, readDraft } from "@/lib/contacts-drafts";
import { linkedinSchema, type Contact, type ContactReadResult, type ContactsPage } from "@/lib/validations/contacts";

import { exchangeDraftTargets } from "@/lib/exchanges-drafts";
import { formatExchangeDate } from "@/lib/exchange-date";
import { relationDraftTargets } from "./contact-company-editor";
const allDraftTargets = (ownerId: string) => [...new Set([...draftTargets(ownerId), ...relationDraftTargets(ownerId), ...exchangeDraftTargets(ownerId)])];

type NavigationTarget = { panel: string | null; page: number };
type Props = { ownerId: string; initial: ContactsPage; initialPage: number; initialPanel: string | null };
function writeUrl(panel: string | null, page: number) {
  const url = new URL(window.location.href);
  if (panel) url.searchParams.set("panel", panel); else url.searchParams.delete("panel");
  if (page > 1) url.searchParams.set("page", String(page)); else url.searchParams.delete("page");
  window.history.replaceState(null, "", url);
}
export function ContactsShell({ ownerId, initial, initialPage, initialPanel }: Props) {
  const router = useRouter();
  const [cache] = useState(() => createContactsCache(ownerId));
  const [list, setList] = useState<ContactsPage>(initial);
  const [page, setPage] = useState(initialPage);
  const pageRef = useRef(page);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string | null>(initialPanel);
  const selectedRef = useRef(selected);
  const [editorTarget, setEditorTarget] = useState(initialPanel);
  const [editorKey, setEditorKey] = useState(0);
  const [panel, setPanel] = useState<ContactReadResult | null>(() => initialPanel && cache.get(initialPanel) ? { status: "success", contact: cache.get(initialPanel)! } : null);
  const [panelError, setPanelError] = useState("");
  const [drafts, setDrafts] = useState<string[]>([]);
  const listGeneration = useRef(0);
  const panelGeneration = useRef(0);
  const permitted = useRef(true);
  const lifecycle = useRef(0);
  const pendingNavigation = useRef<NavigationTarget | null>(null);
  const applyNavigation = useRef<((destination: NavigationTarget) => void) | null>(null);
  const editor = useRef<EditorHandle | null>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const addRef = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => {
    panelGeneration.current++;
    setSelected(null); selectedRef.current = null; setPanel(null); editor.current = null;
    writeUrl(null, pageRef.current); setDrafts(allDraftTargets(ownerId));
    const destination = pendingNavigation.current; pendingNavigation.current = null;
    if (destination) applyNavigation.current?.(destination);
  }, [ownerId]);
  const denied = (status: string) => { if (status === "unauthenticated" || status === "forbidden") window.dispatchEvent(new Event("crm-session-denied")); };
  const refreshList = useCallback(async (requested = pageRef.current) => {
    const generation = ++listGeneration.current;
    setLoading(true);
    let result: ContactsPage;
    try { result = await fetchContacts(requested); }
    catch { result = { status: "unavailable", message: "Impossible de charger les contacts. Votre brouillon est conservé." }; }
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
    let result: ContactReadResult;
    try { result = await cache.load(id, fetchContact); }
    catch { result = { status: "unavailable", message: "Impossible de charger la fiche. Réessayez." }; }
    if (!permitted.current || generation !== panelGeneration.current || id !== selectedRef.current) return;
    denied(result.status);
    if (result.status === "success") { setPanelError(""); setPanel(result); }
    else { setPanelError(result.message); setPanel((previous) => previous?.status === "success" ? previous : result); }
  }, [cache]);
  const open = useCallback((id: string) => {
    returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    selectedRef.current = id; setSelected(id); setEditorTarget(id); setEditorKey((key) => key + 1);
    setPanelError("");
    const seed = cache.get(id); setPanel(seed ? { status: "success", contact: seed } : null);
    writeUrl(id, pageRef.current);
    refreshPanel(id).catch(() => setPanel({ status: "unavailable", message: "Impossible de charger la fiche." }));
  }, [cache, refreshPanel]);
  const prefetch = useCallback((id: string) => { const started = lifecycle.current; cache.load(id, fetchContact).then((result) => { if (permitted.current && started === lifecycle.current) denied(result.status); }).catch(() => undefined); }, [cache]);
  applyNavigation.current = (destination) => {
    if (destination.page !== pageRef.current) { pageRef.current = destination.page; setPage(destination.page); refreshList(destination.page).catch(() => undefined); }
    if (destination.panel && destination.panel !== selectedRef.current) open(destination.panel);
    else writeUrl(destination.panel, destination.page);
  };
  useEffect(() => {
    setDrafts(allDraftTargets(ownerId));
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
    window.addEventListener("popstate", pop);
    if (selectedRef.current) refreshPanel(selectedRef.current).catch(() => undefined);
    return () => { lifecycle.current++; listGeneration.current++; panelGeneration.current++; window.removeEventListener("crm-session-expired", expired); window.removeEventListener("crm-session-ready", refresh); window.removeEventListener("online", refresh); window.removeEventListener("focus", refresh); window.removeEventListener("crm-data-changed", refresh); window.removeEventListener("popstate", pop); cache.clear(); };
  }, [ownerId, cache, refreshList, refreshPanel, open, close]);
  useEffect(() => {
    if (list.status !== "success" || !selected) return;
    const index = list.contacts.findIndex((contact) => contact.id === selected);
    list.contacts.slice(Math.max(0, index - 3), index + 4).forEach((contact) => prefetch(contact.id));
  }, [list, selected, prefetch]);
  const saved = (contact: Contact) => {
    cache.put(contact); setPanel({ status: "success", contact: cache.get(contact.id) ?? contact }); selectedRef.current = contact.id; setSelected(contact.id); writeUrl(contact.id, pageRef.current);
    refreshList().catch(() => undefined);
  };
  const changePage = (next: number) => { pageRef.current = next; setPage(next); writeUrl(selectedRef.current, next); refreshList(next).catch(() => undefined); };
  const contact = panel?.status === "success" ? panel.contact : null;
  return <>
    <header className="mb-6 flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-[length:var(--text-heading)] font-semibold tracking-tight">Contacts</h1><p className="mt-2 text-sm text-muted-foreground">Votre carnet de relations.</p></div><Button ref={addRef} className="min-h-11" onClick={() => open("new")}><Plus aria-hidden="true" />Ajouter un contact</Button></header>
    {drafts.length ? <div className="mb-5 flex flex-wrap items-center gap-3 rounded-md border p-3"><p className="text-sm">{drafts.length} saisie{drafts.length > 1 ? "s" : ""} à reprendre dans cet onglet.</p><div className="flex flex-wrap gap-2">{drafts.map((target, index) => <Button key={target} variant="outline" className="h-auto min-h-11 max-w-full whitespace-normal text-left" onClick={() => open(target)} aria-label={drafts.length === 1 ? "Retrouver ma saisie" : `Retrouver la saisie ${index + 1}`}>{drafts.length === 1 ? "Retrouver ma saisie" : [readDraft(ownerId, target)?.values.first_name, readDraft(ownerId, target)?.values.last_name].filter(Boolean).join(" ") || `Saisie ${index + 1}`}</Button>)}</div></div> : null}
    <div className="mb-3 flex items-center justify-between gap-3"><p className="text-xs text-muted-foreground" role="status">{list.status === "success" ? `${list.total} contact${list.total > 1 ? "s" : ""}` : "Liste indisponible"}{loading ? " · Actualisation…" : ""}</p><Button variant="ghost" className="min-h-11" disabled={loading} onClick={() => refreshList().catch(() => undefined)}><RefreshCw aria-hidden="true" className="size-3.5" />Actualiser</Button></div>
    {list.status !== "success" ? <div className="rounded-md border p-6" role="alert"><p>{list.message}</p><Button className="mt-4 min-h-11" onClick={() => refreshList().catch(() => undefined)}>Réessayer</Button></div> : list.total === 0 ? <div className="rounded-md border px-6 py-12 text-center"><h2 className="font-medium">Aucun contact pour le moment</h2><p className="mt-2 text-sm text-muted-foreground">Commencez avec un prénom ou un nom.</p><Button className="mt-5 min-h-11" variant="outline" onClick={() => open("new")}>Ajouter votre premier contact</Button></div> : <>
      <div className="overflow-hidden rounded-md border" aria-busy={loading}><Table className="min-w-[960px] table-fixed"><TableHeader><TableRow className="bg-muted/60 hover:bg-muted/60">{["Prénom", "Nom", "E-mail", "Titre professionnel", "Dernière interaction", "LinkedIn", "Société"].map(label => <TableHead key={label} className="px-4">{label}</TableHead>)}</TableRow></TableHeader><TableBody>{list.contacts.map(item => <TableRow key={item.id} data-contact-id={item.id} className="cursor-pointer hover:bg-accent/60" onMouseEnter={() => { prefetch(item.id); router.prefetch("/contacts"); }} onClick={() => open(item.id)}><TableCell className="px-4 py-0"><Button variant="ghost" className="h-auto min-h-11 w-full justify-start px-0 text-left font-normal hover:bg-transparent" onFocus={() => prefetch(item.id)} onClick={event => { event.stopPropagation(); open(item.id); }} aria-label={`Ouvrir ${[item.first_name, item.last_name].filter(Boolean).join(" ")}`}><span className="truncate">{item.first_name || "—"}</span></Button></TableCell><TableCell className="truncate px-4" title={item.last_name}>{item.last_name || "—"}</TableCell><TableCell className="truncate px-4" title={item.email}>{item.email || "—"}</TableCell><TableCell className="truncate px-4" title={item.job_title}>{item.job_title || "—"}</TableCell><TableCell className="px-4 text-xs">{item.last_interaction ? formatExchangeDate(item.last_interaction) : "—"}</TableCell><TableCell className="truncate px-4">{item.linkedin_url && linkedinSchema.safeParse(item.linkedin_url).success ? <a className="inline-flex min-h-11 items-center underline underline-offset-4" href={item.linkedin_url} target="_blank" rel="noopener noreferrer" onClick={event => event.stopPropagation()} aria-label={`LinkedIn de ${[item.first_name, item.last_name].filter(Boolean).join(" ")} (nouvel onglet)`}>LinkedIn</a> : "—"}</TableCell><TableCell className="truncate px-4">{item.company ? <a className="inline-flex min-h-11 items-center underline" href={`/societes?panel=${item.company.id}`} onClick={event => event.stopPropagation()}>{item.company.name}</a> : "—"}</TableCell></TableRow>)}</TableBody></Table></div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-muted-foreground">Page {page} sur {Math.max(1, Math.ceil(list.total / 25))} · 25 par page</p><div className="flex gap-2"><Button className="min-h-11" variant="outline" disabled={loading || page <= 1} onClick={() => changePage(page - 1)}>Précédent</Button><Button className="min-h-11" variant="outline" disabled={loading || page * 25 >= list.total} onClick={() => changePage(page + 1)}>Suivant</Button></div></div>
    </>}
    <Sheet open={Boolean(selected)} onOpenChange={(value) => { if (!value) { if (editor.current) editor.current.requestClose(); else close(); } }}><SheetContent ref={sheetRef} showCloseButton={false} className="w-full gap-5 sm:max-w-[440px]" tabIndex={-1} onOpenAutoFocus={(event) => { event.preventDefault(); sheetRef.current?.focus(); }} onCloseAutoFocus={(event) => { event.preventDefault(); const target = returnFocus.current; if (target?.isConnected && target !== document.body) target.focus(); else addRef.current?.focus(); }}><SheetHeader className="border-b px-5 py-5 pr-16"><SheetTitle>{selected === "new" ? "Nouveau contact" : "Fiche contact"}</SheetTitle><SheetDescription>{selected === "new" ? "Ajoutez une personne à votre carnet." : "Consultez et complétez ses informations."}</SheetDescription></SheetHeader><Button className="absolute right-3 top-3 min-h-11 min-w-11" variant="ghost" size="icon" aria-label="Fermer la fiche" onClick={() => { if (editor.current) editor.current.requestClose(); else close(); }}><X /></Button>
      {panelError && contact ? <p className="px-5 text-sm text-destructive" role="alert">{panelError}</p> : null}
      {selected === "new" || contact ? <ContactEditor key={editorKey} ownerId={ownerId} target={editorTarget ?? "new"} contact={contact} handle={editor} onSaved={saved} onClose={close} onCancelClose={() => { pendingNavigation.current = null; }} /> : panel ? <div className="space-y-4 px-5" role="alert"><p>{panel.status === "success" ? "" : panel.message}</p><Button className="min-h-11" variant="outline" onClick={() => { if (selected) refreshPanel(selected).catch(() => undefined); }}>Réessayer</Button></div> : <div className="space-y-5 px-5" role="status" aria-label="Chargement de la fiche">{Array.from({ length: 5 }, (_, index) => <div className="space-y-2" key={index}><Skeleton className="h-5 w-24" /><Skeleton className="h-11 w-full" /><Skeleton className="h-3 w-36" /></div>)}<Skeleton className="h-36 w-full" /></div>}
    </SheetContent></Sheet>
  </>;
}
