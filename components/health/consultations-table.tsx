"use client"

import { useCallback, useEffect, useState } from "react"
import { Search } from "lucide-react"

import Pager from "@/components/common/pager"
import { EmptyState, ErrorState, LoadingState, errorText } from "@/components/common/states"
import ConsultationModal from "@/components/health/consultation-modal"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { santeApi, type Consultation } from "@/lib/api"
import { formatDate } from "@/lib/format"

const LIMIT = 20

/** F-S4 : toutes les consultations (GET /sante/consultations), plus récentes d'abord. */
export default function ConsultationsTable() {
  const [search, setSearch] = useState("")
  const [appliedSearch, setAppliedSearch] = useState("")
  const [page, setPage] = useState(1)
  const [items, setItems] = useState<Consultation[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await santeApi.getConsultations({ page, limit: LIMIT, search: appliedSearch || undefined })
      setItems(res.data)
      setTotal(res.total)
    } catch (err) {
      setError(errorText(err, "Consultations indisponibles"))
    } finally {
      setLoading(false)
    }
  }, [page, appliedSearch])

  useEffect(() => {
    load()
  }, [load])

  return (
    <Card>
      <CardHeader>
        <form className="flex flex-col sm:flex-row gap-3" role="search"
          onSubmit={(e) => { e.preventDefault(); setPage(1); setAppliedSearch(search.trim()) }}>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <Input className="pl-9" placeholder="Patient : nom, prénom ou matricule" aria-label="Rechercher un patient"
              value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Button type="submit" variant="outline">Rechercher</Button>
        </form>
        <p className="text-sm text-muted-foreground">
          Pour créer une consultation, ouvrez la fiche du patient depuis la page Séminaristes.
        </p>
      </CardHeader>
      <CardContent>
        {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={load} /> : items.length === 0 ? (
          <EmptyState message="Aucune consultation." />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Motif</TableHead>
                  <TableHead className="hidden md:table-cell">Médecin</TableHead>
                  <TableHead><span className="sr-only">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="whitespace-nowrap">{formatDate(c.date_consultation, true)}</TableCell>
                    <TableCell>
                      <div>{c.patient_nom_prenoms ?? "—"}</div>
                      <div className="font-mono text-xs text-muted-foreground">{c.matricule}</div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{c.motif_consultation}</TableCell>
                    <TableCell className="hidden md:table-cell">{c.medecin_responsable ?? "—"}</TableCell>
                    <TableCell><Button size="sm" variant="outline" onClick={() => setSelected(c.id)}>Ouvrir</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        <Pager page={page} limit={LIMIT} total={total} onPageChange={setPage} disabled={loading} />
      </CardContent>
      <ConsultationModal consultationId={selected} onClose={() => setSelected(null)} onChanged={load} />
    </Card>
  )
}
