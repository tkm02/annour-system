"use client"

import { useCallback, useEffect, useState } from "react"
import { Trash2, UserCheck } from "lucide-react"
import { toast } from "sonner"

import ConfirmDialog from "@/components/common/confirm-dialog"
import { DataTable, type Column } from "@/components/common/data-table"
import { FilterBar } from "@/components/common/filter-bar"
import { PageHeader } from "@/components/common/page-header"
import Pager from "@/components/common/pager"
import { EmptyState, errorText } from "@/components/common/states"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { visiteursApi, type Visiteur } from "@/lib/api"
import { formatDate } from "@/lib/format"
import { countLabel } from "@/lib/table"

const LIMIT = 20

/** F-A7 : registre des visiteurs (admin). Les visiteurs s'enregistrent depuis le formulaire public. */
export default function VisiteursPage() {
  const [search, setSearch] = useState("")
  const applied = useDebouncedValue(search.trim(), 350)
  const [page, setPage] = useState(1)
  const [items, setItems] = useState<Visiteur[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [toDelete, setToDelete] = useState<Visiteur | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await visiteursApi.list(page, LIMIT, applied || undefined)
      setItems(res.data)
      setTotal(res.total)
    } catch (err) {
      setError(errorText(err, "Liste des visiteurs indisponible"))
    } finally {
      setLoading(false)
    }
  }, [page, applied])

  useEffect(() => {
    load()
  }, [load])

  const remove = async () => {
    if (!toDelete) return
    setDeleting(true)
    try {
      await visiteursApi.delete(toDelete.id)
      toast.success("Visiteur supprimé")
      setToDelete(null)
      load()
    } catch (err) {
      toast.error(errorText(err, "Suppression impossible"))
    } finally {
      setDeleting(false)
    }
  }

  const onSearchChange = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const deleteButton = (v: Visiteur) => (
    <Button size="icon" variant="ghost" className="text-destructive hover:bg-destructive-soft hover:text-destructive"
      aria-label={`Supprimer ${v.nom} ${v.prenom}`} onClick={() => setToDelete(v)}>
      <Trash2 className="h-4 w-4" aria-hidden="true" />
    </Button>
  )

  const columns: Column<Visiteur>[] = [
    { id: "nom", header: "Nom et prénom", cell: (v) => <span className="font-medium">{v.nom} {v.prenom}</span> },
    { id: "contact", header: "Contact", cell: (v) => v.contact || "—" },
    { id: "date", header: "Enregistré le", cell: (v) => <span className="whitespace-nowrap">{formatDate(v.created_at, true)}</span>, hideBelow: "lg" },
    { id: "actions", header: <span className="sr-only">Actions</span>, cell: deleteButton, align: "right" },
  ]

  return (
    <DashboardLayout>
      <PageHeader title="Visiteurs" description="Personnes enregistrées à l'accueil, des plus récentes aux plus anciennes." />

      <FilterBar
        search={search}
        onSearchChange={onSearchChange}
        searchLabel="Rechercher un visiteur"
        searchPlaceholder="Nom ou prénom…"
        onReset={() => onSearchChange("")}
        count={!loading && !error ? countLabel(total, total, "visiteur", "visiteurs") : undefined}
      />

      <DataTable
        caption="Registre des visiteurs"
        columns={columns}
        rows={items}
        getRowKey={(v) => String(v.id)}
        loading={loading}
        error={error}
        onRetry={load}
        empty={
          <EmptyState
            icon={UserCheck}
            title={applied ? "Aucun résultat" : "Aucun visiteur"}
            message={applied ? "Aucun visiteur ne correspond à cette recherche." : "Les visiteurs enregistrés à l'accueil apparaîtront ici."}
            action={applied ? <Button variant="outline" onClick={() => onSearchChange("")}>Effacer la recherche</Button> : undefined}
          />
        }
        renderCard={(v) => (
          <div className="flex items-start justify-between gap-3 rounded-lg border border-border bg-card p-3">
            <div className="min-w-0">
              <p className="font-medium">{v.nom} {v.prenom}</p>
              <p className="text-sm text-muted-foreground">{v.contact || "—"}</p>
              <p className="text-xs text-muted-foreground">{formatDate(v.created_at, true)}</p>
            </div>
            {deleteButton(v)}
          </div>
        )}
      />
      {!error && total > 0 && <Pager page={page} limit={LIMIT} total={total} onPageChange={setPage} disabled={loading} />}

      <ConfirmDialog open={!!toDelete} busy={deleting} onCancel={() => setToDelete(null)} onConfirm={remove}
        title={`Supprimer ${toDelete?.nom ?? ""} ${toDelete?.prenom ?? ""} ?`}
        description="Le visiteur sera définitivement retiré du registre." />
    </DashboardLayout>
  )
}
