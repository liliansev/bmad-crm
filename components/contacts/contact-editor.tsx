"use client";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { sendContactCommand } from "@/lib/contacts-transport";
import { contactNamesSchema, type Contact, type ContactFields, type ContactResult } from "@/lib/validations/contacts";
import { acknowledge, freshDraft, isDirty, makeCommand, readDraft, removeDraft, writeDraft, type ContactDraft } from "@/lib/contacts-drafts";

export type EditorHandle = { requestClose: () => void };
type Props = { ownerId: string; target: string; contact: Contact | null; handle: React.RefObject<EditorHandle | null>; onSaved: (contact: Contact) => void; onClose: () => void; onCancelClose: () => void };
export function ContactEditor({ ownerId, target, contact, handle, onSaved, onClose, onCancelClose }: Props) {
  const [draft, setDraft] = useState(() => freshDraft(target, contact));
  const draftRef = useRef(draft);
  const [recoverable, setRecoverable] = useState<ContactDraft | null>(null);
  const [recoveryChecked, setRecoveryChecked] = useState(false);
  const [saving, setSaving] = useState(false);
  const inFlight = useRef(false);
  const active = useRef(true);
  const [message, setMessage] = useState("");
  const [storageError, setStorageError] = useState(false);
  const [conflict, setConflict] = useState<Extract<ContactResult, { status: "conflict" }> | null>(null);
  const [closing, setClosing] = useState(false);
  const closeDialogRef = useRef<HTMLDivElement>(null);
  const form = useForm<ContactFields>({ resolver: zodResolver(contactNamesSchema), values: draft.values });
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
  const requestClose = () => { if (isDirty(draftRef.current) || recoverable) setClosing(true); else onClose(); };
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
    if (inFlight.current || recoverable || !recoveryChecked || conflict) return;
    const current = draftRef.current;
    if (!current.pending && !contactNamesSchema.safeParse(current.values).success) { form.trigger().catch(() => setMessage("Vérifiez les champs.")); return; }
    if (!isDirty(current)) { if (closeAfter) onClose(); return; }
    const command = makeCommand(current);
    if (command.operation === "update" && Object.keys(command.fields).length === 0 && !current.pending) {
      update(freshDraft(current.target, current.base)); setMessage("Aucune modification à enregistrer."); if (closeAfter) onClose(); return;
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
      if (closeAfter && !isDirty(next)) onClose(); else { setClosing(false); onCancelClose(); }
    } else if (result.status === "unauthenticated" || result.status === "forbidden") {
      window.dispatchEvent(new Event("crm-session-denied"));
    } else {
      // An unavailable response may hide a committed transaction: keep its key.
      if (result.status !== "unavailable") update({ ...draftRef.current, pending: null });
      if (result.status === "conflict") setConflict(result);
      setMessage(result.message);
      setClosing(false); onCancelClose();
    }
  };
  const replaceConflict = () => {
    if (!conflict) return;
    const current = draftRef.current;
    const values = { ...current.values };
    for (const field of ["first_name", "last_name"] as const) if (!conflict.fields.includes(field) && values[field].trim() === current.base?.[field]) values[field] = conflict.contact[field];
    update({ ...current, base: conflict.contact, values, pending: null, generation: current.generation + 1 });
    setConflict(null); setMessage("Versions actualisées. Cliquez sur Enregistrer pour confirmer votre remplacement.");
  };
  const adoptConflict = () => {
    if (!conflict) return;
    const current = draftRef.current;
    const values = { ...current.values };
    for (const field of ["first_name", "last_name"] as const) {
      if (conflict.fields.includes(field) || values[field].trim() === current.base?.[field]) values[field] = conflict.contact[field];
    }
    update({ ...current, base: conflict.contact, values, pending: null, generation: current.generation + 1 });
    setConflict(null); setMessage("Champs en conflit actualisés. Vos autres changements sont conservés.");
  };
  const cancelClose = () => { setClosing(false); onCancelClose(); };
  return <>
    {recoverable ? <div className="mx-5 rounded-md border p-4" role="status"><p className="font-medium">Une saisie est à reprendre</p><p className="mt-1 text-sm text-muted-foreground">Retrouvez le texte et les versions conservés dans cet onglet.</p><div className="mt-3 flex flex-wrap gap-2"><Button className="min-h-11" onClick={() => { update(recoverable); setRecoverable(null); setMessage(recoverable.pending ? "Une commande attend sa confirmation. Réessayez avant tout nouvel enregistrement." : "Brouillon repris."); }}>Reprendre la saisie</Button><Button className="min-h-11" variant="outline" onClick={() => { removeDraft(ownerId, recoverable.target); setRecoverable(null); }}>Abandonner le brouillon</Button></div></div> : null}
    <form className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 pb-5" onSubmit={(event) => { event.preventDefault(); save().catch(() => setMessage("Enregistrement indisponible. Votre saisie est conservée.")); }} aria-busy={saving}>
      <fieldset className="space-y-5" disabled={Boolean(recoverable) || !recoveryChecked}>
        {([ ["first_name", "Prénom"], ["last_name", "Nom"] ] as const).map(([field, label]) => <div className="space-y-2" key={field}><Label htmlFor={`contact-${field}`}>{label}</Label><Input id={`contact-${field}`} autoComplete="off" maxLength={400} className="h-11 text-base" {...form.register(field)} value={draft.values[field]} onChange={(event) => { const value = Array.from(event.target.value).slice(0, 200).join(""); form.setValue(field, value, { shouldValidate: form.formState.isSubmitted }); change(field, value); }} aria-invalid={Boolean(form.formState.errors[field])} aria-describedby={form.formState.errors[field] ? `error-${field}` : "contact-help"} />{form.formState.errors[field] ? <p id={`error-${field}`} className="text-sm text-destructive" role="alert">{form.formState.errors[field]?.message}</p> : null}</div>)}
      </fieldset>
      <p id="contact-help" className="text-xs text-muted-foreground">Un prénom ou un nom suffit. Enregistrez pour confirmer vos changements.</p>
      {storageError ? <p role="alert" className="text-sm text-destructive">Le stockage de cet onglet est indisponible. Gardez cette page ouverte jusqu’à confirmation.</p> : null}
      {message ? <p role="status" aria-live="polite" className="text-sm" data-contact-message>{message}</p> : null}
      {conflict ? <div className="space-y-3 rounded-md border p-4" role="alert"><p className="font-medium">Cette fiche a changé ailleurs</p>{conflict.fields.map((field) => <p key={field} className="break-words text-sm">{field === "first_name" ? "Prénom" : "Nom"} enregistré : <strong>{conflict.contact[field] || "Vide"}</strong></p>)}<Button type="button" className="h-auto min-h-11 whitespace-normal" onClick={replaceConflict}>Conserver ma saisie et préparer le remplacement</Button><Button type="button" variant="outline" className="h-auto min-h-11 whitespace-normal" onClick={adoptConflict}>Utiliser la version enregistrée</Button></div> : null}
      <div className="mt-auto flex flex-wrap gap-2 border-t pt-4"><Button type="submit" className="min-h-11" disabled={saving || Boolean(recoverable) || Boolean(conflict)}>{saving ? "Enregistrement…" : draft.pending ? "Réessayer la confirmation" : draft.base ? "Enregistrer" : "Ajouter"}</Button><Button type="button" variant="outline" className="min-h-11" onClick={requestClose}>Annuler</Button></div>
    </form>
    <Dialog open={closing} onOpenChange={(open) => { if (open) setClosing(true); else cancelClose(); }}><DialogContent ref={closeDialogRef} tabIndex={-1} showCloseButton={false} onOpenAutoFocus={(event) => { event.preventDefault(); closeDialogRef.current?.focus(); }}><DialogHeader><DialogTitle>Conserver votre saisie ?</DialogTitle><DialogDescription>Des changements ne sont pas encore confirmés.</DialogDescription></DialogHeader><DialogFooter className="sm:flex-wrap"><Button className="min-h-11" disabled={saving || Boolean(recoverable) || Boolean(conflict)} onClick={() => { save(true).catch(() => setMessage("Enregistrement indisponible.")); }}>Enregistrer</Button><Button className="min-h-11" variant="outline" disabled={saving} onClick={() => { removeDraft(ownerId, draftRef.current.target); if (recoverable) removeDraft(ownerId, recoverable.target); onClose(); }}>Abandonner</Button><Button className="min-h-11" variant="ghost" onClick={cancelClose}>Continuer la saisie</Button></DialogFooter></DialogContent></Dialog>
  </>;
}
