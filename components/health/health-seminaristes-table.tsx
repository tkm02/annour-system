"use client"

import { useCallback, useEffect, useState } from "react"
import { FileHeart, Search } from "lucide-react"

import Pager from "@/components/common/pager"
import { EmptyState, ErrorState, LoadingState, errorText } from "@/components/common/states"
import HealthSeminaristModal from "@/components/health/health-seminarist-modal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { scientificApi, type Seminariste } from "@/lib/api"

const LIMIT = 20

/** F-S2 : séminaristes réels (pagination serveur), ouverture de la fiche médicale. */
export default function HealthSeminaristesTable() {
  const [search, setSearch] = useState("")
  const [appliedSearch, setAppliedSearch] = useState("")
  const [sexe, setSexe] = useState("tous")
  const [page, setPage] = useState(1)
  const [items, setItems] = useState<Seminariste[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const filters: Record<string, string> = {}
      if (appliedSearch) filters.search = appliedSearch
      if (sexe !== "tous") filters.sexe = sexe
      const res = await scientificApi.getSeminaristes(page, LIMIT, Object.keys(filters).length ? filters : undefined)
      setItems(res.data)
      setTotal(res.total)
    } catch (err) {
      setError(errorText(err, "Liste des séminaristes indisponible"))
    } finally {
      setLoading(false)
    }
  }, [page, appliedSearch, sexe])

  useEffect(() => {
    load()
  }, [load])

  return (
    <Card>
      <CardHeader>
        <form className="flex flex-col md:flex-row gap-3" role="search"
          onSubmit={(e) => { e.preventDefault(); setPage(1); setAppliedSearch(search.trim()) }}>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <Input className="pl-9" placeholder="Nom, prénom ou matricule" aria-label="Rechercher un séminariste"
              value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={sexe} onValueChange={(v) => { setSexe(v); setPage(1) }}>
            <SelectTrigger className="md:w-40" aria-label="Filtrer par sexe"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="tous">Tous</SelectItem>
              <SelectItem value="M">Masculin</SelectItem>
              <SelectItem value="F">Féminin</SelectItem>
            </SelectContent>
          </Select>
          <Button type="submit" variant="outline">Rechercher</Button>
        </form>
      </CardHeader>
      <CardContent>
        {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={load} /> : items.length === 0 ? (
          <EmptyState message="Aucun séminariste trouvé." />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Matricule</TableHead>
                  <TableHead>Nom et prénoms</TableHead>
                  <TableHead>Sexe</TableHead>
                  <TableHead className="hidden md:table-cell">Dortoir</TableHead>
                  <TableHead className="hidden md:table-cell">Niveau</TableHead>
                  <TableHead><span className="sr-only">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((s) => (
                  <TableRow key={s.matricule}>
                    <TableCell className="font-mono text-xs">{s.matricule}</TableCell>
                    <TableCell>{s.nom} {s.prenom}</TableCell>
                    <TableCell><Badge variant={s.sexe === "M" ? "default" : "secondary"}>{s.sexe}</Badge></TableCell>
                    <TableCell className="hidden md:table-cell">{s.dortoir ?? "—"}</TableCell>
                    <TableCell className="hidden md:table-cell">{s.niveau ?? "—"}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" className="gap-1" onClick={() => setSelected(s.matricule)}
                        aria-label={`Fiche médicale de ${s.nom} ${s.prenom}`}>
                        <FileHeart className="h-4 w-4" aria-hidden="true" />Fiche
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        <Pager page={page} limit={LIMIT} total={total} onPageChange={setPage} disabled={loading} />
      </CardContent>
      <HealthSeminaristModal matricule={selected} onClose={() => setSelected(null)} />
    </Card>
  )
}
