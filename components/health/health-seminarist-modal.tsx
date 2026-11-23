"use client"

import type React from "react"
import { useCallback, useEffect, useState } from "react"
import { Loader2, Pencil, Plus, User } from "lucide-react"
import { toast } from "sonner"

import Pager from "@/components/common/pager"
import { EmptyState, ErrorState, LoadingState, errorText } from "@/components/common/states"
import Field from "@/components/finance/field"
import AddConsultationModal from "@/components/health/add-consultation-modal"
import ConsultationModal from "@/components/health/consultation-modal"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { santeApi, type Consultation, type FicheMedicale } from "@/lib/api"
import { diffInformations, type InfosFormValues } from "@/lib/consultation-form"
import { formatDate } from "@/lib/format"

const LIMIT = 10

function InfosForm({ fiche, onSaved, onCancel }: { fiche: FicheMedicale; onSaved: (f: FicheMedicale) => void; onCancel: () => void }) {
  const [values, setValues] = useState<InfosFormValues>({
    contact_parent: fiche.informations_medicales.contact_parent,
    allergies: fiche.informations_medicales.allergies ?? "",
    antecedents_medicaux: fiche.informations_medicales.antecedents_medicaux ?? "",
    date_naissance: fiche.patient.date_naissance ?? "",
  })
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const set = (field: keyof InfosFormValues, value: string) => setValues((v) => ({ ...v, [field]: value }))

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    const { update, error: problem } = diffInformations(
      { ...fiche.informations_medicales, date_naissance: fiche.patient.date_naissance },
      values,
    )
    if (problem) {
      if (problem === "Aucune modification") onCancel()
      else setError(problem)
      return
    }
    setSaving(true)
    try {
      onSaved(await santeApi.updateInformations(fiche.patient.matricule, update))
      toast.success("Informations médicales mises à jour")
    } catch (err) {
      setError(errorText(err, "Mise à jour impossible"))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3" noValidate>
      <Field id="infos-contact" label="Contact du parent *">
        {(p) => <Input {...p} type="tel" maxLength={30} value={values.contact_parent} onChange={(e) => set("contact_parent", e.target.value)} />}
      </Field>
      <Field id="infos-naissance" label="Date de naissance">
        {(p) => <Input {...p} type="date" max={new Date().toISOString().slice(0, 10)} value={values.date_naissance} onChange={(e) => set("date_naissance", e.target.value)} />}
      </Field>
      <Field id="infos-allergies" label="Allergies" hint="Vider le champ pour effacer">
        {(p) => <Textarea {...p} rows={2} maxLength={2000} value={values.allergies} onChange={(e) => set("allergies", e.target.value)} />}
      </Field>
      <Field id="infos-antecedents" label="Antécédents médicaux" hint="Vider le champ pour effacer">
        {(p) => <Textarea {...p} rows={2} maxLength={2000} value={values.antecedents_medicaux} onChange={(e) => set("antecedents_medicaux", e.target.value)} />}
      </Field>
      {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>Annuler</Button>
        <Button type="submit" disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Enregistrer</Button>
      </div>
    </form>
  )
}

/** F-S2 / F-S3 / F-S4 : fiche médicale du patient, informations médicales et historique des consultations. */
export default function HealthSeminaristModal({ matricule, onClose }: { matricule: string | null; onClose: () => void }) {
  const [fiche, setFiche] = useState<FicheMedicale | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [editingInfos, setEditingInfos] = useState(false)
  const [consultations, setConsultations] = useState<Consultation[] | null>(null)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [consultError, setConsultError] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)

  const loadFiche = useCallback(async () => {
    if (!matricule) return
    setFiche(null)
    setError(null)
    setEditingInfos(false)
    try {
      setFiche(await santeApi.getFiche(matricule))
    } catch (err) {
      setError(errorText(err, "Fiche médicale indisponible"))
    }
  }, [matricule])

  const loadConsultations = useCallback(async () => {
    if (!matricule) return
    setConsultError(null)
    try {
      const res = await santeApi.getPatientConsultations(matricule, page, LIMIT)
      setConsultations(res.data)
      setTotal(res.total)
    } catch (err) {
      setConsultError(errorText(err, "Historique indisponible"))
    }
  }, [matricule, page])

  useEffect(() => {
    setPage(1)
    loadFiche()
  }, [loadFiche])

  useEffect(() => {
    loadConsultations()
  }, [loadConsultations])

  const p = fiche?.patient
  const infos = fiche?.informations_medicales

  return (
    <Dialog open={!!matricule} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Fiche médicale</DialogTitle>
          <DialogDescription>{p ? `${p.nom_prenoms} — ${p.matricule}` : matricule}</DialogDescription>
        </DialogHeader>
        {error ? <ErrorState message={error} onRetry={loadFiche} /> : !fiche || !p || !infos ? <LoadingState /> : (
          <div className="space-y-6">
            <section className="flex flex-col sm:flex-row gap-4">
              {p.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.photo_url} alt={`Photo de ${p.nom_prenoms}`} className="w-24 h-28 object-cover rounded-md border" />
              ) : (
                <div className="w-24 h-28 rounded-md border bg-muted flex items-center justify-center" aria-label="Aucune photo">
                  <User className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
                </div>
              )}
              <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm flex-1">
                <div><dt className="text-muted-foreground">Sexe</dt><dd>{p.sexe === "F" ? "Féminin" : "Masculin"}</dd></div>
                <div>
                  <dt className="text-muted-foreground">{p.date_naissance ? "Date de naissance" : "Âge"}</dt>
                  <dd>{p.date_naissance ? `${formatDate(p.date_naissance)} (${p.age} ans)` : `${p.age} ans`}</dd>
                </div>
                <div><dt className="text-muted-foreground">Niveau (séminaire)</dt><dd>{p.niveau || "Non attribué"}</dd></div>
                <div><dt className="text-muted-foreground">Niveau scolaire</dt><dd>{p.niveau_scolaire}</dd></div>
                <div><dt className="text-muted-foreground">Dortoir</dt><dd>{p.dortoir ?? p.dortoir_code}</dd></div>
                <div><dt className="text-muted-foreground">Consultations</dt><dd>{fiche.nombre_consultations}</dd></div>
              </dl>
            </section>

            <section className="space-y-3 border-t pt-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Informations médicales</h3>
                {!editingInfos && (
                  <Button size="sm" variant="outline" className="gap-1" onClick={() => setEditingInfos(true)}><Pencil className="h-4 w-4" />Modifier</Button>
                )}
              </div>
              {editingInfos ? (
                <InfosForm fiche={fiche} onCancel={() => setEditingInfos(false)} onSaved={(f) => { setFiche(f); setEditingInfos(false) }} />
              ) : (
                <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                  <div><dt className="text-muted-foreground">Contact du parent</dt><dd>{infos.contact_parent}</dd></div>
                  <div><dt className="text-muted-foreground">Allergies</dt><dd className="whitespace-pre-line">{infos.allergies || "—"}</dd></div>
                  <div><dt className="text-muted-foreground">Antécédents</dt><dd className="whitespace-pre-line">{infos.antecedents_medicaux || "—"}</dd></div>
                </dl>
              )}
            </section>

            <section className="space-y-3 border-t pt-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Consultations (plus récente d&apos;abord)</h3>
                <Button size="sm" className="gap-1" onClick={() => setAdding(true)}><Plus className="h-4 w-4" />Nouvelle consultation</Button>
              </div>
              {consultError ? <ErrorState message={consultError} onRetry={loadConsultations} /> : !consultations ? <LoadingState /> : consultations.length === 0 ? (
                <EmptyState message="Aucune consultation." />
              ) : (
                <ul className="divide-y">
                  {consultations.map((c) => (
                    <li key={c.id}>
                      <button type="button" onClick={() => setSelected(c.id)} className="w-full text-left py-2 px-2 rounded-md hover:bg-muted/50">
                        <p className="font-medium">{formatDate(c.date_consultation, true)} — {c.medecin_responsable ?? "—"}</p>
                        <p className="text-sm text-muted-foreground truncate">{c.motif_consultation}</p>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {total > LIMIT && <Pager page={page} limit={LIMIT} total={total} onPageChange={setPage} />}
            </section>
          </div>
        )}
        <AddConsultationModal
          patient={adding && p ? { matricule: p.matricule, nom: p.nom_prenoms } : null}
          onClose={() => setAdding(false)}
          onCreated={() => { loadConsultations(); loadFiche() }}
        />
        <ConsultationModal consultationId={selected} onClose={() => setSelected(null)} onChanged={loadConsultations} />
      </DialogContent>
    </Dialog>
  )
}
