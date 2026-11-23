"use client"

import type React from "react"
import { useMemo, useState } from "react"
import { Loader2, ShieldAlert } from "lucide-react"
import { toast } from "sonner"

import Field from "@/components/finance/field"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ApiError, recensementCoApi, type ParticipationCODetail } from "@/lib/api"
import {
  NOM_MAX, QUALITE_LABELS, SANTE_MAX, SEXE_LABELS, correctionApiErrors, correctionModifiee, diffCorrection,
  formFromDetail, premierChampEnErreur, santeEffacee, validateCorrection, type CorrectionForm, type Errors,
} from "@/lib/recensement-co"
import { ActionConfirm } from "./co-decision-dialogs"
import { apiErrorMessage } from "./co-shared"

const SANTE_LABELS = { allergies: "Allergies", antecedents_medicaux: "Antécédents médicaux" } as const

/** Focus sur le premier champ en erreur (après validation locale ou réponse 409/422). */
function focusFirstError(errors: Errors) {
  const field = premierChampEnErreur(errors)
  if (field) document.getElementById(`co-edit-${field}`)?.focus()
}

/** Correction d'une fiche par l'administration (PATCH partiel : seuls les champs modifiés sont envoyés). */
export default function CoCorrectionForm({ detail, commissions, onCancel, onSaved, onDirtyChange }: {
  detail: ParticipationCODetail
  /** Commissions actives de l'édition (valeurs acceptées par le serveur) */
  commissions: string[]
  onCancel: () => void
  /** Reçoit la fiche renvoyée par le PATCH (pas de nouvelle lecture des données de santé) */
  onSaved: (detail: ParticipationCODetail) => void
  onDirtyChange: (dirty: boolean) => void
}) {
  const initial = useMemo(() => formFromDetail(detail), [detail])
  const [form, setForm] = useState<CorrectionForm>(initial)
  const [errors, setErrors] = useState<Errors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [confirmSante, setConfirmSante] = useState(false)

  const commissionOptions = useMemo(
    () => (commissions.includes(initial.commission) || !initial.commission ? commissions : [initial.commission, ...commissions]),
    [commissions, initial.commission],
  )
  const set = (field: keyof CorrectionForm) => (value: string) => {
    const next = { ...form, [field]: value }
    setForm(next)
    onDirtyChange(correctionModifiee(next, initial))
    if (errors[field]) setErrors((e) => ({ ...e, [field]: "" }))
  }

  const save = async () => {
    setConfirmSante(false)
    const update = diffCorrection(form, initial)
    if (Object.keys(update).length === 0) {
      toast("Aucune modification à enregistrer")
      onDirtyChange(false)
      onCancel()
      return
    }
    setSaving(true)
    try {
      const saved = await recensementCoApi.update(detail.id, update)
      toast.success("Fiche corrigée")
      onDirtyChange(false)
      onSaved(saved)
    } catch (err) {
      if (err instanceof ApiError && (err.status === 409 || err.status === 422)) {
        const mapped = correctionApiErrors(err)
        setErrors(mapped.fieldErrors)
        setFormError(mapped.formError)
        setTimeout(() => focusFirstError(mapped.fieldErrors))
      } else {
        setFormError(apiErrorMessage(err, "Correction impossible"))
      }
    } finally {
      setSaving(false)
    }
  }

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    setFormError(null)
    const problems = validateCorrection(form, initial)
    setErrors(problems)
    if (Object.keys(problems).length > 0) {
      focusFirstError(problems)
      return
    }
    if (santeEffacee(form, initial).length > 0) setConfirmSante(true)
    else save()
  }

  const err = (field: keyof CorrectionForm) => errors[field] || undefined
  const text = (field: keyof CorrectionForm, label: string, props: React.ComponentProps<typeof Input> = {}) => (
    <Field id={`co-edit-${field}`} label={label} error={err(field)}>
      {(p) => <Input {...p} {...props} value={form[field]} disabled={saving} onChange={(e) => set(field)(e.target.value)} />}
    </Field>
  )
  const select = (field: "sexe" | "commission" | "qualite", label: string, options: Array<[string, string]>, placeholder: string, required = false, hint?: string) => (
    <Field id={`co-edit-${field}`} label={label} error={err(field)} hint={hint}>
      {(p) => (
        <Select value={form[field] || undefined} onValueChange={set(field)} disabled={saving}>
          <SelectTrigger {...p} aria-required={required || undefined} className="w-full"><SelectValue placeholder={placeholder} /></SelectTrigger>
          <SelectContent>
            {options.map(([code, text]) => <SelectItem key={code} value={code}>{text}</SelectItem>)}
          </SelectContent>
        </Select>
      )}
    </Field>
  )
  const effacees = santeEffacee(form, initial)

  return (
    <form onSubmit={submit} className="space-y-4" noValidate aria-label="Corriger la fiche">
      <p className="text-xs text-muted-foreground">* champ obligatoire. Seuls les champs modifiés sont contrôlés et envoyés.</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {text("nom", "Nom *", { maxLength: NOM_MAX, autoComplete: "off", "aria-required": true })}
        {text("prenoms", "Prénoms *", { maxLength: NOM_MAX, autoComplete: "off", "aria-required": true })}
        {text("date_naissance", "Date de naissance", { type: "date" })}
        {select("sexe", "Sexe", Object.entries(SEXE_LABELS), "Non renseigné")}
        {text("telephone", "Téléphone", { type: "tel", maxLength: 25, inputMode: "tel" })}
        {text("email", "Email", { type: "email", maxLength: 254 })}
        {select("commission", "Commission *", commissionOptions.map((c) => [c, c]), "Choisir", true,
          commissions.length === 0 ? "Liste des commissions indisponible : seule la commission actuelle est proposée." : undefined)}
        {select("qualite", "Qualité *", Object.entries(QUALITE_LABELS), "Choisir", true)}
      </div>

      <fieldset className="space-y-4 rounded-lg border border-destructive/40 p-4">
        <legend className="flex items-center gap-2 px-1 text-sm font-semibold">
          <ShieldAlert className="h-4 w-4 text-destructive" aria-hidden="true" /> Données de santé — confidentiel
        </legend>
        {(["allergies", "antecedents_medicaux"] as const).map((field) => (
          <Field key={field} id={`co-edit-${field}`} label={SANTE_LABELS[field]} error={err(field)} hint="Laisser vide pour effacer.">
            {(p) => <Textarea {...p} rows={2} maxLength={SANTE_MAX} value={form[field]} disabled={saving}
              onChange={(e) => set(field)(e.target.value)} />}
          </Field>
        ))}
      </fieldset>

      {formError && <p className="whitespace-pre-line text-sm text-destructive" role="alert">{formError}</p>}
      <div className="sticky bottom-0 -mx-6 -mb-6 flex flex-col-reverse gap-2 border-t bg-background px-6 py-4 sm:static sm:m-0 sm:flex-row sm:justify-end sm:p-0 sm:pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>Annuler</Button>
        <Button type="submit" disabled={saving} className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}Enregistrer la correction
        </Button>
      </div>

      <ActionConfirm open={confirmSante} onCancel={() => setConfirmSante(false)} onConfirm={save}
        title="Effacer des données de santé ?" confirmLabel="Effacer et enregistrer" cancelLabel="Revenir au formulaire"
        description={<p>Ces informations seront supprimées de la fiche : {effacees.map((f) => SANTE_LABELS[f]).join(", ")}.</p>} />
    </form>
  )
}
