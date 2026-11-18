"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "react-hot-toast"

import { errorText } from "@/components/common/states"
import ConsultationFields from "@/components/health/consultation-fields"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useAuth } from "@/contexts/auth-context"
import { ApiError, santeApi } from "@/lib/api"
import { buildConsultation, validateConsultation, type ConsultationFormValues, type Errors } from "@/lib/consultation-form"
import { nowLocalInput } from "@/lib/format"

const empty = (): ConsultationFormValues => ({
  date_consultation: nowLocalInput(),
  motif_consultation: "",
  observations_diagnostic: "",
  traitement_prescrit: "",
  notes_medicales_supplementaires: "",
  medecin_responsable_id: "",
})

/** F-S4 : nouvelle consultation. Un admin doit désigner le médecin ; un utilisateur « sante » l'est par défaut. */
export default function AddConsultationModal({ patient, onClose, onCreated }: {
  patient: { matricule: string; nom: string } | null
  onClose: () => void
  onCreated: () => void
}) {
  const { user } = useAuth()
  const isAdmin = user?.role === "admin"
  const [values, setValues] = useState<ConsultationFormValues>(empty)
  const [errors, setErrors] = useState<Errors>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (patient) {
      setValues(empty())
      setErrors({})
    }
  }, [patient])

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!patient) return
    const local = validateConsultation(values, isAdmin)
    setErrors(local)
    if (Object.keys(local).length) return
    setSaving(true)
    try {
      await santeApi.createConsultation(patient.matricule, buildConsultation(values, isAdmin))
      toast.success("Consultation enregistrée")
      onCreated()
      onClose()
    } catch (err) {
      if (err instanceof ApiError && Object.keys(err.fieldErrors).length) {
        const mapped: Errors = {}
        for (const [path, msg] of Object.entries(err.fieldErrors)) mapped[path.split(".").pop() || "_form"] = msg
        setErrors(mapped)
      } else {
        setErrors({ _form: errorText(err, "Enregistrement impossible") })
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={!!patient} onOpenChange={(open) => !open && !saving && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouvelle consultation</DialogTitle>
          <DialogDescription>{patient ? `${patient.nom} — ${patient.matricule}` : ""}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4" noValidate>
          <ConsultationFields idPrefix="new-consultation" values={values} errors={errors} showMedecin={isAdmin}
            onChange={(field, value) => setValues((v) => ({ ...v, [field]: value }))} />
          {errors._form && <p className="text-sm text-destructive whitespace-pre-line" role="alert">{errors._form}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>Annuler</Button>
            <Button type="submit" disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Enregistrer</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
