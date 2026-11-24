"use client"

import type React from "react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { Loader2, Pencil, Trash2, Users } from "lucide-react"
import { toast } from "sonner"

import ConfirmDialog from "@/components/common/confirm-dialog"
import { DataTable, type Column } from "@/components/common/data-table"
import Field from "@/components/common/field"
import { FilterBar } from "@/components/common/filter-bar"
import { PageHeader } from "@/components/common/page-header"
import { EmptyState, errorText } from "@/components/common/states"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { coApi, type MembreCO, type MembreCOUpdate } from "@/lib/api"
import { countLabel, matchesSearch } from "@/lib/table"

const PAGE_SIZE = 25
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
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="animate-spin" aria-hidden="true" />}
                {saving ? "Enregistrement…" : "Enregistrer"}
              </Button>
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
  const query = useDebouncedValue(search)
  const [commission, setCommission] = useState("toutes")
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
  const filtered = useMemo(
    () => (items ?? []).filter((m) =>
      (commission === "toutes" || m.commission === commission) && matchesSearch(query, [m.nom, m.prenoms, m.contact])),
    [items, query, commission]
  )
  const filteredOut = !!query.trim() || commission !== "toutes"
  const resetFilters = () => {
    setSearch("")
    setCommission("toutes")
  }

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

  const rowActions = (m: MembreCO) => (
    <div className="flex justify-end gap-1">
      <Button size="icon" variant="ghost" aria-label={`Modifier ${m.nom} ${m.prenoms}`} onClick={() => setEditing(m)}>
        <Pencil className="h-4 w-4" aria-hidden="true" />
      </Button>
      <Button size="icon" variant="ghost" className="text-destructive hover:bg-destructive-soft hover:text-destructive"
        aria-label={`Supprimer ${m.nom} ${m.prenoms}`} onClick={() => setToDelete(m)}>
        <Trash2 className="h-4 w-4" aria-hidden="true" />
      </Button>
    </div>
  )

  const columns: Column<MembreCO>[] = [
    { id: "nom", header: "Nom et prénoms", cell: (m) => <span className="font-medium">{m.nom} {m.prenoms}</span>, sortValue: (m) => `${m.nom} ${m.prenoms}` },
    { id: "commission", header: "Commission", cell: (m) => m.commission, sortValue: (m) => m.commission },
    { id: "statut", header: "Statut", cell: (m) => m.statut, sortValue: (m) => m.statut, hideBelow: "lg" },
    { id: "contact", header: "Contact", cell: (m) => m.contact, hideBelow: "xl" },
    { id: "actions", header: <span className="sr-only">Actions</span>, cell: rowActions, align: "right" },
  ]

  return (
    <DashboardLayout>
      <PageHeader
        title="Membres CO 2025 (archives)"
        description="Modification et suppression des membres de l'édition précédente. Les badges se génèrent depuis la page Badges."
      />

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchLabel="Rechercher un membre"
        searchPlaceholder="Nom, prénoms ou contact…"
        filters={
          <Select value={commission} onValueChange={setCommission}>
            <SelectTrigger className="w-full bg-card sm:w-56" aria-label="Filtrer par commission"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="toutes">Toutes les commissions</SelectItem>
              {commissions.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        }
        activeFilters={commission !== "toutes" ? [{ label: `Commission : ${commission}`, onRemove: () => setCommission("toutes") }] : []}
        onReset={resetFilters}
        count={items ? countLabel(filtered.length, items.length, "membre", "membres") : undefined}
      />

      <DataTable
        caption="Membres du comité d'organisation 2025"
        columns={columns}
        rows={filtered}
        getRowKey={(m) => String(m.id)}
        loading={!items && !error}
        error={error}
        onRetry={load}
        pageSize={PAGE_SIZE}
        empty={
          <EmptyState
            icon={Users}
            title={filteredOut ? "Aucun résultat" : "Aucun membre"}
            message={filteredOut ? "Aucun membre ne correspond à ces filtres." : "Aucun membre n'est enregistré pour l'édition précédente."}
            action={filteredOut ? <Button variant="outline" onClick={resetFilters}>Réinitialiser les filtres</Button> : undefined}
          />
        }
        renderCard={(m) => (
          <div className="flex items-start justify-between gap-3 rounded-lg border border-border bg-card p-3">
            <div className="min-w-0">
              <p className="font-medium">{m.nom} {m.prenoms}</p>
              <p className="text-sm text-muted-foreground">{m.commission} · {m.statut}</p>
              <p className="text-xs text-muted-foreground">{m.contact}</p>
            </div>
            {rowActions(m)}
          </div>
        )}
      />

      <EditDialog membre={editing} onClose={() => setEditing(null)} onSaved={load} />
      <ConfirmDialog open={!!toDelete} busy={deleting} onCancel={() => setToDelete(null)} onConfirm={remove}
        title={`Supprimer ${toDelete?.nom ?? ""} ${toDelete?.prenoms ?? ""} ?`}
        description="Le membre sera définitivement supprimé et n'apparaîtra plus dans la page Badges." />
    </DashboardLayout>
  )
}
