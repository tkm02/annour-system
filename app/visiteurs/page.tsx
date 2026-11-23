"use client"

import { useCallback, useEffect, useState } from "react"
import { Search, Trash2 } from "lucide-react"
import { toast } from "sonner"

import ConfirmDialog from "@/components/common/confirm-dialog"
import Pager from "@/components/common/pager"
import { EmptyState, ErrorState, LoadingState, errorText } from "@/components/common/states"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { visiteursApi, type Visiteur } from "@/lib/api"
import { formatDate } from "@/lib/format"

const LIMIT = 20

/** F-A7 : registre des visiteurs (admin). Les visiteurs s'enregistrent depuis le formulaire public. */
export default function VisiteursPage() {
  const [search, setSearch] = useState("")
  const [applied, setApplied] = useState("")
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Visiteurs</h1>
          <p className="text-muted-foreground">Personnes enregistrées à l&apos;accueil (plus récentes d&apos;abord).</p>
        </div>
        <Card>
          <CardHeader>
            <form className="flex flex-col sm:flex-row gap-3" role="search"
              onSubmit={(e) => { e.preventDefault(); setPage(1); setApplied(search.trim()) }}>
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <Input className="pl-9" placeholder="Nom ou prénom" aria-label="Rechercher un visiteur"
                  value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <Button type="submit" variant="outline">Rechercher</Button>
            </form>
          </CardHeader>
          <CardContent>
            {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={load} /> : items.length === 0 ? (
              <EmptyState message="Aucun visiteur." />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom et prénom</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Enregistré le</TableHead>
                      <TableHead><span className="sr-only">Actions</span></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((v) => (
                      <TableRow key={v.id}>
                        <TableCell>{v.nom} {v.prenom}</TableCell>
                        <TableCell>{v.contact}</TableCell>
                        <TableCell className="whitespace-nowrap">{formatDate(v.created_at, true)}</TableCell>
                        <TableCell>
                          <Button size="icon" variant="ghost" className="text-destructive" aria-label={`Supprimer ${v.nom} ${v.prenom}`}
                            onClick={() => setToDelete(v)}><Trash2 className="h-4 w-4" /></Button>
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
      </div>
      <ConfirmDialog open={!!toDelete} busy={deleting} onCancel={() => setToDelete(null)} onConfirm={remove}
        title={`Supprimer ${toDelete?.nom ?? ""} ${toDelete?.prenom ?? ""} ?`}
        description="Le visiteur sera définitivement retiré du registre." />
    </DashboardLayout>
  )
}
