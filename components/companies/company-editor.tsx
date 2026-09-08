"use client";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { z } from "zod";
import { sendCompanyCommand } from "@/lib/companies-transport";
import { companyNameSchema, type Company, type CompanyResult } from "@/lib/validations/companies";
import { acknowledge, freshDraft, isDirty, makeCommand, readDraft, removeDraft, writeDraft, type CompanyDraft } from "@/lib/companies-drafts";
const COMPANY_FIELDS = ["name"] as const;
const FIELD_LABELS = { name: "Nom" };
type CompanyFields = { name: string };
const companyEditorSchema = z.object({ name: companyNameSchema });


export type EditorHandle = { requestClose: () => void };
type Props = { ownerId: string; target: string; company: Company | null; handle: React.RefObject<EditorHandle | null>; onSaved: (company: Company) => void; onClose: () => void; onCancelClose: () => void };
export function CompanyEditor({ ownerId, target, company, handle, onSaved, onClose, onCancelClose }: Props) {
  const [draft, setDraft] = useState(() => freshDraft(target, company));
  const draftRef = useRef(draft);
  const [recoverable, setRecoverable] = useState<CompanyDraft | null>(null);
  const [recoveryChecked, setRecoveryChecked] = useState(false);
  const [saving, setSaving] = useState(false);
  const inFlight = useRef(false);
  const active = useRef(true);
  const [message, setMessage] = useState("");
  const [storageError, setStorageError] = useState(false);
  const [conflict, setConflict] = useState<Extract<CompanyResult, { status: "conflict" }> | null>(null);
  const [conflictChoices, setConflictChoices] = useState<Partial<Record<keyof CompanyFields, "mine" | "server">>>({});
  const [closing, setClosing] = useState(false);
  const closeDialogRef = useRef<HTMLDivElement>(null);
  const invalidFocusAfterClose = useRef<keyof CompanyFields | null>(null);
  const focusField = (field: keyof CompanyFields) => {
    const element = document.getElementById(`company-${field}`);
    element?.focus(); element?.scrollIntoView({ block: "nearest" });
  };
  const form = useForm<CompanyFields>({ resolver: zodResolver(companyEditorSchema), values: draft.values });
  const update = (next: CompanyDraft, persist = true) => {
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
    if (company && !isDirty(draftRef.current) && company.revision >= (draftRef.current.base?.revision ?? 0)) {
      const next = freshDraft(company.id, company); draftRef.current = next; setDraft(next);
    }
  }, [company]);
  const requestClose = () => { if (isDirty(draftRef.current) || recoverable) setClosing(true); else onClose(); };
  handle.current = { requestClose };
  useEffect(() => {
    const unload = (event: BeforeUnloadEvent) => { if (isDirty(draftRef.current)) event.preventDefault(); };
    window.addEventListener("beforeunload", unload);
    return () => window.removeEventListener("beforeunload", unload);
  }, []);
  const change = (field: keyof CompanyFields, value: string) => {
    update({ ...draftRef.current, generation: draftRef.current.generation + 1, values: { ...draftRef.current.values, [field]: value } });
    setMessage("");
  };
  const save = async (closeAfter = false) => {
    if (inFlight.current || recoverable || !recoveryChecked || conflict) return;
    const current = draftRef.current;
    if (!current.pending) {
      const parsed = companyEditorSchema.safeParse(current.values);
      if (!parsed.success) {
        form.clearErrors();
        for (const issue of parsed.error.issues) {
          const field = COMPANY_FIELDS.find(field => issue.path.includes(field));
          if (field) form.setError(field, { type: "validation", message: issue.message });
        }
        const first = COMPANY_FIELDS.find(field => parsed.error.issues.some(issue => issue.path.includes(field))) ?? "name";
        if (closing) { invalidFocusAfterClose.current = first; setClosing(false); onCancelClose(); }
        else requestAnimationFrame(() => focusField(first));
        return;
      }
    }
    if (!isDirty(current)) { if (closeAfter) onClose(); return; }
    const command = makeCommand(current);
    if (current.base && current.values.name.trim() === current.base.name && !current.pending) {
      update(freshDraft(current.target, current.base)); setMessage("Aucune modification à enregistrer."); if (closeAfter) onClose(); return;
    }
    const pending = current.pending ?? { command, generation: current.generation, values: { ...current.values } };
    update({ ...current, pending });
    inFlight.current = true; setSaving(true); setMessage("");
    let result: CompanyResult;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    try { result = await Promise.race([sendCompanyCommand(pending.command), new Promise<CompanyResult>((resolve) => { timeout = setTimeout(() => resolve({ status: "unavailable", message: "La confirmation prend trop de temps. Votre saisie est conservée ; réessayez la même commande." }), 15_000); })]); }
    catch { result = { status: "unavailable", message: "La confirmation n’a pas été reçue. Votre saisie est conservée. Réessayez pour vérifier l’enregistrement." }; }
    clearTimeout(timeout);
    inFlight.current = false;
    if (!active.current) return;
    setSaving(false);
    if (result.status === "success") {
      const latest = draftRef.current;
      if (latest.pending?.command.command_id !== pending.command.command_id) return;
      const next = acknowledge(latest, result.company);
      removeDraft(ownerId, latest.target);
      update(next);
      onSaved(result.company);
      setMessage(isDirty(next) ? "Enregistrement confirmé. Votre nouvelle saisie reste à enregistrer." : "Société enregistrée.");
      if (closeAfter && !isDirty(next)) onClose(); else { setClosing(false); onCancelClose(); }
    } else if (result.status === "unauthenticated" || result.status === "forbidden") {
      window.dispatchEvent(new Event("crm-session-denied"));
    } else {
      // An unavailable response may hide a committed transaction: keep its key.
      if (result.status !== "unavailable") update({ ...draftRef.current, pending: null });
      if (result.status === "validation") {
        const field = "name";
        form.setError(field, { type: "server", message: result.message });
        if (closing) invalidFocusAfterClose.current = field;
        else requestAnimationFrame(() => focusField(field));
      }
      if (result.status === "conflict") { setConflict(result); setConflictChoices({}); }
      setMessage(result.message);
      setClosing(false); onCancelClose();
    }
  };
  const resolveConflict = () => {
    if (!conflict || COMPANY_FIELDS.some(field => !conflictChoices[field])) return;
    const current = draftRef.current;
    const values = { ...current.values };
    for (const field of COMPANY_FIELDS) {
      if (conflictChoices[field] === "server") values[field] = conflict.company[field];
    }
    update({ ...current, base: conflict.company, values, pending: null, generation: current.generation + 1 });
    setConflict(null); setConflictChoices({}); setMessage("Choix préparés. Enregistrez pour confirmer vos changements.");
  };
  const cancelClose = () => { setClosing(false); onCancelClose(); };
  return <>
    {recoverable ? <div className="mx-5 rounded-md border p-4" role="status"><p className="font-medium">Une saisie est à reprendre</p><p className="mt-1 text-sm text-muted-foreground">Retrouvez le texte et les versions conservés dans cet onglet.</p><div className="mt-3 flex flex-wrap gap-2"><Button className="min-h-11" onClick={() => { update(recoverable); setRecoverable(null); setMessage(recoverable.pending ? "Une commande attend sa confirmation. Réessayez avant tout nouvel enregistrement." : "Brouillon repris."); }}>Reprendre la saisie</Button><Button className="min-h-11" variant="outline" onClick={() => { removeDraft(ownerId, recoverable.target); setRecoverable(null); }}>Abandonner le brouillon</Button></div></div> : null}
    <form className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 pb-5" onSubmit={(event) => { event.preventDefault(); save().catch(() => setMessage("Enregistrement indisponible. Votre saisie est conservée.")); }} aria-busy={saving}>
      <fieldset className="space-y-5" disabled={Boolean(recoverable) || !recoveryChecked}>
        <div className="space-y-2">
          <Label htmlFor="company-name">Nom de la société</Label>
          <Input id="company-name" autoComplete="organization" {...form.register("name")} value={draft.values.name}
            onChange={(event) => { form.setValue("name", event.target.value); form.clearErrors("name"); change("name", event.target.value); }}
            aria-invalid={Boolean(form.formState.errors.name)} aria-describedby={`company-name-help${form.formState.errors.name ? " company-name-error" : ""}`} className="h-11 text-base" />
          <p id="company-name-help" className="text-xs text-muted-foreground">200 caractères maximum. Enregistrez pour confirmer vos changements.</p>
          {form.formState.errors.name ? <p id="company-name-error" className="text-sm text-destructive" role="alert">{form.formState.errors.name.message}</p> : null}
        </div>
      </fieldset>
      {storageError ? <p role="alert" className="text-sm text-destructive">Le stockage de cet onglet est indisponible. Gardez cette page ouverte jusqu’à confirmation.</p> : null}
      {message ? <p role="status" aria-live="polite" className="text-sm" data-company-message>{message}</p> : null}
      {conflict ? <div className="space-y-3 rounded-md border p-4" role="alert"><p className="font-medium">Cette fiche a changé ailleurs</p>{COMPANY_FIELDS.map(field => <div key={field} className="space-y-2" data-conflict-field={field}><p className="break-words text-sm">{FIELD_LABELS[field]} enregistré : <strong className="whitespace-pre-wrap">{conflict.company[field] || "Vide"}</strong></p><div className="flex flex-wrap gap-2"><Button type="button" variant={conflictChoices[field] === "mine" ? "default" : "outline"} aria-pressed={conflictChoices[field] === "mine"} className="h-auto min-h-11 whitespace-normal" onClick={() => setConflictChoices(choices => ({ ...choices, [field]: "mine" }))}>Garder ma saisie pour {FIELD_LABELS[field]}</Button><Button type="button" variant={conflictChoices[field] === "server" ? "default" : "outline"} aria-pressed={conflictChoices[field] === "server"} className="h-auto min-h-11 whitespace-normal" onClick={() => setConflictChoices(choices => ({ ...choices, [field]: "server" }))}>Utiliser la version enregistrée pour {FIELD_LABELS[field]}</Button></div></div>)}<Button type="button" className="h-auto min-h-11 whitespace-normal" disabled={COMPANY_FIELDS.some(field => !conflictChoices[field])} onClick={resolveConflict}>Préparer ces choix</Button></div> : null}
      <div className="mt-auto flex flex-wrap gap-2 border-t pt-4"><Button type="submit" className="min-h-11" disabled={saving || Boolean(recoverable) || Boolean(conflict)}>{saving ? "Enregistrement…" : draft.pending ? "Réessayer la confirmation" : draft.base ? "Enregistrer" : "Ajouter"}</Button><Button type="button" variant="outline" className="min-h-11" onClick={requestClose}>Annuler</Button></div>
    </form>
    <Dialog open={closing} onOpenChange={(open) => { if (open) setClosing(true); else cancelClose(); }}><DialogContent ref={closeDialogRef} tabIndex={-1} showCloseButton={false} onCloseAutoFocus={(event) => {
      const field = invalidFocusAfterClose.current;
      if (field) { event.preventDefault(); invalidFocusAfterClose.current = null; focusField(field); }
    }} onOpenAutoFocus={(event) => { event.preventDefault(); closeDialogRef.current?.focus(); }}><DialogHeader><DialogTitle>Conserver votre saisie ?</DialogTitle><DialogDescription>Des changements ne sont pas encore confirmés.</DialogDescription></DialogHeader><DialogFooter className="sm:flex-wrap"><Button className="min-h-11" disabled={saving || Boolean(recoverable) || Boolean(conflict)} onClick={() => { save(true).catch(() => setMessage("Enregistrement indisponible.")); }}>Enregistrer</Button><Button className="min-h-11" variant="outline" disabled={saving} onClick={() => { removeDraft(ownerId, draftRef.current.target); if (recoverable) removeDraft(ownerId, recoverable.target); onClose(); }}>Abandonner</Button><Button className="min-h-11" variant="ghost" onClick={cancelClose}>Continuer la saisie</Button></DialogFooter></DialogContent></Dialog>
  </>;
}
