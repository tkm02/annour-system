"use client"

import type React from "react"
import { useCallback, useEffect, useState } from "react"
import { FileDown, FilePlus2, Loader2 } from "lucide-react"
import { toast } from "react-hot-toast"

import SimpleBarChart, { recordToBars } from "@/components/common/bar-chart"
import Pager from "@/components/common/pager"
import { EmptyState, ErrorState, LoadingState, errorText } from "@/components/common/states"
import Field from "@/components/finance/field"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { financeApi, type RapportDetail, type RapportResponse } from "@/lib/api"
import { TYPES_RAPPORT, buildRapport, validateRapport, type Errors, type RapportForm } from "@/lib/finance-forms"
import { formatDate, formatMontant } from "@/lib/format"
import { exportRapportPdf } from "@/lib/rapport-pdf"

const LIMIT = 20
const emptyForm: RapportForm = { titre: "", type_rapport: "mensuel", periode_debut: "", periode_fin: "", commentaires: "" }
const typeLabel = (value: string) => TYPES_RAPPORT.find((t) => t.value === value)?.label ?? value

function GenerateDialog({ open, onClose, onGenerated }: { open: boolean; onClose: () => void; onGenerated: (numero: string) => void }) {
  const [form, setForm] = useState<RapportForm>(emptyForm)
  const [errors, setErrors] = useState<Errors>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(emptyForm)
      setErrors({})
    }
  }, [open])

  const set = (field: keyof RapportForm, value: string) => setForm((f) => ({ ...f, [field]: value }))

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    const local = validateRapport(form)
    setErrors(local)
    if (Object.keys(local).length) return
    setSaving(true)
    try {
      const rapport = await financeApi.generateRapport(buildRapport(form))
      toast.success(`Rapport ${rapport.numero} généré`)
      onGenerated(rapport.numero)
      onClose()
    } catch (err) {
      setErrors({ _form: errorText(err, "Génération impossible") })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !saving && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Générer un rapport</DialogTitle>
          <DialogDescription>Le rapport fige les totaux de la période choisie (dates incluses).</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4" noValidate>
          <Field id="rapport-titre" label="Titre *" error={errors.titre}>
            {(p) => <Input {...p} value={form.titre} maxLength={200} onChange={(e) => set("titre", e.target.value)} />}
          </Field>
          <Field id="rapport-type" label="Type *" error={errors.type_rapport}>
            {(p) => (
              <Select value={form.type_rapport} onValueChange={(v) => set("type_rapport", v)}>
                <SelectTrigger {...p}><SelectValue /></SelectTrigger>
                <SelectContent>{TYPES_RAPPORT.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            )}
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field id="rapport-debut" label="Du *" error={errors.periode_debut}>
              {(p) => <Input {...p} type="date" value={form.periode_debut} onChange={(e) => set("periode_debut", e.target.value)} />}
            </Field>
            <Field id="rapport-fin" label="Au *" error={errors.periode_fin}>
              {(p) => <Input {...p} type="date" value={form.periode_fin} onChange={(e) => set("periode_fin", e.target.value)} />}
            </Field>
          </div>
          <Field id="rapport-commentaires" label="Commentaires">
            {(p) => <Textarea {...p} rows={3} maxLength={2000} value={form.commentaires} onChange={(e) => set("commentaires", e.target.value)} />}
          </Field>
          {errors._form && <p className="text-sm text-destructive whitespace-pre-line" role="alert">{errors._form}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>Annuler</Button>
            <Button type="submit" disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Générer</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function RapportDialog({ numero, onClose }: { numero: string | null; onClose: () => void }) {
  const [detail, setDetail] = useState<RapportDetail | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!numero) return
    setDetail(null)
    setError(null)
    financeApi.getRapport(numero).then(setDetail).catch((err) => setError(errorText(err, "Rapport introuvable")))
  }, [numero])

  const repartition = (detail?.repartition_categories ?? {}) as { entrees?: Record<string, number>; sorties?: Record<string, number> }

  return (
    <Dialog open={!!numero} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{detail ? `${detail.rapport.numero} — ${detail.rapport.titre}` : numero}</DialogTitle>
          <DialogDescription>
            {detail ? `Du ${formatDate(detail.rapport.periode_debut)} au ${formatDate(detail.rapport.periode_fin)}` : "Chargement du rapport"}
          </DialogDescription>
        </DialogHeader>
        {error ? <ErrorState message={error} /> : !detail ? <LoadingState /> : (
          <div className="space-y-6">
            <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <div><dt className="text-muted-foreground">Entrées</dt><dd className="text-lg tabular-nums">{formatMontant(detail.rapport.total_entrees)}</dd></div>
              <div><dt className="text-muted-foreground">Sorties</dt><dd className="text-lg tabular-nums">{formatMontant(detail.rapport.total_sorties)}</dd></div>
              <div><dt className="text-muted-foreground">Solde</dt><dd className="text-lg tabular-nums">{formatMontant(detail.rapport.solde)}</dd></div>
            </dl>
            {detail.rapport.commentaires && <p className="text-sm">{detail.rapport.commentaires}</p>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2 text-sm">Entrées par catégorie</h3>
                <SimpleBarChart data={recordToBars(repartition.entrees)} seriesName="Entrées" formatValue={formatMontant} />
              </div>
              <div>
                <h3 className="font-semibold mb-2 text-sm">Sorties par catégorie</h3>
                <SimpleBarChart data={recordToBars(repartition.sorties)} seriesName="Sorties" formatValue={formatMontant} />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {detail.transactions_entrees.length} entrée(s) et {detail.transactions_sorties.length} sortie(s) sur la période.
            </p>
            <div className="flex justify-end">
              <Button className="gap-2" onClick={() => exportRapportPdf(detail)}><FileDown className="h-4 w-4" />Exporter en PDF</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default function RapportsPage() {
  const [type, setType] = useState("tous")
  const [annee, setAnnee] = useState("")
  const [page, setPage] = useState(1)
  const [items, setItems] = useState<RapportResponse[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const year = Number.parseInt(annee, 10)
      const res = await financeApi.getRapports({
        page, limit: LIMIT,
        type_rapport: type === "tous" ? undefined : type,
        annee: Number.isFinite(year) && annee.length === 4 ? year : undefined,
      })
      setItems(res.data)
      setTotal(res.total)
    } catch (err) {
      setError(errorText(err, "Liste des rapports indisponible"))
    } finally {
      setLoading(false)
    }
  }, [page, type, annee])

  useEffect(() => {
    load()
  }, [load])

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Rapports financiers</h1>
            <p className="text-muted-foreground">Rapports figés par période, exportables en PDF.</p>
          </div>
          <Button className="gap-2" onClick={() => setGenerating(true)}><FilePlus2 className="h-4 w-4" />Générer un rapport</Button>
        </div>
        <Card>
          <CardHeader className="flex flex-col sm:flex-row gap-3">
            <Select value={type} onValueChange={(v) => { setType(v); setPage(1) }}>
              <SelectTrigger className="sm:w-48" aria-label="Filtrer par type"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous les types</SelectItem>
                {TYPES_RAPPORT.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input className="sm:w-32" inputMode="numeric" maxLength={4} placeholder="Année" aria-label="Filtrer par année"
              value={annee} onChange={(e) => { setAnnee(e.target.value.replace(/\D/g, "")); setPage(1) }} />
          </CardHeader>
          <CardContent>
            {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={load} /> : items.length === 0 ? (
              <EmptyState message="Aucun rapport." />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Numéro</TableHead>
                      <TableHead>Titre</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Période</TableHead>
                      <TableHead className="text-right">Solde</TableHead>
                      <TableHead><span className="sr-only">Actions</span></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((r) => (
                      <TableRow key={r.numero}>
                        <TableCell className="font-mono text-xs">{r.numero}</TableCell>
                        <TableCell>{r.titre}</TableCell>
                        <TableCell>{typeLabel(r.type_rapport)}</TableCell>
                        <TableCell className="whitespace-nowrap">{formatDate(r.periode_debut)} → {formatDate(r.periode_fin)}</TableCell>
                        <TableCell className="text-right tabular-nums whitespace-nowrap">{formatMontant(r.solde)}</TableCell>
                        <TableCell><Button size="sm" variant="outline" onClick={() => setSelected(r.numero)}>Ouvrir</Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            <Pager page={page} limit={LIMIT} total={total} onPageChange={setPage} disabled={loading} />
          </CardContent>
        </Card>
      </div>
      <GenerateDialog open={generating} onClose={() => setGenerating(false)} onGenerated={(numero) => { load(); setSelected(numero) }} />
      <RapportDialog numero={selected} onClose={() => setSelected(null)} />
    </DashboardLayout>
  )
}
