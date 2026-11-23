"use client"

import type React from "react"
import { useCallback, useEffect, useState } from "react"
import { Loader2, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

import ConfirmDialog from "@/components/common/confirm-dialog"
import { EmptyState, ErrorState, LoadingState, errorText } from "@/components/common/states"
import Field from "@/components/finance/field"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formateursApi, type Formateur } from "@/lib/api"
import { formatDate } from "@/lib/format"

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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Formateurs</h1>
          <p className="text-muted-foreground">Intervenants du séminaire.</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Ajouter un formateur</CardTitle></CardHeader>
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
                <Button type="submit" className="w-full gap-2" disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}Ajouter
                </Button>
              </form>
            </CardContent>
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle className="text-base">Liste {items ? `(${items.length})` : ""}</CardTitle></CardHeader>
            <CardContent>
              {error ? <ErrorState message={error} onRetry={load} /> : !items ? <LoadingState /> : items.length === 0 ? (
                <EmptyState message="Aucun formateur." />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nom et prénoms</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead className="hidden md:table-cell">Ajouté le</TableHead>
                        <TableHead><span className="sr-only">Actions</span></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((f) => (
                        <TableRow key={f.id}>
                          <TableCell>{f.nom} {f.prenoms}</TableCell>
                          <TableCell>{f.contact}</TableCell>
                          <TableCell className="hidden md:table-cell">{formatDate(f.created_at)}</TableCell>
                          <TableCell>
                            <Button size="icon" variant="ghost" className="text-destructive" aria-label={`Supprimer ${f.nom} ${f.prenoms}`}
                              onClick={() => setToDelete(f)}><Trash2 className="h-4 w-4" /></Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <ConfirmDialog open={!!toDelete} busy={deleting} onCancel={() => setToDelete(null)} onConfirm={remove}
        title={`Supprimer ${toDelete?.nom ?? ""} ${toDelete?.prenoms ?? ""} ?`}
        description="Le formateur sera définitivement retiré de la liste." />
    </DashboardLayout>
  )
}
