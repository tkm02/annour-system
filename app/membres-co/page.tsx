"use client"

import type React from "react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { Loader2, Pencil, Search, Trash2 } from "lucide-react"
import { toast } from "react-hot-toast"

import ConfirmDialog from "@/components/common/confirm-dialog"
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
import { coApi, type MembreCO, type MembreCOUpdate } from "@/lib/api"

const PAGE_SIZE = 20
type EditForm = Required<Pick<MembreCO, "nom" | "prenoms" | "contact" | "commission" | "statut" | "allergies" | "antecedent_medical">>
const FIELDS: Array<keyof EditForm> = ["nom", "prenoms", "contact", "commission", "statut", "allergies", "antecedent_medical"]

function EditDialog({ membre, onClose, onSaved }: { membre: MembreCO | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<EditForm | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!membre) return
    setError(null)
    setForm({
      nom: membre.nom, prenoms: membre.prenoms, contact: membre.contact, commission: membre.commission,
      statut: membre.statut, allergies: membre.allergies ?? "", antecedent_medical: membre.antecedent_medical ?? "",
    })
  }, [membre])

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!membre || !form) return
    const required: Array<keyof EditForm> = ["nom", "prenoms", "contact", "commission", "statut"]
    if (required.some((f) => !form[f].trim())) {
      setError("Nom, prénoms, contact, commission et statut sont obligatoires")
      return
    }
    const update: MembreCOUpdate = {}
    for (const field of FIELDS) {
      const value = form[field].trim()
      if (value !== (membre[field] ?? "")) update[field] = value
    }
    if (Object.keys(update).length === 0) {
      onClose()
      return
    }
    setSaving(true)
    try {
      await coApi.updateMembreCO(membre.id, update)
      toast.success("Membre modifié")
      onSaved()
      onClose()
    } catch (err) {
      setError(errorText(err, "Modification impossible"))
    } finally {
      setSaving(false)
    }
  }

  const set = (field: keyof EditForm, value: string) => setForm((f) => (f ? { ...f, [field]: value } : f))

  return (
    <Dialog open={!!membre} onOpenChange={(o) => !o && !saving && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier le membre</DialogTitle>
          <DialogDescription>{membre ? `${membre.nom} ${membre.prenoms}` : ""}</DialogDescription>
        </DialogHeader>
        {form && (
          <form onSubmit={submit} className="space-y-4" noValidate>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field id="co-nom" label="Nom *">{(p) => <Input {...p} maxLength={100} value={form.nom} onChange={(e) => set("nom", e.target.value)} />}</Field>
              <Field id="co-prenoms" label="Prénoms *">{(p) => <Input {...p} maxLength={100} value={form.prenoms} onChange={(e) => set("prenoms", e.target.value)} />}</Field>
              <Field id="co-contact" label="Contact *">{(p) => <Input {...p} type="tel" maxLength={30} value={form.contact} onChange={(e) => set("contact", e.target.value)} />}</Field>
              <Field id="co-commission" label="Commission *">{(p) => <Input {...p} maxLength={100} value={form.commission} onChange={(e) => set("commission", e.target.value)} />}</Field>
              <Field id="co-statut" label="Statut *">{(p) => <Input {...p} maxLength={100} value={form.statut} onChange={(e) => set("statut", e.target.value)} />}</Field>
            </div>
            <Field id="co-allergies" label="Allergies">{(p) => <Textarea {...p} rows={2} maxLength={2000} value={form.allergies} onChange={(e) => set("allergies", e.target.value)} />}</Field>
            <Field id="co-antecedents" label="Antécédents médicaux">{(p) => <Textarea {...p} rows={2} maxLength={2000} value={form.antecedent_medical} onChange={(e) => set("antecedent_medical", e.target.value)} />}</Field>
            {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={saving}>Annuler</Button>
              <Button type="submit" disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Enregistrer</Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

/** F-A7 : membres du comité d'organisation (admin) — modification et suppression. */
export default function MembresCOPage() {
  const [items, setItems] = useState<MembreCO[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [commission, setCommission] = useState("toutes")
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState<MembreCO | null>(null)
  const [toDelete, setToDelete] = useState<MembreCO | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setError(null)
    try {
      setItems((await coApi.getMembresCO()).data)
    } catch (err) {
      setError(errorText(err, "Liste des membres indisponible"))
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const commissions = useMemo(() => Array.from(new Set((items ?? []).map((m) => m.commission).filter(Boolean))).sort(), [items])
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return (items ?? []).filter((m) =>
      (commission === "toutes" || m.commission === commission) &&
      (!term || `${m.nom} ${m.prenoms} ${m.contact}`.toLowerCase().includes(term)))
  }, [items, search, commission])

  const remove = async () => {
    if (!toDelete) return
    setDeleting(true)
    try {
      await coApi.deleteMembreCO(toDelete.id)
      toast.success("Membre supprimé")
      setToDelete(null)
      load()
    } catch (err) {
      toast.error(errorText(err, "Suppression impossible"))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Membres du comité d&apos;organisation</h1>
          <p className="text-muted-foreground">Modification et suppression des membres (les badges se génèrent depuis la page Badges).</p>
        </div>
        <Card>
          <CardHeader className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <Input className="pl-9" placeholder="Nom, prénoms ou contact" aria-label="Rechercher un membre"
                value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
            </div>
            <Select value={commission} onValueChange={(v) => { setCommission(v); setPage(1) }}>
              <SelectTrigger className="sm:w-56" aria-label="Filtrer par commission"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="toutes">Toutes les commissions</SelectItem>
                {commissions.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            {error ? <ErrorState message={error} onRetry={load} /> : !items ? <LoadingState /> : filtered.length === 0 ? (
              <EmptyState message="Aucun membre." />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom et prénoms</TableHead>
                      <TableHead>Commission</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="hidden md:table-cell">Contact</TableHead>
                      <TableHead><span className="sr-only">Actions</span></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((m) => (
                      <TableRow key={m.id}>
                        <TableCell>{m.nom} {m.prenoms}</TableCell>
                        <TableCell>{m.commission}</TableCell>
                        <TableCell>{m.statut}</TableCell>
                        <TableCell className="hidden md:table-cell">{m.contact}</TableCell>
                        <TableCell>
                          <div className="flex gap-1 justify-end">
                            <Button size="icon" variant="ghost" aria-label={`Modifier ${m.nom} ${m.prenoms}`} onClick={() => setEditing(m)}><Pencil className="h-4 w-4" /></Button>
                            <Button size="icon" variant="ghost" className="text-destructive" aria-label={`Supprimer ${m.nom} ${m.prenoms}`} onClick={() => setToDelete(m)}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            <Pager page={page} limit={PAGE_SIZE} total={filtered.length} onPageChange={setPage} />
          </CardContent>
        </Card>
      </div>
      <EditDialog membre={editing} onClose={() => setEditing(null)} onSaved={load} />
      <ConfirmDialog open={!!toDelete} busy={deleting} onCancel={() => setToDelete(null)} onConfirm={remove}
        title={`Supprimer ${toDelete?.nom ?? ""} ${toDelete?.prenoms ?? ""} ?`}
        description="Le membre sera définitivement supprimé et n'apparaîtra plus dans la page Badges." />
    </DashboardLayout>
  )
}
