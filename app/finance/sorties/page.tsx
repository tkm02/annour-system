"use client"

import type React from "react"
import { useCallback, useEffect, useState } from "react"
import { History, Loader2, Pencil, Plus, RotateCcw, Search, Trash2 } from "lucide-react"
import { toast } from "react-hot-toast"

import Pager from "@/components/common/pager"
import { EmptyState, ErrorState, LoadingState, errorText } from "@/components/common/states"
import Field from "@/components/finance/field"
import DashboardLayout from "@/components/layout/dashboard-layout"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { ApiError, financeApi, type AuditLogResponse, type TransactionResponse } from "@/lib/api"
import {
  CATEGORIES_SORTIE, DELETE_REASON_MIN, MODES_PAIEMENT, buildSortie, diffSortie, validateDeleteReason, validateSortie,
  type Errors, type SortieForm,
} from "@/lib/finance-forms"
import { dayEndIso, dayStartIso, formatDate, formatMontant, isoToLocalInput } from "@/lib/format"

const LIMIT = 20

const emptySortie: SortieForm = { categorie: "", montant: "", libelle: "", beneficiaire: "", mode_paiement: "Espèces", date_transaction: "" }

const fromTransaction = (t: TransactionResponse): SortieForm => ({
  categorie: t.categorie,
  montant: String(t.montant),
  libelle: t.libelle,
  beneficiaire: t.beneficiaire ?? "",
  mode_paiement: t.mode_paiement,
  date_transaction: isoToLocalInput(t.date_transaction),
})

const mapFieldErrors = (err: unknown): Errors => {
  if (err instanceof ApiError && Object.keys(err.fieldErrors).length) {
    const mapped: Errors = {}
    for (const [path, msg] of Object.entries(err.fieldErrors)) mapped[path.split(".").pop() || "_form"] = msg
    return mapped
  }
  return { _form: errorText(err, "Enregistrement impossible") }
}

function SortieDialog({ open, editing, onClose, onSaved }: {
  open: boolean
  editing: TransactionResponse | null
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState<SortieForm>(emptySortie)
  const [errors, setErrors] = useState<Errors>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(editing ? fromTransaction(editing) : emptySortie)
      setErrors({})
    }
  }, [open, editing])

  const set = (field: keyof SortieForm, value: string) => setForm((f) => ({ ...f, [field]: value }))

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    const local = validateSortie(form)
    setErrors(local)
    if (Object.keys(local).length) return
    setSaving(true)
    try {
      if (editing) {
        const update = diffSortie(editing, form)
        if (Object.keys(update).length === 0) {
          toast("Aucune modification")
          onClose()
          return
        }
        await financeApi.updateSortie(editing.reference, update)
        toast.success("Sortie modifiée")
      } else {
        const created = await financeApi.createSortie(buildSortie(form))
        toast.success(`Sortie enregistrée — ${created.reference}`)
      }
      onSaved()
      onClose()
    } catch (err) {
      setErrors(mapFieldErrors(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !saving && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? `Modifier la sortie ${editing.reference}` : "Nouvelle sortie"}</DialogTitle>
          <DialogDescription>Les champs marqués * sont obligatoires.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4" noValidate>
          <Field id="sortie-categorie" label="Catégorie *" error={errors.categorie} hint="Choisir dans la liste ou saisir une catégorie">
            {(p) => (
              <>
                <Input {...p} list="categories-sortie" value={form.categorie} maxLength={100} onChange={(e) => set("categorie", e.target.value)} />
                <datalist id="categories-sortie">{CATEGORIES_SORTIE.map((c) => <option key={c} value={c} />)}</datalist>
              </>
            )}
          </Field>
          <Field id="sortie-montant" label="Montant (F) *" error={errors.montant}>
            {(p) => <Input {...p} inputMode="decimal" value={form.montant} onChange={(e) => set("montant", e.target.value)} />}
          </Field>
          <Field id="sortie-libelle" label="Libellé *" error={errors.libelle}>
            {(p) => <Input {...p} value={form.libelle} maxLength={200} onChange={(e) => set("libelle", e.target.value)} />}
          </Field>
          <Field id="sortie-beneficiaire" label="Bénéficiaire" error={errors.beneficiaire}>
            {(p) => <Input {...p} value={form.beneficiaire} maxLength={200} onChange={(e) => set("beneficiaire", e.target.value)} />}
          </Field>
          <Field id="sortie-mode" label="Mode de paiement" error={errors.mode_paiement}>
            {(p) => (
              <Select value={form.mode_paiement} onValueChange={(v) => set("mode_paiement", v)}>
                <SelectTrigger {...p}><SelectValue /></SelectTrigger>
                <SelectContent>{MODES_PAIEMENT.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
            )}
          </Field>
          <Field id="sortie-date" label="Date" error={errors.date_transaction} hint={editing ? undefined : "Laisser vide pour maintenant"}>
            {(p) => <Input {...p} type="datetime-local" value={form.date_transaction} onChange={(e) => set("date_transaction", e.target.value)} />}
          </Field>
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

function DeleteDialog({ target, onClose, onDeleted }: { target: TransactionResponse | null; onClose: () => void; onDeleted: () => void }) {
  const [reason, setReason] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setReason("")
    setError(null)
  }, [target])

  const confirm = async () => {
    if (!target) return
    const problem = validateDeleteReason(reason)
    setError(problem)
    if (problem) return
    setSaving(true)
    try {
      await financeApi.deleteSortie(target.reference, reason.trim())
      toast.success("Sortie placée dans la corbeille")
      onDeleted()
      onClose()
    } catch (err) {
      setError(errorText(err, "Suppression impossible"))
    } finally {
      setSaving(false)
    }
  }

  return (
    <AlertDialog open={!!target} onOpenChange={(o) => !o && !saving && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer la sortie {target?.reference} ?</AlertDialogTitle>
          <AlertDialogDescription>
            {target && `${target.libelle} — ${formatMontant(target.montant)}. `}
            La sortie est placée dans la corbeille (restaurable) ; elle ne pourra plus être modifiée.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2">
          <Label htmlFor="delete-reason">Motif de suppression * ({DELETE_REASON_MIN} caractères minimum)</Label>
          <Textarea id="delete-reason" rows={3} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)}
            aria-invalid={error ? true : undefined} aria-describedby={error ? "delete-reason-error" : undefined} />
          {error && <p id="delete-reason-error" className="text-sm text-destructive" role="alert">{error}</p>}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={saving}>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={(e) => { e.preventDefault(); confirm() }} disabled={saving}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Supprimer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

const ACTION_LABELS: Record<string, string> = { CREATE: "Création", UPDATE: "Modification", DELETE: "Suppression", RESTORE: "Restauration" }

function AuditDialog({ reference, onClose }: { reference: string | null; onClose: () => void }) {
  const [logs, setLogs] = useState<AuditLogResponse[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!reference) return
    setLogs(null)
    setError(null)
    financeApi.getAudit(reference).then(setLogs).catch((err) => setError(errorText(err, "Historique indisponible")))
  }, [reference])

  return (
    <Dialog open={!!reference} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Historique — {reference}</DialogTitle>
          <DialogDescription>Toutes les actions tracées sur cette opération.</DialogDescription>
        </DialogHeader>
        {error ? <ErrorState message={error} /> : !logs ? <LoadingState /> : logs.length === 0 ? (
          <EmptyState message="Aucune action tracée." />
        ) : (
          <ul className="space-y-2">
            {logs.map((log) => (
              <li key={log.id} className="rounded-md border p-3 text-sm">
                <p className="font-medium">
                  {ACTION_LABELS[log.action] ?? log.action} — {formatDate(log.modified_at, true)} — {log.modified_by}
                </p>
                {log.field_changed && (
                  <p className="text-muted-foreground">
                    {log.field_changed} : {log.old_value ?? "—"} → {log.new_value ?? "—"}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  )
}

function SortiesList({ onEdit, onDelete, onAudit, refreshKey }: {
  onEdit: (t: TransactionResponse) => void
  onDelete: (t: TransactionResponse) => void
  onAudit: (reference: string) => void
  refreshKey: number
}) {
  const [filters, setFilters] = useState({ categorie: "", date_debut: "", date_fin: "", search: "" })
  const [applied, setApplied] = useState(filters)
  const [page, setPage] = useState(1)
  const [items, setItems] = useState<TransactionResponse[]>([])
  const [totals, setTotals] = useState({ total: 0, total_sorties: 0, solde_periode: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await financeApi.getSorties({
        page, limit: LIMIT,
        categorie: applied.categorie || undefined,
        search: applied.search || undefined,
        date_debut: applied.date_debut ? dayStartIso(applied.date_debut) : undefined,
        date_fin: applied.date_fin ? dayEndIso(applied.date_fin) : undefined,
      })
      setItems(res.data)
      setTotals({ total: res.total, total_sorties: res.total_sorties, solde_periode: res.solde_periode })
    } catch (err) {
      setError(errorText(err, "Liste des sorties indisponible"))
    } finally {
      setLoading(false)
    }
  }, [page, applied])

  useEffect(() => {
    load()
  }, [load, refreshKey])

  return (
    <Card>
      <CardHeader className="space-y-4">
        <form className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end" role="search"
          onSubmit={(e) => { e.preventDefault(); setPage(1); setApplied(filters) }}>
          <div className="space-y-1 md:col-span-2">
            <Label htmlFor="sorties-search">Recherche</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <Input id="sorties-search" className="pl-9" value={filters.search} placeholder="Libellé, bénéficiaire…"
                onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="sorties-categorie">Catégorie</Label>
            <Input id="sorties-categorie" list="categories-sortie-filtre" value={filters.categorie}
              onChange={(e) => setFilters({ ...filters, categorie: e.target.value })} />
            <datalist id="categories-sortie-filtre">{CATEGORIES_SORTIE.map((c) => <option key={c} value={c} />)}</datalist>
          </div>
          <div className="space-y-1">
            <Label htmlFor="sorties-debut">Du</Label>
            <Input id="sorties-debut" type="date" value={filters.date_debut} onChange={(e) => setFilters({ ...filters, date_debut: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="sorties-fin">Au</Label>
            <Input id="sorties-fin" type="date" value={filters.date_fin} onChange={(e) => setFilters({ ...filters, date_fin: e.target.value })} />
          </div>
          <div className="md:col-span-5 flex justify-end">
            <Button type="submit" variant="outline">Filtrer</Button>
          </div>
        </form>
        <CardTitle className="text-base flex flex-wrap gap-x-6 gap-y-1">
          <span>Total des sorties : <span className="tabular-nums">{formatMontant(totals.total_sorties)}</span></span>
          <span>Solde de la période : <span className="tabular-nums">{formatMontant(totals.solde_periode)}</span></span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={load} /> : items.length === 0 ? (
          <EmptyState message="Aucune sortie pour ces filtres." />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Référence</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Libellé</TableHead>
                  <TableHead className="hidden md:table-cell">Bénéficiaire</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead><span className="sr-only">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((t) => (
                  <TableRow key={t.reference}>
                    <TableCell className="whitespace-nowrap">{formatDate(t.date_transaction)}</TableCell>
                    <TableCell className="font-mono text-xs">{t.reference}</TableCell>
                    <TableCell>{t.categorie}</TableCell>
                    <TableCell>{t.libelle}</TableCell>
                    <TableCell className="hidden md:table-cell">{t.beneficiaire ?? "—"}</TableCell>
                    <TableCell className="text-right tabular-nums whitespace-nowrap">{formatMontant(t.montant)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 justify-end">
                        <Button size="icon" variant="ghost" aria-label={`Modifier ${t.reference}`} onClick={() => onEdit(t)}><Pencil className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" aria-label={`Historique de ${t.reference}`} onClick={() => onAudit(t.reference)}><History className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" className="text-destructive" aria-label={`Supprimer ${t.reference}`} onClick={() => onDelete(t)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        <Pager page={page} limit={LIMIT} total={totals.total} onPageChange={setPage} disabled={loading} />
      </CardContent>
    </Card>
  )
}

function Corbeille({ onAudit, onRestored, refreshKey }: { onAudit: (reference: string) => void; onRestored: () => void; refreshKey: number }) {
  const [page, setPage] = useState(1)
  const [items, setItems] = useState<TransactionResponse[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [restoring, setRestoring] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await financeApi.getDeletedSorties(page, LIMIT)
      setItems(res.data)
      setTotal(res.total)
    } catch (err) {
      setError(errorText(err, "Corbeille indisponible"))
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    load()
  }, [load, refreshKey])

  const restore = async (reference: string) => {
    setRestoring(reference)
    try {
      await financeApi.restoreSortie(reference)
      toast.success(`Sortie ${reference} restaurée`)
      load()
      onRestored()
    } catch (err) {
      toast.error(errorText(err, "Restauration impossible"))
    } finally {
      setRestoring(null)
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={load} /> : items.length === 0 ? (
          <EmptyState message="La corbeille est vide." />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Référence</TableHead>
                  <TableHead>Libellé</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead>Supprimée le / par</TableHead>
                  <TableHead>Motif</TableHead>
                  <TableHead><span className="sr-only">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((t) => (
                  <TableRow key={t.reference}>
                    <TableCell className="font-mono text-xs">{t.reference}</TableCell>
                    <TableCell>{t.libelle}</TableCell>
                    <TableCell className="text-right tabular-nums whitespace-nowrap">{formatMontant(t.montant)}</TableCell>
                    <TableCell className="whitespace-nowrap">{formatDate(t.deleted_at, true)} — {t.deleted_by ?? "—"}</TableCell>
                    <TableCell className="max-w-xs">{t.deleted_reason ?? "—"}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 justify-end">
                        <Button size="icon" variant="ghost" aria-label={`Historique de ${t.reference}`} onClick={() => onAudit(t.reference)}><History className="h-4 w-4" /></Button>
                        <Button size="sm" variant="outline" className="gap-1" disabled={restoring === t.reference} onClick={() => restore(t.reference)}>
                          {restoring === t.reference ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}Restaurer
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        <Pager page={page} limit={LIMIT} total={total} onPageChange={setPage} disabled={loading} />
      </CardContent>
    </Card>
  )
}

export default function SortiesPage() {
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<TransactionResponse | null>(null)
  const [deleting, setDeleting] = useState<TransactionResponse | null>(null)
  const [audit, setAudit] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const refresh = () => setRefreshKey((k) => k + 1)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Sorties</h1>
            <p className="text-muted-foreground">Dépenses du séminaire. Une suppression passe par la corbeille.</p>
          </div>
          <Button className="gap-2" onClick={() => { setEditing(null); setFormOpen(true) }}><Plus className="h-4 w-4" />Nouvelle sortie</Button>
        </div>
        <Tabs defaultValue="sorties">
          <TabsList>
            <TabsTrigger value="sorties">Sorties</TabsTrigger>
            <TabsTrigger value="corbeille">Corbeille</TabsTrigger>
          </TabsList>
          <TabsContent value="sorties">
            <SortiesList refreshKey={refreshKey} onEdit={(t) => { setEditing(t); setFormOpen(true) }} onDelete={setDeleting} onAudit={setAudit} />
          </TabsContent>
          <TabsContent value="corbeille">
            <Corbeille refreshKey={refreshKey} onAudit={setAudit} onRestored={refresh} />
          </TabsContent>
        </Tabs>
      </div>
      <SortieDialog open={formOpen} editing={editing} onClose={() => setFormOpen(false)} onSaved={refresh} />
      <DeleteDialog target={deleting} onClose={() => setDeleting(null)} onDeleted={refresh} />
      <AuditDialog reference={audit} onClose={() => setAudit(null)} />
    </DashboardLayout>
  )
}
