"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Eye, MessageSquare, Star, ThumbsDown, ThumbsUp, Trash2, Users } from "lucide-react"
import { toast } from "sonner"

import ConfirmDialog from "@/components/common/confirm-dialog"
import { DataTable, type Column } from "@/components/common/data-table"
import { FilterBar, type ActiveFilter } from "@/components/common/filter-bar"
import { PageHeader } from "@/components/common/page-header"
import { StatCard, StatGrid, StatGridSkeleton } from "@/components/common/stat-card"
import { EmptyState, ErrorState, ListSkeleton, errorText } from "@/components/common/states"
import { StatusBadge, type StatusTone } from "@/components/common/status-badge"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Feedback, FeedbackAnalytics, feedbackApi } from "@/lib/api"
import { countLabel } from "@/lib/table"

const SEXE_LABELS: Record<string, string> = { M: "Masculin", F: "Féminin" }
const RECOMMANDE_LABELS: Record<string, string> = { true: "oui", false: "non" }

export default function FeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [analytics, setAnalytics] = useState<FeedbackAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingList, setLoadingList] = useState(false)
  // Erreurs affichées dans la page (ErrorState) en plus des notifications existantes
  const [analyticsError, setAnalyticsError] = useState<string | null>(null)
  const [listError, setListError] = useState<string | null>(null)

  // Filters
  const [filterSexe, setFilterSexe] = useState<string>("all")
  const [filterRecommande, setFilterRecommande] = useState<string>("all")

  // Pagination
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const LIMIT = 50

  // Selection for details
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  // Suppression (confirmation)
  const [toDelete, setToDelete] = useState<Feedback | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchInitialData = async () => {
    try {
      setLoading(true)
      setAnalyticsError(null)
      const [analyticsData] = await Promise.all([
        feedbackApi.getAnalytics(),
        fetchFeedbacks(true), // Direct fetch for first load
      ])
      setAnalytics(analyticsData)
    } catch (error) {
      console.error("Error fetching data:", error)
      setAnalyticsError(errorText(error, "Indicateurs indisponibles"))
      toast.error("Impossible de charger les données")
    } finally {
      setLoading(false)
    }
  }

  const fetchFeedbacks = async (isInitial = false) => {
    if (!isInitial) setLoadingList(true)
    try {
      setListError(null)
      const filters: { sexe?: string; recommande?: boolean } = {}
      if (filterSexe !== "all") filters.sexe = filterSexe
      if (filterRecommande !== "all") filters.recommande = filterRecommande === "true"

      const res = await feedbackApi.getAll(page, LIMIT, filters)
      setFeedbacks(res.data)
      setTotal(res.total)
      return res
    } catch (error) {
      console.error("Error fetching feedbacks:", error)
      setListError(errorText(error, "Liste des avis indisponible"))
      if (!isInitial) toast.error("Erreur lors du chargement des avis")
    } finally {
      if (!isInitial) setLoadingList(false)
    }
  }

  // Initial Data Load
  useEffect(() => {
    fetchInitialData()
  }, [])

  // Fetch list when filters or page change
  useEffect(() => {
    fetchFeedbacks()
  }, [page, filterSexe, filterRecommande])

  const handleDelete = async () => {
    if (!toDelete) return
    setDeleting(true)
    try {
      await feedbackApi.delete(toDelete.id)
      toast.success("Avis supprimé avec succès")
      setToDelete(null)

      // Refresh list and analytics
      fetchFeedbacks()
      const newAnalytics = await feedbackApi.getAnalytics()
      setAnalytics(newAnalytics)
    } catch (error) {
      console.error("Error deleting feedback:", error)
      toast.error("Erreur lors de la suppression")
    } finally {
      setDeleting(false)
    }
  }

  const openDetails = (feedback: Feedback) => {
    setSelectedFeedback(feedback)
    setIsDetailOpen(true)
  }

  const filteredOut = filterSexe !== "all" || filterRecommande !== "all"
  const resetFilters = () => {
    setFilterSexe("all")
    setFilterRecommande("all")
  }
  const activeFilters: ActiveFilter[] = [
    ...(filterSexe !== "all" ? [{ label: `Sexe : ${SEXE_LABELS[filterSexe]}`, onRemove: () => setFilterSexe("all") }] : []),
    ...(filterRecommande !== "all"
      ? [{ label: `Recommande : ${RECOMMANDE_LABELS[filterRecommande]}`, onRemove: () => setFilterRecommande("all") }]
      : []),
  ]

  const displayName = (f: Feedback) => f.nom || "Anonyme"
  const shortDate = (f: Feedback) => format(new Date(f.created_at), "dd MMM HH:mm", { locale: fr })

  const nameButton = (f: Feedback) => (
    <button
      type="button"
      onClick={() => openDetails(f)}
      className="rounded-sm text-left font-medium text-foreground underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70"
    >
      {displayName(f)}
    </button>
  )

  const rowActions = (f: Feedback) => (
    <div className="flex justify-end gap-1">
      <Button size="icon" variant="ghost" aria-label={`Voir l'avis de ${displayName(f)}`} onClick={() => openDetails(f)}>
        <Eye className="h-4 w-4" aria-hidden="true" />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        className="text-destructive hover:bg-destructive-soft hover:text-destructive"
        aria-label={`Supprimer l'avis de ${displayName(f)}`}
        onClick={() => setToDelete(f)}
      >
        <Trash2 className="h-4 w-4" aria-hidden="true" />
      </Button>
    </div>
  )

  const columns: Column<Feedback>[] = [
    { id: "date", header: "Date", cell: (f) => <span className="whitespace-nowrap">{shortDate(f)}</span> },
    { id: "nom", header: "Nom", cell: nameButton },
    { id: "sexe", header: "Sexe", cell: (f) => <StatusBadge icon={null}>{f.sexe}</StatusBadge>, hideBelow: "lg" },
    {
      id: "globale", header: "Note globale", align: "center",
      cell: (f) => <span className="font-semibold tabular-nums">{f.note_globale}</span>,
    },
    { id: "organisation", header: "Organisation", align: "center", cell: (f) => <NoteBadge note={f.note_organisation} /> },
    { id: "contenu", header: "Contenu", align: "center", cell: (f) => <NoteBadge note={f.qualite_formations} /> },
    { id: "dortoir", header: "Confort dortoir", align: "center", cell: (f) => <NoteBadge note={f.confort_dortoirs} />, hideBelow: "lg" },
    { id: "repas", header: "Qualité repas", align: "center", cell: (f) => <NoteBadge note={f.qualite_nourriture} />, hideBelow: "lg" },
    { id: "actions", header: <span className="sr-only">Actions</span>, cell: rowActions, align: "right" },
  ]

  return (
    <DashboardLayout>
      <PageHeader title="Avis des séminaristes" description="Consultez les retours des séminaristes." />

      {/* Indicateurs */}
      {loading ? (
        <StatGridSkeleton />
      ) : analytics ? (
        <StatGrid label="Indicateurs des avis">
          <StatCard label="Total des avis" value={analytics.total_responses} icon={MessageSquare} tone="brand" />
          <StatCard label="Note globale" value={`${analytics.moyenne_globale.toFixed(1)}/5`} icon={Star} tone="warning" />
          <StatCard label="Recommandation" value={`${analytics.pourcentage_recommande.toFixed(0)} %`} icon={ThumbsUp} tone="success" />
          <StatCard
            label="Participation féminine"
            value={analytics.repartition_sexe.F || 0}
            hint={`sur ${analytics.total_responses} au total`}
            icon={Users}
            tone="info"
          />
        </StatGrid>
      ) : analyticsError ? (
        <div className="rounded-lg border border-border bg-card">
          <ErrorState message={analyticsError} onRetry={fetchInitialData} />
        </div>
      ) : null}

      <div className="mt-6">
        <FilterBar
          filters={
            <>
              <Select value={filterSexe} onValueChange={setFilterSexe}>
                <SelectTrigger className="w-full bg-card sm:w-48" aria-label="Filtrer par sexe">
                  <SelectValue placeholder="Sexe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les sexes</SelectItem>
                  <SelectItem value="M">Masculin</SelectItem>
                  <SelectItem value="F">Féminin</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterRecommande} onValueChange={setFilterRecommande}>
                <SelectTrigger className="w-full bg-card sm:w-56" aria-label="Filtrer par recommandation">
                  <SelectValue placeholder="Recommandation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les recommandations</SelectItem>
                  <SelectItem value="true">Recommande</SelectItem>
                  <SelectItem value="false">Ne recommande pas</SelectItem>
                </SelectContent>
              </Select>
            </>
          }
          activeFilters={activeFilters}
          onReset={resetFilters}
          count={!loading && !loadingList && !listError ? countLabel(feedbacks.length, total, "avis", "avis") : undefined}
        />

        {/* Légende */}
        <div className="mb-4 flex flex-wrap items-center gap-2 text-sm" aria-label="Légende des notes" role="group">
          <span className="text-muted-foreground">Légende des notes :</span>
          <StatusBadge tone="success">Excellent (≥ 4/5)</StatusBadge>
          <StatusBadge tone="warning">Correct (≥ 3/5)</StatusBadge>
          <StatusBadge tone="danger">Insuffisant (&lt; 3/5)</StatusBadge>
        </div>

        {loading ? (
          <ListSkeleton label="Chargement des avis…" />
        ) : (
          <DataTable
            caption="Avis des séminaristes"
            columns={columns}
            rows={feedbacks}
            getRowKey={(f) => f.id}
            loading={loadingList}
            error={listError}
            onRetry={() => fetchFeedbacks()}
            empty={
              <EmptyState
                icon={MessageSquare}
                title={filteredOut ? "Aucun résultat" : "Aucun avis"}
                message={filteredOut ? "Aucun avis ne correspond à ces filtres." : "Les avis envoyés par les séminaristes apparaîtront ici."}
                action={filteredOut ? <Button variant="outline" onClick={resetFilters}>Réinitialiser les filtres</Button> : undefined}
              />
            }
            renderCard={(f) => (
              <div className="rounded-lg border border-border bg-card p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p>{nameButton(f)}</p>
                    <p className="text-xs text-muted-foreground">
                      {shortDate(f)} · {SEXE_LABELS[f.sexe] ?? f.sexe}
                    </p>
                    <p className="mt-1 text-sm">
                      Note globale : <span className="font-semibold tabular-nums">{f.note_globale}</span>
                    </p>
                  </div>
                  {rowActions(f)}
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <NoteCardItem label="Organisation" note={f.note_organisation} />
                  <NoteCardItem label="Contenu" note={f.qualite_formations} />
                  <NoteCardItem label="Confort dortoir" note={f.confort_dortoirs} />
                  <NoteCardItem label="Qualité repas" note={f.qualite_nourriture} />
                </dl>
              </div>
            )}
          />
        )}
      </div>

      {/* Détail d'un avis */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails de l&apos;avis</DialogTitle>
            <DialogDescription>
              {selectedFeedback
                ? `Envoyé le ${format(new Date(selectedFeedback.created_at), "dd MMMM yyyy à HH:mm", { locale: fr })}`
                : ""}
            </DialogDescription>
          </DialogHeader>
          {selectedFeedback && (
            <div className="grid gap-6 py-2">
              <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
                <div>
                  <dt className="font-medium text-muted-foreground">Nom</dt>
                  <dd className="mt-0.5 text-base font-medium text-foreground">{displayName(selectedFeedback)}</dd>
                </div>
                <div>
                  <dt className="font-medium text-muted-foreground">Sexe</dt>
                  <dd className="mt-0.5 text-foreground">{selectedFeedback.sexe === "M" ? "Masculin" : "Féminin"}</dd>
                </div>
                <div>
                  <dt className="font-medium text-muted-foreground">Recommande</dt>
                  <dd className="mt-1">
                    {selectedFeedback.recommande ? (
                      <StatusBadge tone="success" icon={ThumbsUp}>Oui</StatusBadge>
                    ) : (
                      <StatusBadge tone="danger" icon={ThumbsDown}>Non</StatusBadge>
                    )}
                  </dd>
                </div>
              </dl>

              <section className="border-t border-border pt-4">
                <h3 className="mb-3 font-semibold text-foreground">Notes détaillées</h3>
                <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  <NoteItem label="Globale" value={selectedFeedback.note_globale} isMain />
                  <NoteItem label="Organisation" value={selectedFeedback.note_organisation} />
                  <NoteItem label="Contenu / Kiam" value={selectedFeedback.qualite_contenu} />
                  <NoteItem label="Formations" value={selectedFeedback.qualite_formations} />
                  <NoteItem label="Dortoirs" value={selectedFeedback.confort_dortoirs} />
                  <NoteItem label="Nourriture" value={selectedFeedback.qualite_nourriture} />
                </dl>
              </section>

              <section className="space-y-4 border-t border-border pt-4">
                <div>
                  <h3 className="mb-1 font-semibold text-foreground">Points appréciés</h3>
                  <p className="whitespace-pre-wrap rounded-md bg-muted p-3 text-sm text-foreground">
                    {selectedFeedback.points_apprecies || "Aucun commentaire"}
                  </p>
                </div>
                <div>
                  <h3 className="mb-1 font-semibold text-foreground">Suggestions</h3>
                  <p className="whitespace-pre-wrap rounded-md bg-muted p-3 text-sm text-foreground">
                    {selectedFeedback.suggestions || "Aucune suggestion"}
                  </p>
                </div>
              </section>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!toDelete}
        busy={deleting}
        onCancel={() => setToDelete(null)}
        onConfirm={handleDelete}
        title="Supprimer cet avis ?"
        description={`Êtes-vous sûr de vouloir supprimer l'avis de ${toDelete ? displayName(toDelete) : ""} ? Cette action est définitive.`}
      />
    </DashboardLayout>
  )
}

// Ton de la note : la légende associe chaque ton (icône + couleur) à un seuil ; 0 = non noté (neutre)
function noteTone(note: number): StatusTone {
  if (note >= 4) return "success"
  if (note >= 3) return "warning"
  if (note > 0) return "danger"
  return "neutral"
}

function NoteBadge({ note }: { note: number }) {
  return <StatusBadge tone={noteTone(note)} className="tabular-nums">{note}/5</StatusBadge>
}

function NoteCardItem({ label, note }: { label: string; note: number }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd><NoteBadge note={note} /></dd>
    </div>
  )
}

function NoteItem({ label, value, isMain = false }: { label: string; value: number; isMain?: boolean }) {
  return (
    <div className="flex flex-col">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={`font-semibold tabular-nums text-foreground ${isMain ? "text-xl" : "text-base"}`}>{value}/5</dd>
    </div>
  )
}
