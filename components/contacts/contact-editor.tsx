"use client";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { fetchEmailDuplicates, sendContactCommand } from "@/lib/contacts-transport";
import { CONTACT_FIELDS, FIELD_LABELS, FIELD_LIMITS, canonicalField, emailSchema, linkedinSchema, contactEditorSchema, type DuplicatesResult, type Contact, type ContactFields, type ContactResult } from "@/lib/validations/contacts";
import { connectLegacyDraft, acknowledge, freshDraft, isDirty, makeCommand, readDraft, removeDraft, writeDraft, type ContactDraft } from "@/lib/contacts-drafts";

import { ExchangeEditor, type ExchangeEditorHandle } from "@/components/exchanges/exchange-editor";
import { ExchangeHistory } from "@/components/exchanges/exchange-history";
import { ContactCompanyEditor, type CompanyEditorHandle } from "./contact-company-editor";

export type EditorHandle = { requestClose: () => void };
type Props = { ownerId: string; target: string; contact: Contact | null; handle: React.RefObject<EditorHandle | null>; onSaved: (contact: Contact) => void; onClose: () => void; onCancelClose: () => void };
export function ContactEditor({ ownerId, target, contact, handle, onSaved, onClose, onCancelClose }: Props) {
  const pendingExchangeHref = useRef<string | null>(null);
  const clearNavigation = () => { pendingExchangeHref.current = null; onCancelClose(); };
  const finishClose = () => { if (inFlight.current || (exchangeEditor.current?.busy() || exchangeHistory.current?.busy())) return; const href = pendingExchangeHref.current; pendingExchangeHref.current = null; onClose(); if (href) window.location.assign(href); };
  const exchangeEditor = useRef<ExchangeEditorHandle | null>(null);
  const exchangeHistory = useRef<ExchangeEditorHandle | null>(null);
  const relationEditor = useRef<CompanyEditorHandle | null>(null);
  const [draft, setDraft] = useState(() => freshDraft(target, contact));
  const draftRef = useRef(draft);
  const [recoverable, setRecoverable] = useState<ContactDraft | null>(null);
  const [recoveryChecked, setRecoveryChecked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [createExchangeSaving, setCreateExchangeSaving] = useState(false);
  const [updateExchangeSaving, setUpdateExchangeSaving] = useState(false);
  const exchangeSaving = createExchangeSaving || updateExchangeSaving;
  const inFlight = useRef(false);
  const active = useRef(true);
  const [message, setMessage] = useState("");
  const [storageError, setStorageError] = useState(false);
  const [conflict, setConflict] = useState<Extract<ContactResult, { status: "conflict" }> | null>(null);
  const [conflictChoices, setConflictChoices] = useState<Partial<Record<keyof ContactFields, "mine" | "server">>>({});
  const [duplicates, setDuplicates] = useState<DuplicatesResult | null>(null);
  const [duplicateLoading, setDuplicateLoading] = useState(false);
  const [duplicatePage, setDuplicatePage] = useState(1);
  const [duplicateRetry, setDuplicateRetry] = useState(0);
  const [closing, setClosing] = useState(false);
  const closeDialogRef = useRef<HTMLDivElement>(null);
  const duplicateContainerRef = useRef<HTMLDivElement>(null);
  const invalidFocusAfterClose = useRef<keyof ContactFields | null>(null);
  const focusField = (field: keyof ContactFields) => {
    const element = document.getElementById(`contact-${field}`);
    element?.focus(); element?.scrollIntoView({ block: "nearest" });
  };
  const focusDuplicates = () => { duplicateContainerRef.current?.focus({ preventScroll: true }); };
  const form = useForm<ContactFields>({ resolver: zodResolver(contactEditorSchema(draft.base)), values: draft.values });
  const update = (next: ContactDraft, persist = true) => {
    draftRef.current = next;
    setDraft(next);
    if (persist) {
      if (isDirty(next)) setStorageError(!writeDraft(ownerId, next));
      else removeDraft(ownerId, next.target);
    }
  };
  useEffect(() => { setRecoverable(readDraft(ownerId, target)); setRecoveryChecked(true); }, [ownerId, target]);
  useEffect(() => {
    active.current = true;
    return () => { active.current = false; };
  }, []);
  useEffect(() => {
    if (contact && !isDirty(draftRef.current) && contact.revision >= (draftRef.current.base?.revision ?? 0)) {
      const next = freshDraft(contact.id, contact); draftRef.current = next; setDraft(next);
    }
  }, [contact]);
  useEffect(() => { setDuplicatePage(1); }, [draft.values.email]);
  useEffect(() => {
    let current = true;
    const email = emailSchema.safeParse(draft.values.email);
    if (!email.success || !email.data || recoverable || !recoveryChecked) { setDuplicates(null); setDuplicateLoading(false); return; }
    if (duplicateContainerRef.current?.contains(document.activeElement)) focusDuplicates();
    setDuplicateLoading(true); setDuplicates(null);
    const timer = setTimeout(() => {
      fetchEmailDuplicates(email.data, draft.base?.id ?? null, duplicatePage).then(result => {
        if (!current) return;
        if (result.status === "success") {
          const lastPage = Math.max(1, Math.ceil(result.total / 25));
          if (duplicatePage > lastPage) { setDuplicatePage(lastPage); return; }
        }
        setDuplicateLoading(false); setDuplicates(result);
        if (result.status === "unauthenticated" || result.status === "forbidden") window.dispatchEvent(new Event("crm-session-denied"));
      }).catch(() => { if (current) { setDuplicateLoading(false); setDuplicates({ status: "unavailable", message: "Vérification indisponible. Vous pouvez enregistrer." }); } });
    }, 350);
    return () => { current = false; clearTimeout(timer); };
  }, [draft.values.email, draft.base?.id, draft.base?.revision, contact?.revision, duplicatePage, duplicateRetry, recoverable, recoveryChecked]);
  const requestClose = () => { if (isDirty(draftRef.current) || recoverable || relationEditor.current?.dirty() || (exchangeEditor.current?.dirty() || exchangeHistory.current?.dirty())) setClosing(true); else finishClose(); };
  handle.current = { requestClose };
  useEffect(() => {
    const unload = (event: BeforeUnloadEvent) => { if (isDirty(draftRef.current)) event.preventDefault(); };
    window.addEventListener("beforeunload", unload);
    return () => window.removeEventListener("beforeunload", unload);
  }, []);
  const change = (field: keyof ContactFields, value: string) => {
    update({ ...draftRef.current, generation: draftRef.current.generation + 1, values: { ...draftRef.current.values, [field]: value } });
    setMessage("");
  };
  const save = async (closeAfter = false) => {
    if (inFlight.current || (exchangeEditor.current?.busy() || exchangeHistory.current?.busy()) || recoverable || !recoveryChecked || conflict) return;
    let exchangeConfirmed = false;
    let relationConfirmed = false;
    const validateCurrent = () => {
      const current = draftRef.current;
      const parsed = contactEditorSchema(current.base).safeParse(current.values);
      if (!parsed.success) {
        clearNavigation();
        if (exchangeConfirmed) setMessage("L’échange est enregistré. Corrigez les informations du contact avant de les enregistrer.");
        form.clearErrors();
        for (const issue of parsed.error.issues) {
          const field = CONTACT_FIELDS.find(field => issue.path.includes(field));
          if (field) form.setError(field, { type: "validation", message: issue.message });
        }
        const first = CONTACT_FIELDS.find(field => parsed.error.issues.some(issue => issue.path.includes(field))) ?? "first_name";
        if (closing) { invalidFocusAfterClose.current = first; setClosing(false); clearNavigation(); }
        else requestAnimationFrame(() => focusField(first));
        return false;
      }
      return true;
    };
    if (closeAfter && exchangeEditor.current?.dirty()) {
      if (!exchangeEditor.current.hasPending() && !validateCurrent()) return;
      const confirmed = await exchangeEditor.current.save();
      if (!confirmed) { setClosing(false); clearNavigation(); return; }
      exchangeConfirmed = true;
    }
    if (closeAfter && exchangeHistory.current?.dirty()) {
      if (!exchangeHistory.current.hasPending() && !validateCurrent()) return;
      const confirmed = await exchangeHistory.current.save();
      if (!confirmed) { setClosing(false); clearNavigation(); return; }
      exchangeConfirmed = true;
    }
    // Exact pending contact retries run first. A pending relation can also be
    // confirmed unchanged, but a fresh relation requires valid contact fields.
    if (!draftRef.current.pending) {
      if (!relationEditor.current?.hasPending() && !validateCurrent()) return;
      if (relationEditor.current?.dirty()) {
        inFlight.current = true; setSaving(true);
        const relationSaved = await relationEditor.current.save();
        inFlight.current = false; if (!active.current) return; setSaving(false);
        if (!relationSaved) { setClosing(false); clearNavigation(); return; }
        relationConfirmed = true;
      }
      if (!validateCurrent()) {
        if (relationConfirmed) setMessage("La société est enregistrée. Corrigez les informations du contact avant de les enregistrer.");
        return;
      }
    }
    const current = draftRef.current;
    const closeIfClean = () => {
      if (!isDirty(draftRef.current) && !relationEditor.current?.dirty() && !(exchangeEditor.current?.dirty() || exchangeHistory.current?.dirty())) finishClose();
      else { setClosing(false); clearNavigation(); }
    };
    if (!isDirty(current)) { if (closeAfter) closeIfClean(); return; }
    const command = makeCommand(current);
    if (command.operation === "update" && Object.keys(command.fields).length === 0 && !current.pending) {
      update(freshDraft(current.target, current.base)); setMessage("Aucune modification à enregistrer."); if (closeAfter) closeIfClean(); return;
    }
    const pending = current.pending ?? { command, generation: current.generation, values: { ...current.values } };
    update({ ...current, pending });
    inFlight.current = true; setSaving(true); setMessage("");
    let result: ContactResult;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    try { result = await Promise.race([sendContactCommand(pending.command), new Promise<ContactResult>((resolve) => { timeout = setTimeout(() => resolve({ status: "unavailable", message: "La confirmation prend trop de temps. Votre saisie est conservée ; réessayez la même commande." }), 15_000); })]); }
    catch { result = { status: "unavailable", message: "La confirmation n’a pas été reçue. Votre saisie est conservée. Réessayez pour vérifier l’enregistrement." }; }
    clearTimeout(timeout);
    inFlight.current = false;
    if (!active.current) return;
    setSaving(false);
    if (result.status === "success") {
      const latest = draftRef.current;
      if (latest.pending?.command.command_id !== pending.command.command_id) return;
      const next = acknowledge(latest, result.contact);
      removeDraft(ownerId, latest.target);
      update(next);
      onSaved(result.contact);
      setMessage(isDirty(next) ? "Enregistrement confirmé. Votre nouvelle saisie reste à enregistrer." : "Contact enregistré.");
      if (closeAfter && !isDirty(next) && !relationEditor.current?.dirty() && !(exchangeEditor.current?.dirty() || exchangeHistory.current?.dirty())) finishClose(); else { setClosing(false); clearNavigation(); }
    } else if (result.status === "unauthenticated" || result.status === "forbidden") {
      clearNavigation();
      window.dispatchEvent(new Event("crm-session-denied"));
    } else {
      // An unavailable response may hide a committed transaction: keep its key.
      if (result.status !== "unavailable") update({ ...draftRef.current, pending: null });
      if (result.status === "validation" && result.field) {
        const field = result.field;
        form.setError(field, { type: "server", message: result.message });
        if (closing) invalidFocusAfterClose.current = field;
        else requestAnimationFrame(() => focusField(field));
      }
      if (result.status === "conflict") { setConflict(result); setConflictChoices({}); }
      setMessage(`${exchangeConfirmed ? "L’échange est enregistré. Les informations du contact ne sont pas confirmées. " : ""}${relationConfirmed ? "La société est enregistrée. Les informations du contact ne sont pas confirmées. " : ""}${result.message}`);
      setClosing(false); clearNavigation();
    }
  };
  const resolveConflict = () => {
    if (!conflict || conflict.fields.some(field => !conflictChoices[field])) return;
    const current = draftRef.current;
    const values = { ...current.values };
    for (const field of CONTACT_FIELDS) {
      if (conflictChoices[field] === "server" || (!conflict.fields.includes(field) && canonicalField(field, values[field]) === current.base?.[field])) values[field] = conflict.contact[field];
    }
    update({ ...current, base: conflict.contact, values, pending: null, generation: current.generation + 1 });
    setConflict(null); setConflictChoices({}); setMessage("Choix préparés. Enregistrez pour confirmer vos changements.");
  };
  const cancelClose = () => { pendingExchangeHref.current = null; setClosing(false); clearNavigation(); };
  return <>
    {recoverable ? <div className="mx-5 rounded-md border p-4" role="status"><p className="font-medium">Une saisie est à reprendre</p><p className="mt-1 text-sm text-muted-foreground">Retrouvez le texte et les versions conservés dans cet onglet.</p><div className="mt-3 flex flex-wrap gap-2"><Button className="min-h-11" onClick={() => { update(connectLegacyDraft(recoverable, contact)); setRecoverable(null); setMessage(recoverable.pending ? "Une commande attend sa confirmation. Réessayez avant tout nouvel enregistrement." : "Brouillon repris."); }}>Reprendre la saisie</Button><Button className="min-h-11" variant="outline" onClick={() => { removeDraft(ownerId, recoverable.target); setRecoverable(null); }}>Abandonner le brouillon</Button></div></div> : null}
    <form className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 pb-5" onSubmit={(event) => { event.preventDefault(); save().catch(() => { clearNavigation(); setMessage("Enregistrement indisponible. Votre saisie est conservée."); }); }} aria-busy={saving}>
      <fieldset className="space-y-5" disabled={Boolean(recoverable) || !recoveryChecked}>
        {CONTACT_FIELDS.map(field => {
          const label = FIELD_LABELS[field];
          const props = {
            id: `contact-${field}`, autoComplete: "off", ...form.register(field), value: draft.values[field],
            onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => { const value = event.target.value; form.setValue(field, value, { shouldValidate: form.formState.isSubmitted }); change(field, value); },
            "aria-invalid": Boolean(form.formState.errors[field]), "aria-describedby": `help-${field}${form.formState.errors[field] ? ` error-${field}` : ""}`,
          };
          return <div className="space-y-2" key={field}>
            <Label htmlFor={`contact-${field}`}>{label}{field !== "first_name" && field !== "last_name" ? <span className="text-xs font-normal text-muted-foreground"> Facultatif</span> : null}</Label>
            {field === "notes" ? <Textarea {...props} rows={6} className="h-36 min-h-36 max-h-72 resize-y overflow-y-auto [field-sizing:fixed] text-base" /> : <Input {...props} type="text" inputMode={field === "email" ? "email" : field === "linkedin_url" ? "url" : "text"} className="h-11 text-base" />}
            <p id={`help-${field}`} className="text-xs text-muted-foreground">{FIELD_LIMITS[field].toLocaleString("fr-FR")} caractères maximum.{field === "notes" ? " Texte libre, indépendant des échanges." : ""}</p>
            {form.formState.errors[field] ? <p id={`error-${field}`} className="text-sm text-destructive" role="alert">{form.formState.errors[field]?.message}</p> : null}
            {field === "linkedin_url" && draft.values.linkedin_url.trim() && linkedinSchema.safeParse(draft.values.linkedin_url).success ? <a className="inline-flex min-h-11 items-center text-sm underline underline-offset-4" href={draft.values.linkedin_url.trim()} target="_blank" rel="noopener noreferrer">Ouvrir LinkedIn dans un nouvel onglet</a> : null}
            {field === "email" ? <div ref={duplicateContainerRef} tabIndex={-1} aria-label="Vérification des doublons e-mail" className="outline-none" aria-live="polite" data-contacts-duplicates>
              {duplicateLoading ? <p className="text-xs text-muted-foreground">Vérification des doublons…</p> : duplicates?.status === "success" && duplicates.total > 0 ? <div className="space-y-2 rounded-md border p-3"><p className="text-sm">Cette adresse est déjà utilisée par {duplicates.total} contact{duplicates.total > 1 ? "s" : ""}. Vous pouvez enregistrer.</p><ul className="space-y-1 text-sm">{duplicates.contacts.map(item => <li className="break-words" key={item.id}>{[item.first_name, item.last_name].filter(Boolean).join(" ")}</li>)}</ul>{duplicates.total > 25 ? <div className="flex flex-wrap items-center gap-2"><Button type="button" variant="outline" className="min-h-11" aria-label="Doublons précédents" disabled={duplicatePage <= 1} onClick={() => { focusDuplicates(); setDuplicatePage(page => page - 1); }}>Précédents</Button><span className="text-xs">{duplicatePage} / {Math.ceil(duplicates.total / 25)}</span><Button type="button" variant="outline" className="min-h-11" aria-label="Doublons suivants" disabled={duplicatePage * 25 >= duplicates.total} onClick={() => { focusDuplicates(); setDuplicatePage(page => page + 1); }}>Suivants</Button></div> : null}</div> : duplicates && duplicates.status !== "success" ? <div><p className="text-xs">{duplicates.message}</p></div> : null}
              {!duplicateLoading && duplicates ? <Button type="button" variant="ghost" className="min-h-11" onClick={() => { focusDuplicates(); setDuplicateRetry(value => value + 1); }}>Revérifier les doublons</Button> : null}
            </div> : null}
          </div>;
        })}
      </fieldset>
      {contact ? <ContactCompanyEditor ownerId={ownerId} contactId={contact.id} handle={relationEditor} /> : null}
      {contact ? <><ExchangeEditor ownerId={ownerId} contactId={contact.id} handle={exchangeEditor} onBusyChange={setCreateExchangeSaving} /><ExchangeHistory ownerId={ownerId} handle={exchangeHistory} onBusyChange={setUpdateExchangeSaving} contactId={contact.id} onNavigate={href => { pendingExchangeHref.current = href; requestClose(); }} /></> : null}
      <p id="contact-help" className="text-xs text-muted-foreground">Un prénom ou un nom suffit. Enregistrez pour confirmer vos changements.</p>
      {storageError ? <p role="alert" className="text-sm text-destructive">Le stockage de cet onglet est indisponible. Gardez cette page ouverte jusqu’à confirmation.</p> : null}
      {message ? <p role="status" aria-live="polite" className="text-sm" data-contact-message>{message}</p> : null}
      {conflict ? <div className="space-y-3 rounded-md border p-4" role="alert"><p className="font-medium">Cette fiche a changé ailleurs</p>{conflict.fields.map(field => <div key={field} className="space-y-2" data-conflict-field={field}><p className="break-words text-sm">{FIELD_LABELS[field]} enregistré : <strong className="whitespace-pre-wrap">{conflict.contact[field] || "Vide"}</strong></p><div className="flex flex-wrap gap-2"><Button type="button" variant={conflictChoices[field] === "mine" ? "default" : "outline"} aria-pressed={conflictChoices[field] === "mine"} className="h-auto min-h-11 whitespace-normal" onClick={() => setConflictChoices(choices => ({ ...choices, [field]: "mine" }))}>Garder ma saisie pour {FIELD_LABELS[field]}</Button><Button type="button" variant={conflictChoices[field] === "server" ? "default" : "outline"} aria-pressed={conflictChoices[field] === "server"} className="h-auto min-h-11 whitespace-normal" onClick={() => setConflictChoices(choices => ({ ...choices, [field]: "server" }))}>Utiliser la version enregistrée pour {FIELD_LABELS[field]}</Button></div></div>)}<Button type="button" className="h-auto min-h-11 whitespace-normal" disabled={conflict.fields.some(field => !conflictChoices[field])} onClick={resolveConflict}>Préparer ces choix</Button></div> : null}
      <div className="mt-auto flex flex-wrap gap-2 border-t pt-4"><Button type="submit" className="min-h-11" disabled={saving || exchangeSaving || Boolean(recoverable) || Boolean(conflict)}>{saving ? "Enregistrement…" : draft.pending ? "Réessayer la confirmation" : draft.base ? "Enregistrer" : "Ajouter"}</Button><Button type="button" variant="outline" className="min-h-11" onClick={requestClose}>Annuler</Button></div>
    </form>
    <Dialog open={closing} onOpenChange={(open) => { if (open) setClosing(true); else cancelClose(); }}><DialogContent ref={closeDialogRef} tabIndex={-1} showCloseButton={false} onCloseAutoFocus={(event) => {
      const field = invalidFocusAfterClose.current;
      if (field) { event.preventDefault(); invalidFocusAfterClose.current = null; focusField(field); }
      else if (exchangeEditor.current?.focusInvalid() || exchangeHistory.current?.focusInvalid()) event.preventDefault();
    }} onOpenAutoFocus={(event) => { event.preventDefault(); closeDialogRef.current?.focus(); }}><DialogHeader><DialogTitle>Conserver votre saisie ?</DialogTitle><DialogDescription>Des changements ne sont pas encore confirmés.</DialogDescription></DialogHeader><DialogFooter className="sm:flex-wrap"><Button className="min-h-11" disabled={saving || exchangeSaving || Boolean(recoverable) || Boolean(conflict)} onClick={() => { save(true).catch(() => { setClosing(false); clearNavigation(); setMessage("Enregistrement indisponible."); }); }}>Enregistrer</Button><Button className="min-h-11" variant="outline" disabled={saving || exchangeSaving} onClick={() => { if (inFlight.current || (exchangeEditor.current?.busy() || exchangeHistory.current?.busy())) return; if (exchangeHistory.current?.discard() === false) { setClosing(false); clearNavigation(); return; } exchangeEditor.current?.discard(); relationEditor.current?.discard(); removeDraft(ownerId, draftRef.current.target); if (recoverable) removeDraft(ownerId, recoverable.target); finishClose(); }}>Abandonner</Button><Button className="min-h-11" variant="ghost" onClick={cancelClose}>Continuer la saisie</Button></DialogFooter></DialogContent></Dialog>
  </>;
}
