"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Check, ClipboardList, GraduationCap, ListOrdered, Loader2, RefreshCw, Scale, Users, X } from "lucide-react"
import { toast } from "sonner"

import { DataTable, type Column } from "@/components/common/data-table"
import { FilterBar, type ActiveFilter } from "@/components/common/filter-bar"
import { PageHeader } from "@/components/common/page-header"
import { StatCard, StatGrid, StatGridSkeleton } from "@/components/common/stat-card"
import { StatusBadge, type StatusTone } from "@/components/common/status-badge"
import { EmptyState, errorText } from "@/components/common/states"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { scientificApi, type Seminariste, type TestScore } from "@/lib/api"
import { countLabel, matchesSearch } from "@/lib/table"

type GroupCounts = {
  "Secondaire A - Rabioul Awal": number
  "Secondaire B - Rabioul Thani": number
  "Primaire A - Mouharram": number
  "Primaire B - Sofar": number
}

const EMPTY_COUNTS: GroupCounts = {
  "Secondaire A - Rabioul Awal": 0,
  "Secondaire B - Rabioul Thani": 0,
  "Primaire A - Mouharram": 0,
  "Primaire B - Sofar": 0,
}

// Valeurs envoyées au filtre (inchangées) et libellés affichés
const NIVEAU_OPTIONS: { value: string; label: string }[] = [
  { value: "Universitaire - Djoumada Thaniya", label: "Universitaire" },
  { value: "Supérieur - Djoumada Oula", label: "Supérieur" },
  { value: "Secondaire A - Rabioul Awal", label: "Secondaire A" },
  { value: "Secondaire B - Rabioul Thani", label: "Secondaire B" },
  { value: "Primaire A - Mouharram", label: "Primaire A" },
  { value: "Primaire B - Sofar", label: "Primaire B" },
  { value: "none", label: "Non classé" },
]

const SEUILS: { range: string; label: string }[] = [
  { range: "16 – 20", label: "Universitaire" },
  { range: "12 – 15", label: "Supérieur" },
  { range: "7 – 11", label: "Secondaire A/B" },
  { range: "0 – 6", label: "Primaire A/B" },
]

const GROUPES: { key: keyof GroupCounts; label: string }[] = [
  { key: "Secondaire A - Rabioul Awal", label: "Secondaire A" },
  { key: "Secondaire B - Rabioul Thani", label: "Secondaire B" },
  { key: "Primaire A - Mouharram", label: "Primaire A" },
  { key: "Primaire B - Sofar", label: "Primaire B" },
]

const niveauTone = (niveau: string | null): StatusTone => {
  if (niveau?.includes("Universitaire")) return "success"
  if (niveau?.includes("Supérieur")) return "info"
  if (niveau?.includes("Secondaire")) return "neutral"
  if (niveau?.includes("Primaire")) return "neutral"
  return "danger"
}

/** Test d'entrée : saisie des notes et attribution automatique des niveaux (équilibrage A/B Secondaire/Primaire). */
export default function TestEntreePage() {
  const [seminaristes, setSeminaristes] = useState<Seminariste[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const query = useDebouncedValue(searchTerm)
  const [selectedNiveau, setSelectedNiveau] = useState("all")

  // Saisie en ligne
  const [editingMatricule, setEditingMatricule] = useState<string | null>(null)
  const [tempNote, setTempNote] = useState<number>(0)
  const [savingMatricule, setSavingMatricule] = useState<string | null>(null)

  // Équilibrage A/B uniquement pour Secondaire et Primaire
  const [groupCounts, setGroupCounts] = useState<GroupCounts>(EMPTY_COUNTS)

  const fetchSeminaristes = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data: { data?: Seminariste[] } = await scientificApi.getSeminaristes(1, 10000)
      setSeminaristes(data.data || [])

      // Répartition A/B pour Secondaire et Primaire seulement
      const counts: GroupCounts = { ...EMPTY_COUNTS }
      data.data?.forEach((sem: Seminariste) => {
        if (sem.niveau) {
          const niveauKeys = Object.keys(counts)
          if (niveauKeys.includes(sem.niveau)) {
            counts[sem.niveau as keyof GroupCounts]++
          }
        }
      })
      setGroupCounts(counts)
    } catch (err) {
      setError(errorText(err, "Erreur chargement"))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSeminaristes()
  }, [fetchSeminaristes])

  const list = useMemo(() => seminaristes ?? [], [seminaristes])

  const filteredSeminaristes = useMemo(
    () =>
      list.filter((sem) => {
        const niveauValue = selectedNiveau === "none" ? "" : selectedNiveau
        const matchesNiveau = selectedNiveau === "all" || sem.niveau === niveauValue
        return matchesSearch(query, [sem.nom, sem.prenom, sem.matricule]) && matchesNiveau
      }),
    [list, query, selectedNiveau]
  )

  // Équilibrage uniquement Secondaire/Primaire
  const getBalancedNiveau = (note: number): string => {
    if (note >= 16) return "Universitaire - Djoumada Thaniya"
    if (note >= 12) return "Supérieur - Djoumada Oula"

    // Secondaire : équilibrage A/B
    if (note >= 7) {
      return groupCounts["Secondaire A - Rabioul Awal"] <= groupCounts["Secondaire B - Rabioul Thani"]
        ? "Secondaire A - Rabioul Awal"
        : "Secondaire B - Rabioul Thani"
    }

    // Primaire : équilibrage A/B
    return groupCounts["Primaire A - Mouharram"] <= groupCounts["Primaire B - Sofar"]
      ? "Primaire A - Mouharram"
      : "Primaire B - Sofar"
  }

  const handleEditNote = (sem: Seminariste) => {
    setEditingMatricule(sem.matricule)
    setTempNote(0)
  }

  const cancelEdit = () => {
    setEditingMatricule(null)
    setTempNote(0)
  }

  const handleSaveNote = async (sem: Seminariste) => {
    if (tempNote === 0) {
      toast.warning("Entrez une note entre 0 et 20")
      return
    }

    try {
      setSavingMatricule(sem.matricule)

      const nouveauNiveau = getBalancedNiveau(tempNote)

      const testData: TestScore = {
        matricule: sem.matricule,
        note: tempNote,
        niveau: nouveauNiveau,
      }

      await scientificApi.saveTestEntree(testData)

      toast.success(`${nouveauNiveau} • Note : ${tempNote}/20`)

      // Rafraîchir la liste
      scientificApi.invalidateCache()
      await fetchSeminaristes()
    } catch (err) {
      toast.error(errorText(err, "Erreur sauvegarde test"))
    } finally {
      setSavingMatricule(null)
      setEditingMatricule(null)
      setTempNote(0)
    }
  }

  const stats = {
    total: list.length,
    classed: list.filter((s) => s?.niveau).length,
    toTest: list.filter((s) => !s?.niveau).length,
  }

  const resetFilters = () => {
    setSearchTerm("")
    setSelectedNiveau("all")
  }

  const filtersActive = !!query.trim() || selectedNiveau !== "all"
  const activeFilters: ActiveFilter[] =
    selectedNiveau !== "all"
      ? [{
          label: `Niveau : ${NIVEAU_OPTIONS.find((o) => o.value === selectedNiveau)?.label ?? selectedNiveau}`,
          onRemove: () => setSelectedNiveau("all"),
        }]
      : []

  const fullName = (sem: Seminariste) => `${sem.nom} ${sem.prenom || ""}`.trim()

  const niveauBadge = (sem: Seminariste) =>
    sem.niveau ? (
      <StatusBadge tone={niveauTone(sem.niveau)} icon={GraduationCap} className="whitespace-normal">{sem.niveau}</StatusBadge>
    ) : (
      <StatusBadge tone="warning">Non classé</StatusBadge>
    )

  // `ctx` distingue la vue tableau de la vue cartes (identifiants uniques dans le DOM)
  const noteCell = (sem: Seminariste, ctx: "table" | "card") => {
    if (editingMatricule !== sem.matricule) {
      return (
        <span className="inline-block rounded bg-muted px-2 py-1 font-mono text-sm font-semibold tabular-nums">
          {sem.niveau ? sem.note_entree : "—"}
        </span>
      )
    }
    const inputId = `note-${ctx}-${sem.matricule}`
    const previewId = `${inputId}-niveau`
    return (
      <div className="space-y-1.5">
        <Input
          id={inputId}
          type="number"
          inputMode="decimal"
          min="0"
          max="20"
          step="0.25"
          value={tempNote || ""}
          onChange={(e) => setTempNote(parseFloat(e.target.value) || 0)}
          aria-label={`Note du test d'entrée de ${fullName(sem)} (sur 20)`}
          aria-describedby={previewId}
          className="h-9 w-20 text-center font-semibold tabular-nums"
          autoFocus
        />
        <p id={previewId} className="text-xs text-muted-foreground">
          <span className="sr-only">Niveau attribué : </span>
          <StatusBadge tone={niveauTone(getBalancedNiveau(tempNote))} icon={null}>
            {getBalancedNiveau(tempNote)}
          </StatusBadge>
        </p>
      </div>
    )
  }

  const actionCell = (sem: Seminariste) => {
    if (editingMatricule === sem.matricule) {
      const saving = savingMatricule === sem.matricule
      return (
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            onClick={() => handleSaveNote(sem)}
            disabled={saving || tempNote === 0}
            aria-label={`Enregistrer la note de ${fullName(sem)}`}
          >
            {saving ? <Loader2 className="animate-spin" aria-hidden="true" /> : <GraduationCap aria-hidden="true" />}
            {saving ? "Enregistrement…" : "Enregistrer"}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={cancelEdit}
            disabled={saving}
            aria-label="Annuler la saisie"
            className="h-9 w-9"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      )
    }
    return sem.niveau ? (
      <Button variant="outline" size="sm" disabled className="w-full sm:w-auto">
        <Check aria-hidden="true" />
        Classé
      </Button>
    ) : (
      <Button
        size="sm"
        onClick={() => handleEditNote(sem)}
        aria-label={`Saisir la note de ${fullName(sem)}`}
        className="w-full sm:w-auto"
      >
        Saisir
      </Button>
    )
  }

  const columns: Column<Seminariste>[] = [
    {
      id: "matricule",
      header: "Matricule",
      cell: (s) => <span className="font-mono text-sm font-medium">{s.matricule}</span>,
      sortValue: (s) => s.matricule,
    },
    {
      id: "nom",
      header: "Nom et prénom",
      cell: (s) => (
        <div className="min-w-0">
          <p className="font-medium text-foreground">{s.nom}</p>
          <p className="text-sm text-muted-foreground">{s.prenom}</p>
        </div>
      ),
      sortValue: (s) => fullName(s),
    },
    { id: "sexe", header: "Sexe", cell: (s) => s.sexe, sortValue: (s) => s.sexe },
    { id: "age", header: "Âge", cell: (s) => s.age, sortValue: (s) => s.age, align: "right" },
    { id: "niveau", header: "Niveau", cell: niveauBadge, sortValue: (s) => s.niveau },
    {
      id: "note",
      header: "Note",
      cell: (s) => noteCell(s, "table"),
      sortValue: (s) => (s.niveau ? s.note_entree ?? null : null),
    },
    { id: "action", header: "Action", cell: actionCell },
  ]

  const showStats = !!seminaristes && !error

  return (
    <DashboardLayout>
      <PageHeader
        title="Test d'entrée"
        description={
          showStats
            ? `${stats.toTest} à classer • Équilibrage A/B Secondaire/Primaire`
            : "Saisie des notes et attribution automatique des niveaux, avec équilibrage A/B Secondaire/Primaire."
        }
        actions={
          <Button variant="outline" onClick={fetchSeminaristes} disabled={loading}>
            <RefreshCw className={loading ? "animate-spin" : undefined} aria-hidden="true" />
            Actualiser
          </Button>
        }
      />

      <div className="space-y-6">
        {loading && !seminaristes ? (
          <StatGridSkeleton count={3} />
        ) : showStats ? (
          <StatGrid label="Indicateurs du test d'entrée" className="xl:grid-cols-3">
            <StatCard label="Séminaristes" value={stats.total} icon={Users} tone="brand" />
            <StatCard label="Classés" value={stats.classed} icon={GraduationCap} tone="success" />
            <StatCard label="À classer" value={stats.toTest} icon={ClipboardList} tone="warning" />
          </StatGrid>
        ) : null}

        {showStats && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card className="gap-3 py-4">
              <CardHeader className="px-4">
                <CardTitle>
                  <h2 className="flex items-center gap-2 text-base font-semibold">
                    <Scale className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    Équilibrage Secondaire/Primaire
                  </h2>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4">
                <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  {GROUPES.map((g) => (
                    <div key={g.key} className="flex items-center justify-between gap-2 border-b border-border pb-1.5">
                      <dt className="text-muted-foreground">{g.label}</dt>
                      <dd className="font-semibold tabular-nums text-foreground">{groupCounts[g.key]}</dd>
                    </div>
                  ))}
                </dl>
              </CardContent>
            </Card>

            <Card className="gap-3 py-4">
              <CardHeader className="px-4">
                <CardTitle>
                  <h2 className="flex items-center gap-2 text-base font-semibold">
                    <ListOrdered className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    Seuils de notes
                  </h2>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4">
                <dl className="grid grid-cols-1 gap-y-2 text-sm sm:grid-cols-2 sm:gap-x-6">
                  {SEUILS.map((s) => (
                    <div key={s.range} className="flex items-center justify-between gap-2 border-b border-border pb-1.5">
                      <dt className="font-mono tabular-nums text-muted-foreground">{s.range}</dt>
                      <dd className="font-medium text-foreground">{s.label}</dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-3 text-xs text-muted-foreground">
                  Équilibrage automatique A/B : le groupe le moins rempli est attribué en priorité.
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        <div>
          <FilterBar
            search={searchTerm}
            onSearchChange={setSearchTerm}
            searchLabel="Rechercher un séminariste"
            searchPlaceholder="Nom, prénom ou matricule…"
            filters={
              <Select value={selectedNiveau} onValueChange={setSelectedNiveau}>
                <SelectTrigger className="w-full bg-card sm:w-[200px]" aria-label="Filtrer par niveau">
                  <SelectValue placeholder="Niveau" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les niveaux</SelectItem>
                  {NIVEAU_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            }
            activeFilters={activeFilters}
            onReset={resetFilters}
            count={showStats ? countLabel(filteredSeminaristes.length, list.length, "séminariste", "séminaristes") : undefined}
          />

          <DataTable
            caption="Séminaristes et notes du test d'entrée"
            columns={columns}
            rows={filteredSeminaristes}
            getRowKey={(s) => s.id}
            loading={loading && !seminaristes}
            error={error}
            onRetry={fetchSeminaristes}
            pageSize={50}
            empty={
              filtersActive && list.length > 0 ? (
                <EmptyState
                  icon={GraduationCap}
                  title="Aucun résultat"
                  message="Aucun séminariste ne correspond à ces filtres."
                  action={<Button variant="outline" onClick={resetFilters}>Réinitialiser les filtres</Button>}
                />
              ) : (
                <EmptyState
                  icon={GraduationCap}
                  title="Aucun séminariste"
                  message="Les séminaristes inscrits apparaîtront ici pour la saisie des notes."
                />
              )
            }
            renderCard={(s) => (
              <div className="space-y-3 rounded-lg border border-border bg-card p-3">
                <div className="min-w-0 space-y-1.5">
                  <p className="font-medium text-foreground">{fullName(s)}</p>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-mono">{s.matricule}</span> • {s.sexe} • {s.age} ans
                  </p>
                  <div className="max-w-full">{niveauBadge(s)}</div>
                </div>
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Note</p>
                    {noteCell(s, "card")}
                  </div>
                  {actionCell(s)}
                </div>
              </div>
            )}
          />
        </div>
      </div>
    </DashboardLayout>
  )
}
