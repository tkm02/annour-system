"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { ChevronDown, Download, Eye, FileSpreadsheet, Loader2, RotateCcw, Search, SlidersHorizontal } from "lucide-react"
import { toast } from "react-hot-toast"

import Pager from "@/components/common/pager"
import { EmptyState, ErrorState, LoadingState } from "@/components/common/states"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useRemoteData } from "@/hooks/use-remote-data"
import { recensementCoApi } from "@/lib/api"
import { downloadBlob } from "@/lib/format"
import {
  ALL, FILTRES_VIDES, PAGE_SIZE, QUALITE_LABELS, SEXE_LABELS, STATUT_LABELS, TYPE_LABELS, buildExportParams,
  buildListParams, exportFilename, hasActiveFilters, nombreFiltresActifs, pageRecalee, qualiteLabel, typeLabel,
  type ExportFormat, type FiltresCO,
} from "@/lib/recensement-co"
import { CoPhoto, StatutBadge, apiErrorMessage } from "./co-shared"

const SEARCH_DELAY_MS = 350

function FilterSelect({ id, label, value, allLabel, options, onChange }: {
  id: string
  label: string
  value: string
  allLabel: string
  options: Array<[string, string]>
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs text-muted-foreground">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} className="w-full"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{allLabel}</SelectItem>
          {options.map(([code, text]) => <SelectItem key={code} value={code}>{text}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  )
}

/** Onglet « Fiches » : liste paginée côté serveur, recherche, filtres et export. */
export default function CoFichesTab({ version, commissions, edition, onOpen }: {
  version: number
  commissions: string[]
  edition: string | null
  onOpen: (id: string) => void
}) {
  const [filtres, setFiltres] = useState<FiltresCO>(FILTRES_VIDES)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [exporting, setExporting] = useState<ExportFormat | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)

  // Anti-rebond de la recherche : la requête part après une pause de frappe
  useEffect(() => {
    const q = search.trim()
    if (q === filtres.q) return
    const timer = setTimeout(() => {
      setFiltres((f) => ({ ...f, q }))
      setPage(1)
    }, SEARCH_DELAY_MS)
    return () => clearTimeout(timer)
  }, [search, filtres.q])

  const params = useMemo(() => buildListParams(filtres, page), [filtres, page])
  const fetcher = useCallback(() => recensementCoApi.list(params), [params])
  const { data, error, loading, reload } = useRemoteData(fetcher, version)

  // Page devenue vide après une action (fiche validée hors filtre, etc.) : revenir à la dernière page non vide
  if (data && !loading && !error) {
    const recalee = pageRecalee(page, data.total, data.data.length)
    if (recalee !== page) setPage(recalee)
  }

  const setFilter = (field: keyof FiltresCO) => (value: string) => {
    setFiltres((f) => ({ ...f, [field]: value }))
    setPage(1)
  }
  const reset = () => {
    setSearch("")
    setFiltres(FILTRES_VIDES)
    setPage(1)
  }

  const exporter = async (format: ExportFormat) => {
    setExporting(format)
    try {
      // Recherche affichée, même si l'anti-rebond n'a pas encore relancé la liste
      const { blob, filename } = await recensementCoApi.export(buildExportParams(format, { ...filtres, q: search.trim() }))
      downloadBlob(blob, filename ?? exportFilename(format, edition))
      toast.success(format === "csv" ? "Export CSV téléchargé" : "Export Excel téléchargé")
    } catch (err) {
      toast.error(apiErrorMessage(err, "Export impossible"))
    } finally {
      setExporting(null)
    }
  }

  const rows = data?.data ?? []
  const total = data?.total ?? 0
  const filtresActifs = hasActiveFilters(filtres) || search.trim() !== ""
  const nbFiltres = nombreFiltresActifs(filtres)
  const commissionOptions = useMemo(() => {
    const all = new Set(commissions)
    if (filtres.commission !== ALL) all.add(filtres.commission)
    return [...all].sort((a, b) => a.localeCompare(b, "fr")).map((c): [string, string] => [c, c])
  }, [commissions, filtres.commission])

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-end">
        <div className="space-y-1.5 md:w-72">
          <Label htmlFor="co-recherche" className="text-xs text-muted-foreground">Recherche</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input id="co-recherche" type="search" className="pl-9" placeholder="Nom ou prénoms" maxLength={100}
              value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        {/* Mobile : filtres repliables, la recherche reste visible */}
        <Button type="button" variant="outline" size="sm" className="gap-2 self-start md:hidden"
          aria-expanded={filtersOpen} aria-controls="co-filtres" onClick={() => setFiltersOpen((o) => !o)}>
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" /> Filtres ({nbFiltres})
          <ChevronDown className={cn("h-4 w-4 transition-transform", filtersOpen && "rotate-180")} aria-hidden="true" />
        </Button>
      </div>
      <div id="co-filtres" className={cn("grid-cols-1 gap-3 sm:grid-cols-2 md:grid md:grid-cols-3 xl:grid-cols-5", filtersOpen ? "grid" : "hidden")}>
        <FilterSelect id="co-f-commission" label="Commission" value={filtres.commission} allLabel="Toutes"
          options={commissionOptions} onChange={setFilter("commission")} />
        <FilterSelect id="co-f-qualite" label="Qualité" value={filtres.qualite} allLabel="Toutes"
          options={Object.entries(QUALITE_LABELS)} onChange={setFilter("qualite")} />
        <FilterSelect id="co-f-sexe" label="Sexe" value={filtres.sexe} allLabel="Tous"
          options={Object.entries(SEXE_LABELS)} onChange={setFilter("sexe")} />
        <FilterSelect id="co-f-type" label="Ancien / nouveau" value={filtres.type} allLabel="Tous"
          options={Object.entries(TYPE_LABELS)} onChange={setFilter("type")} />
        <FilterSelect id="co-f-statut" label="Statut" value={filtres.statut} allLabel="Tous"
          options={Object.entries(STATUT_LABELS)} onChange={setFilter("statut")} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {loading && data ? "Actualisation…" : `${total} fiche${total > 1 ? "s" : ""}`}
        </p>
        <div className="flex flex-wrap gap-2">
          {filtresActifs && (
            <Button variant="ghost" size="sm" onClick={reset} className="gap-2">
              <RotateCcw className="h-4 w-4" aria-hidden="true" /> Réinitialiser les filtres
            </Button>
          )}
          <Button variant="outline" size="sm" className="gap-2" disabled={!!exporting} onClick={() => exporter("csv")}>
            {exporting === "csv" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Download className="h-4 w-4" aria-hidden="true" />}
            Exporter en CSV
          </Button>
          <Button variant="outline" size="sm" className="gap-2" disabled={!!exporting} onClick={() => exporter("xlsx")}>
            {exporting === "xlsx" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />}
            Exporter en Excel
          </Button>
        </div>
      </div>

      {error ? (
        <ErrorState message={apiErrorMessage(error, "Liste des fiches indisponible")} onRetry={reload} />
      ) : !data ? (
        <LoadingState label="Chargement des fiches…" />
      ) : rows.length === 0 ? (
        filtresActifs ? (
          <div className="flex flex-col items-center pb-6">
            <EmptyState message="Aucune fiche ne correspond aux filtres." />
            <Button variant="outline" size="sm" onClick={reset} className="gap-2">
              <RotateCcw className="h-4 w-4" aria-hidden="true" /> Réinitialiser les filtres
            </Button>
          </div>
        ) : (
          <EmptyState message="Aucune fiche pour cette édition." />
        )
      ) : (
        <div aria-busy={loading}>
          {/* Mobile : cartes empilées */}
          <ul className="space-y-3 md:hidden">
            {rows.map((p) => (
              <li key={p.id}>
                <button type="button" onClick={() => onOpen(p.id)}
                  className="flex w-full items-center gap-3 rounded-lg border bg-background p-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary">
                  <CoPhoto url={p.photo_url} sexe={p.sexe} name={`${p.nom} ${p.prenoms}`} inList className="h-16 w-[51px]" />
                  <span className="min-w-0 flex-1 space-y-1">
                    <span className="block truncate font-medium"><span className="sr-only">Ouvrir la fiche : </span>{p.nom} {p.prenoms}</span>
                    <span className="block truncate text-sm text-muted-foreground">{p.commission} · {qualiteLabel(p.qualite)}</span>
                    <span className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <StatutBadge statut={p.statut_fiche} /> {typeLabel(p.type)}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {/* Écran large : tableau */}
          <div className="hidden overflow-x-auto md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-14"><span className="sr-only">Photo</span></TableHead>
                  <TableHead>Nom et prénoms</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Qualité</TableHead>
                  <TableHead className="hidden lg:table-cell">Téléphone</TableHead>
                  <TableHead>Ancien / nouveau</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead><span className="sr-only">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell><CoPhoto url={p.photo_url} sexe={p.sexe} name={`${p.nom} ${p.prenoms}`} inList /></TableCell>
                    <TableCell className="font-medium">{p.nom} {p.prenoms}</TableCell>
                    <TableCell>{p.commission}</TableCell>
                    <TableCell>{qualiteLabel(p.qualite)}</TableCell>
                    <TableCell className="hidden lg:table-cell">{p.telephone ?? "—"}</TableCell>
                    <TableCell>{typeLabel(p.type)}</TableCell>
                    <TableCell><StatutBadge statut={p.statut_fiche} /></TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" className="gap-2" onClick={() => onOpen(p.id)}>
                        <Eye className="h-4 w-4" aria-hidden="true" /> Voir<span className="sr-only"> la fiche de {p.nom} {p.prenoms}</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
      {data && total > 0 && <Pager page={page} limit={PAGE_SIZE} total={total} onPageChange={setPage} disabled={loading} />}
    </div>
  )
}
