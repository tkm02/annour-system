"use client"

import type React from "react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { GraduationCap, Loader2, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

import ConfirmDialog from "@/components/common/confirm-dialog"
import { DataTable, type Column } from "@/components/common/data-table"
import Field from "@/components/common/field"
import { FilterBar } from "@/components/common/filter-bar"
import { PageHeader } from "@/components/common/page-header"
import { EmptyState, errorText } from "@/components/common/states"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { formateursApi, type Formateur } from "@/lib/api"
import { formatDate } from "@/lib/format"
import { countLabel, matchesSearch } from "@/lib/table"

type Errors = Record<string, string>

/** F-A7 : formateurs (rôles scientifique et admin). */
export default function FormateursPage() {
  const [items, setItems] = useState<Formateur[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ nom: "", prenoms: "", contact: "" })
  const [errors, setErrors] = useState<Errors>({})
  const [saving, setSaving] = useState(false)
  const [toDelete, setToDelete] = useState<Formateur | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [search, setSearch] = useState("")
  const query = useDebouncedValue(search)

  const load = useCallback(async () => {
    setError(null)
    try {
      setItems((await formateursApi.list()).data)
    } catch (err) {
      setError(errorText(err, "Liste des formateurs indisponible"))
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    const local: Errors = {}
    if (!form.nom.trim()) local.nom = "Nom obligatoire"
    if (!form.prenoms.trim()) local.prenoms = "Prénoms obligatoires"
    if (!form.contact.trim()) local.contact = "Contact obligatoire"
    setErrors(local)
    if (Object.keys(local).length) return
    setSaving(true)
    try {
      const created = await formateursApi.create({ nom: form.nom.trim(), prenoms: form.prenoms.trim(), contact: form.contact.trim() })
      toast.success(`Formateur ${created.nom} ${created.prenoms} ajouté`)
      setForm({ nom: "", prenoms: "", contact: "" })
      load()
    } catch (err) {
      setErrors({ _form: errorText(err, "Ajout impossible") })
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!toDelete) return
    setDeleting(true)
    try {
      await formateursApi.delete(toDelete.id)
      toast.success("Formateur supprimé")
      setToDelete(null)
      load()
    } catch (err) {
      toast.error(errorText(err, "Suppression impossible"))
    } finally {
      setDeleting(false)
    }
  }

  const filtered = useMemo(
    () => (items ?? []).filter((f) => matchesSearch(query, [f.nom, f.prenoms, f.contact])),
    [items, query]
  )

  const deleteButton = (f: Formateur) => (
    <Button size="icon" variant="ghost" className="text-destructive hover:bg-destructive-soft hover:text-destructive"
      aria-label={`Supprimer ${f.nom} ${f.prenoms}`} onClick={() => setToDelete(f)}>
      <Trash2 className="h-4 w-4" aria-hidden="true" />
    </Button>
  )

  const columns: Column<Formateur>[] = [
    { id: "nom", header: "Nom et prénoms", cell: (f) => <span className="font-medium">{f.nom} {f.prenoms}</span>, sortValue: (f) => `${f.nom} ${f.prenoms}` },
    { id: "contact", header: "Contact", cell: (f) => f.contact || "—" },
    { id: "date", header: "Ajouté le", cell: (f) => formatDate(f.created_at), sortValue: (f) => f.created_at, hideBelow: "lg" },
    { id: "actions", header: <span className="sr-only">Actions</span>, cell: deleteButton, align: "right" },
  ]

  return (
    <DashboardLayout>
      <PageHeader title="Formateurs" description="Intervenants du séminaire." />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base">Ajouter un formateur</CardTitle>
            <CardDescription>Les champs marqués d&apos;un astérisque (*) sont obligatoires.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4" noValidate>
              <Field id="formateur-nom" label="Nom *" error={errors.nom}>
                {(p) => <Input {...p} maxLength={100} value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} />}
              </Field>
              <Field id="formateur-prenoms" label="Prénoms *" error={errors.prenoms}>
                {(p) => <Input {...p} maxLength={100} value={form.prenoms} onChange={(e) => setForm({ ...form, prenoms: e.target.value })} />}
              </Field>
              <Field id="formateur-contact" label="Contact (téléphone ou e-mail) *" error={errors.contact}>
                {(p) => <Input {...p} maxLength={100} value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />}
              </Field>
              {errors._form && <p className="text-sm text-destructive" role="alert">{errors._form}</p>}
              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Plus aria-hidden="true" />}
                {saving ? "Enregistrement…" : "Ajouter le formateur"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="min-w-0 xl:col-span-2">
          <FilterBar
            search={search}
            onSearchChange={setSearch}
            searchLabel="Rechercher un formateur"
            searchPlaceholder="Nom, prénoms ou contact…"
            onReset={() => setSearch("")}
            count={items ? countLabel(filtered.length, items.length, "formateur", "formateurs") : undefined}
          />
          <DataTable
            caption="Liste des formateurs"
            columns={columns}
            rows={filtered}
            getRowKey={(f) => String(f.id)}
            loading={!items && !error}
            error={error}
            onRetry={load}
            pageSize={25}
            initialSort={{ id: "nom", direction: "asc" }}
            empty={
              <EmptyState
                icon={GraduationCap}
                title={query ? "Aucun résultat" : "Aucun formateur"}
                message={query ? "Aucun formateur ne correspond à cette recherche." : "Ajoutez un premier formateur avec le formulaire."}
                action={query ? <Button variant="outline" onClick={() => setSearch("")}>Effacer la recherche</Button> : undefined}
              />
            }
            renderCard={(f) => (
              <div className="flex items-start justify-between gap-3 rounded-lg border border-border bg-card p-3">
                <div className="min-w-0">
                  <p className="font-medium">{f.nom} {f.prenoms}</p>
                  <p className="text-sm text-muted-foreground">{f.contact || "—"}</p>
                  <p className="text-xs text-muted-foreground">Ajouté le {formatDate(f.created_at)}</p>
                </div>
                {deleteButton(f)}
              </div>
            )}
          />
        </div>
      </div>
      <ConfirmDialog open={!!toDelete} busy={deleting} onCancel={() => setToDelete(null)} onConfirm={remove}
        title={`Supprimer ${toDelete?.nom ?? ""} ${toDelete?.prenoms ?? ""} ?`}
        description="Le formateur sera définitivement retiré de la liste." />
    </DashboardLayout>
  )
}
