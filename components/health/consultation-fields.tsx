"use client"

import { useEffect, useState } from "react"
import Field from "@/components/finance/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { santeApi, type User } from "@/lib/api"
import { CLINICAL_MAX, type ConsultationFormValues, type Errors } from "@/lib/consultation-form"

/** Champs communs à la création et à la modification d'une consultation. */
export default function ConsultationFields({ values, errors, onChange, showMedecin, idPrefix }: {
  values: ConsultationFormValues
  errors: Errors
  onChange: (field: keyof ConsultationFormValues, value: string) => void
  showMedecin: boolean
  idPrefix: string
}) {
  const [medecins, setMedecins] = useState<User[] | null>(null)
  const [medecinsError, setMedecinsError] = useState<string | null>(null)

  useEffect(() => {
    if (!showMedecin) return
    santeApi.getMedecins().then(setMedecins).catch(() => setMedecinsError("Liste des médecins indisponible"))
  }, [showMedecin])

  // Borne « maintenant » calculée une fois (pas d'appel impur pendant le rendu) ; le serveur refuse le futur
  const [max] = useState(() => new Date(Date.now() - new Date().getTimezoneOffset() * 60_000).toISOString().slice(0, 16))

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field id={`${idPrefix}-date`} label="Date et heure *" error={errors.date_consultation}>
          {(p) => <Input {...p} type="datetime-local" max={max} value={values.date_consultation}
            onChange={(e) => onChange("date_consultation", e.target.value)} />}
        </Field>
        {showMedecin && (
          <Field id={`${idPrefix}-medecin`} label="Médecin responsable *" error={errors.medecin_responsable_id ?? medecinsError ?? undefined}>
            {(p) => (
              <Select value={values.medecin_responsable_id} onValueChange={(v) => onChange("medecin_responsable_id", v)}>
                <SelectTrigger {...p}><SelectValue placeholder={medecins ? (medecins.length ? "Choisir" : "Aucun compte santé actif") : "Chargement…"} /></SelectTrigger>
                <SelectContent>
                  {(medecins ?? []).map((m) => <SelectItem key={m.id} value={m.id}>{m.prenom} {m.nom}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </Field>
        )}
      </div>
      <Field id={`${idPrefix}-motif`} label="Motif de la consultation *" error={errors.motif_consultation}>
        {(p) => <Textarea {...p} rows={2} maxLength={CLINICAL_MAX} value={values.motif_consultation} onChange={(e) => onChange("motif_consultation", e.target.value)} />}
      </Field>
      <Field id={`${idPrefix}-observations`} label="Observations / diagnostic *" error={errors.observations_diagnostic}>
        {(p) => <Textarea {...p} rows={3} maxLength={CLINICAL_MAX} value={values.observations_diagnostic} onChange={(e) => onChange("observations_diagnostic", e.target.value)} />}
      </Field>
      <Field id={`${idPrefix}-traitement`} label="Traitement prescrit *" error={errors.traitement_prescrit}>
        {(p) => <Textarea {...p} rows={3} maxLength={CLINICAL_MAX} value={values.traitement_prescrit} onChange={(e) => onChange("traitement_prescrit", e.target.value)} />}
      </Field>
      <Field id={`${idPrefix}-notes`} label="Notes médicales supplémentaires" error={errors.notes_medicales_supplementaires}>
        {(p) => <Textarea {...p} rows={2} maxLength={CLINICAL_MAX} value={values.notes_medicales_supplementaires} onChange={(e) => onChange("notes_medicales_supplementaires", e.target.value)} />}
      </Field>
    </div>
  )
}
