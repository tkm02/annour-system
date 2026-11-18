"use client"

import type React from "react"
import { useCallback, useEffect, useState } from "react"
import { Gift, Loader2, ShoppingCart } from "lucide-react"
import { toast } from "react-hot-toast"

import Pager from "@/components/common/pager"
import { EmptyState, ErrorState, LoadingState, errorText } from "@/components/common/states"
import Field from "@/components/finance/field"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { ApiError, financeApi, type TransactionResponse } from "@/lib/api"
import { MODES_PAIEMENT, buildDon, buildVente, validateEntree, type EntreeForm, type Errors } from "@/lib/finance-forms"
import { formatDate, formatMontant } from "@/lib/format"

const LIMIT = 20
const CATEGORIES = ["Inscription", "Don", "Vente"]

const emptyForm = (kind: "don" | "vente"): EntreeForm => ({
  kind, montant: "", donateur: "", libelle: "", description: "",
  mode_paiement: kind === "don" ? "Wave" : "Espèces", date_transaction: "",
})

function EntreeDialog({ kind, onClose, onCreated }: { kind: "don" | "vente" | null; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState<EntreeForm>(emptyForm("don"))
  const [errors, setErrors] = useState<Errors>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (kind) {
      setForm(emptyForm(kind))
      setErrors({})
    }
  }, [kind])

  const set = (field: keyof EntreeForm, value: string) => setForm((f) => ({ ...f, [field]: value }))

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    const local = validateEntree(form)
    setErrors(local)
    if (Object.keys(local).length) return
    setSaving(true)
    try {
      const created = form.kind === "don" ? await financeApi.createDon(buildDon(form)) : await financeApi.createVente(buildVente(form))
      toast.success(`${form.kind === "don" ? "Don" : "Vente"} enregistré(e) — ${created.reference}`)
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
    <Dialog open={!!kind} onOpenChange={(open) => !open && !saving && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{kind === "vente" ? "Nouvelle vente" : "Nouveau don"}</DialogTitle>
          <DialogDescription>Les champs marqués * sont obligatoires.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4" noValidate>
          <Field id="entree-montant" label="Montant (F) *" error={errors.montant}>
            {(p) => <Input {...p} inputMode="decimal" value={form.montant} onChange={(e) => set("montant", e.target.value)} />}
          </Field>
          {form.kind === "don" ? (
            <Field id="entree-donateur" label="Donateur *" error={errors.donateur}>
              {(p) => <Input {...p} value={form.donateur} maxLength={200} onChange={(e) => set("donateur", e.target.value)} />}
            </Field>
          ) : (
            <Field id="entree-libelle" label="Libellé *" error={errors.libelle}>
              {(p) => <Input {...p} value={form.libelle} maxLength={200} onChange={(e) => set("libelle", e.target.value)} />}
            </Field>
          )}
          <Field id="entree-mode" label="Mode de paiement">
            {(p) => (
              <Select value={form.mode_paiement} onValueChange={(v) => set("mode_paiement", v)}>
                <SelectTrigger {...p}><SelectValue /></SelectTrigger>
                <SelectContent>{MODES_PAIEMENT.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
            )}
          </Field>
          <Field id="entree-date" label="Date" error={errors.date_transaction} hint="Laisser vide pour maintenant">
            {(p) => <Input {...p} type="datetime-local" value={form.date_transaction} onChange={(e) => set("date_transaction", e.target.value)} />}
          </Field>
          <Field id="entree-description" label="Description">
            {(p) => <Textarea {...p} rows={2} maxLength={1000} value={form.description} onChange={(e) => set("description", e.target.value)} />}
          </Field>
          {errors._form && <p className="text-sm text-destructive" role="alert">{errors._form}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>Annuler</Button>
            <Button type="submit" disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Enregistrer</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function EntreeDetail({ reference, onClose }: { reference: string | null; onClose: () => void }) {
  const [detail, setDetail] = useState<TransactionResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!reference) return
    setDetail(null)
    setError(null)
    financeApi.getEntree(reference).then(setDetail).catch((err) => setError(errorText(err, "Entrée introuvable")))
  }, [reference])

  return (
    <Dialog open={!!reference} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Entrée {reference}</DialogTitle>
          <DialogDescription>Détail de l&apos;opération.</DialogDescription>
        </DialogHeader>
        {error ? <ErrorState message={error} /> : !detail ? <LoadingState /> : (
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <dt className="text-muted-foreground">Catégorie</dt><dd>{detail.categorie}</dd>
            <dt className="text-muted-foreground">Montant</dt><dd className="tabular-nums">{formatMontant(detail.montant)}</dd>
            <dt className="text-muted-foreground">Libellé</dt><dd>{detail.libelle}</dd>
            <dt className="text-muted-foreground">Payeur</dt><dd>{detail.payeur ?? detail.nom_seminariste ?? "—"}</dd>
            <dt className="text-muted-foreground">Matricule</dt><dd>{detail.matricule ?? "—"}</dd>
            <dt className="text-muted-foreground">Mode</dt><dd>{detail.mode_paiement}</dd>
            <dt className="text-muted-foreground">Date</dt><dd>{formatDate(detail.date_transaction, true)}</dd>
            <dt className="text-muted-foreground">Description</dt><dd>{detail.description ?? "—"}</dd>
            <dt className="text-muted-foreground">Saisie par</dt><dd>{detail.created_by}</dd>
          </dl>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default function EntreesPage() {
  const [categorie, setCategorie] = useState("toutes")
  const [page, setPage] = useState(1)
  const [items, setItems] = useState<TransactionResponse[]>([])
  const [total, setTotal] = useState(0)
  const [totalMontant, setTotalMontant] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState<"don" | "vente" | null>(null)
  const [selected, setSelected] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await financeApi.getEntrees({ page, limit: LIMIT, categorie: categorie === "toutes" ? undefined : categorie })
      setItems(res.data)
      setTotal(res.total)
      setTotalMontant(res.total_montant)
    } catch (err) {
      setError(errorText(err, "Liste des entrées indisponible"))
    } finally {
      setLoading(false)
    }
  }, [page, categorie])

  useEffect(() => {
    load()
  }, [load])

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Entrées</h1>
            <p className="text-muted-foreground">Inscriptions, dons et ventes (plus récentes d&apos;abord).</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={() => setCreating("vente")}><ShoppingCart className="h-4 w-4" />Vente</Button>
            <Button className="gap-2" onClick={() => setCreating("don")}><Gift className="h-4 w-4" />Don</Button>
          </div>
        </div>

        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-base">
              Total {categorie === "toutes" ? "" : `(${categorie}) `}: <span className="tabular-nums">{formatMontant(totalMontant)}</span>
            </CardTitle>
            <Select value={categorie} onValueChange={(v) => { setCategorie(v); setPage(1) }}>
              <SelectTrigger className="sm:w-48" aria-label="Filtrer par catégorie"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="toutes">Toutes catégories</SelectItem>
                {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={load} /> : items.length === 0 ? (
              <EmptyState message="Aucune entrée." />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Référence</TableHead>
                      <TableHead>Catégorie</TableHead>
                      <TableHead>Libellé</TableHead>
                      <TableHead className="hidden md:table-cell">Mode</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((t) => (
                      <TableRow key={t.reference} className="cursor-pointer" onClick={() => setSelected(t.reference)}>
                        <TableCell className="whitespace-nowrap">{formatDate(t.date_transaction)}</TableCell>
                        <TableCell>
                          <button type="button" className="font-mono text-xs underline-offset-2 hover:underline" onClick={(e) => { e.stopPropagation(); setSelected(t.reference) }}>
                            {t.reference}
                          </button>
                        </TableCell>
                        <TableCell>{t.categorie}</TableCell>
                        <TableCell>{t.libelle}{t.nom_seminariste ? ` — ${t.nom_seminariste}` : ""}</TableCell>
                        <TableCell className="hidden md:table-cell">{t.mode_paiement}</TableCell>
                        <TableCell className="text-right tabular-nums whitespace-nowrap">{formatMontant(t.montant)}</TableCell>
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
      <EntreeDialog kind={creating} onClose={() => setCreating(null)} onCreated={load} />
      <EntreeDetail reference={selected} onClose={() => setSelected(null)} />
    </DashboardLayout>
  )
}
