"use client"

import type React from "react"
import { useCallback, useEffect, useRef, useState } from "react"
import { FileDown, Loader2, Pencil } from "lucide-react"
import { toast } from "sonner"

import { ErrorState, LoadingState, errorText } from "@/components/common/states"
import ConsultationFields from "@/components/health/consultation-fields"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useAuth } from "@/contexts/auth-context"
import { santeApi, type Consultation } from "@/lib/api"
import { diffConsultation, validateConsultation, type ConsultationFormValues, type Errors } from "@/lib/consultation-form"
import { exportConsultationPdf } from "@/lib/consultation-pdf"
import { formatDate, isoToLocalInput } from "@/lib/format"

const toForm = (c: Consultation): ConsultationFormValues => ({
  date_consultation: isoToLocalInput(c.date_consultation),
  motif_consultation: c.motif_consultation,
  observations_diagnostic: c.observations_diagnostic,
  traitement_prescrit: c.traitement_prescrit,
  notes_medicales_supplementaires: c.notes_medicales_supplementaires ?? "",
  medecin_responsable_id: c.medecin_responsable_id,
})

/** F-S5 / F-S6 : détail, modification (patient inchangé, aucune suppression) et PDF depuis l'export tracé. */
export default function ConsultationModal({ consultationId, onClose, onChanged }: {
  consultationId: string | null
  onClose: () => void
  onChanged?: () => void
}) {
  const { user } = useAuth()
  const isAdmin = user?.role === "admin"
  const [consultation, setConsultation] = useState<Consultation | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [values, setValues] = useState<ConsultationFormValues | null>(null)
  const [errors, setErrors] = useState<Errors>({})
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)
  // F-20 : seule la dernière requête met à jour le détail (une réponse d'une consultation précédente est ignorée)
  const lastRequest = useRef(0)

  const load = useCallback(async () => {
    const request = ++lastRequest.current
    if (!consultationId) return
    setConsultation(null)
    setError(null)
    setEditing(false)
    try {
      const data = await santeApi.getConsultation(consultationId)
      if (request === lastRequest.current) setConsultation(data)
    } catch (err) {
      if (request === lastRequest.current) setError(errorText(err, "Consultation introuvable"))
    }
  }, [consultationId])

  useEffect(() => {
    load()
  }, [load])

  const startEdit = () => {
    if (!consultation) return
    setValues(toForm(consultation))
    setErrors({})
    setEditing(true)
  }

  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!consultation || !values) return
    const local = validateConsultation(values, false)
    setErrors(local)
    if (Object.keys(local).length) return
    const update = diffConsultation(consultation, values, isAdmin)
    if (Object.keys(update).length === 0) {
      setEditing(false)
      return
    }
    setSaving(true)
    try {
      setConsultation(await santeApi.updateConsultation(consultation.id, update))
      setEditing(false)
      toast.success("Consultation modifiée")
      onChanged?.()
    } catch (err) {
      setErrors({ _form: errorText(err, "Modification impossible") })
    } finally {
      setSaving(false)
    }
  }

  const exportPdf = async () => {
    if (!consultation) return
    setExporting(true)
    try {
      // Données exclusivement issues de l'export tracé côté serveur
      exportConsultationPdf(await santeApi.exportConsultation(consultation.id))
    } catch (err) {
      toast.error(errorText(err, "Export impossible"))
    } finally {
      setExporting(false)
    }
  }

  return (
    <Dialog open={!!consultationId} onOpenChange={(open) => !open && !saving && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Consultation</DialogTitle>
          <DialogDescription>
            {consultation ? `${consultation.patient_nom_prenoms ?? consultation.matricule} — ${formatDate(consultation.date_consultation, true)}` : "Chargement"}
          </DialogDescription>
        </DialogHeader>
        {error ? <ErrorState message={error} onRetry={load} /> : !consultation ? <LoadingState /> : editing && values ? (
          <form onSubmit={save} className="space-y-4" noValidate>
            <ConsultationFields idPrefix="edit-consultation" values={values} errors={errors} showMedecin={isAdmin}
              onChange={(field, value) => setValues((v) => (v ? { ...v, [field]: value } : v))} />
            {errors._form && <p className="text-sm text-destructive whitespace-pre-line" role="alert">{errors._form}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditing(false)} disabled={saving}>Annuler</Button>
              <Button type="submit" disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Enregistrer</Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-4 text-sm">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><dt className="text-muted-foreground">Matricule</dt><dd className="font-mono">{consultation.matricule}</dd></div>
              <div><dt className="text-muted-foreground">Médecin responsable</dt><dd>{consultation.medecin_responsable ?? "—"}</dd></div>
            </dl>
            {([
              ["Motif", consultation.motif_consultation],
              ["Observations / diagnostic", consultation.observations_diagnostic],
              ["Traitement prescrit", consultation.traitement_prescrit],
              ["Notes supplémentaires", consultation.notes_medicales_supplementaires ?? "—"],
            ] as const).map(([label, value]) => (
              <div key={label}>
                <p className="text-muted-foreground">{label}</p>
                <p className="whitespace-pre-line">{value}</p>
              </div>
            ))}
            <p className="text-xs text-muted-foreground">
              Saisie par {consultation.created_by} le {formatDate(consultation.created_at, true)} · modifiée le {formatDate(consultation.updated_at, true)}.
              L&apos;historique médical est conservé : aucune suppression possible.
            </p>
            <DialogFooter className="gap-2">
              <Button variant="outline" className="gap-2" onClick={startEdit}><Pencil className="h-4 w-4" />Modifier</Button>
              <Button className="gap-2" onClick={exportPdf} disabled={exporting}>
                {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}Fiche PDF
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
