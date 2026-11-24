"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ClipboardList, Minus, PenLine, Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import ConfirmDialog from "@/components/common/confirm-dialog";
import { DataTable, type Column } from "@/components/common/data-table";
import { FilterBar, type ActiveFilter } from "@/components/common/filter-bar";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState, errorText } from "@/components/common/states";
import { StatusBadge } from "@/components/common/status-badge";
import { NiveauFilter, niveauxOf } from "@/components/documents/document-panels";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { Note, scientificApi, Seminariste } from "@/lib/api";
import { countLabel, matchesSearch } from "@/lib/table";
import NotesEntryModal from "./notes-entry-modal";

interface SeminaristeWithNotes extends Seminariste {
  notesMap?: Record<string, Note>; // { "note1": Note, "note2": Note, ... }
}

const PAGE_SIZE = 50;
const GENRES: Record<string, string> = { M: "Masculin", F: "Féminin" };

export default function NotesManagement() {
  const [seminaristes, setSeminaristes] = useState<SeminaristeWithNotes[]>([]);
  const [allNotes, setAllNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const query = useDebouncedValue(searchTerm);
  const [selectedGenre, setSelectedGenre] = useState("tous");
  const [selectedDortoir, setSelectedDortoir] = useState("tous");
  const [selectedNiveau, setSelectedNiveau] = useState("tous");
  const [showNotesEntryModal, setShowNotesEntryModal] = useState(false);

  // Colonnes de notes affichées (1 à 10)
  const [noteColumns, setNoteColumns] = useState(3);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const niveaux = useMemo(() => niveauxOf(seminaristes), [seminaristes]);
  const dortoirs = useMemo(
    () => Array.from(new Set(seminaristes.map((s) => s.dortoir).filter(Boolean))).sort((a, b) => a.localeCompare(b, "fr")),
    [seminaristes]
  );

  const fetchData = async () => {
    try {
      setLoading(true);
      setLoadError(null);

      const [semResponse, notesResponse] = await Promise.all([
        scientificApi.getSeminaristes(1, 10000),
        scientificApi.getNotes()
      ]);

      // Grouper les notes par matricule
      const notesByMatricule: Record<string, Record<string, Note>> = {};

      notesResponse.forEach((note: Note) => {
        if (!notesByMatricule[note.matricule]) {
          notesByMatricule[note.matricule] = {};
        }
        if (note.libelle) notesByMatricule[note.matricule][note.libelle] = note;
      });

      // Associer les notes aux séminaristes
      const semWithNotes: SeminaristeWithNotes[] = semResponse.data.map((sem: Seminariste) => ({
        ...sem,
        notesMap: notesByMatricule[sem.matricule] || {}
      }));

      setSeminaristes(semWithNotes);
      setAllNotes(notesResponse);

      // Détecter le nombre max de colonnes utilisées SEULEMENT au premier chargement
      if (noteColumns === 3 && notesResponse.length > 0) {
        const maxColumn = Math.max(1, ...notesResponse.map((n: Note) => {
          const num = parseInt((n.libelle ?? "").replace("note", ""));
          return isNaN(num) ? 1 : num;
        }));
        // Seulement augmenter, jamais diminuer automatiquement
        if (maxColumn > noteColumns) {
          setNoteColumns(maxColumn);
        }
      }
    } catch (error) {
      setLoadError(errorText(error, "Chargement des notes impossible"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredSeminaristes = useMemo(() => seminaristes.filter((sem) => {
    const matchesGenre = selectedGenre === "tous" || sem.sexe === selectedGenre;
    const matchesDortoir =
      selectedDortoir === "tous" ||
      (sem.dortoir ?? "").toLowerCase().includes(selectedDortoir.toLowerCase());
    const matchesNiveau = selectedNiveau === "tous" || sem.niveau === selectedNiveau;
    return matchesGenre && matchesDortoir && matchesNiveau && matchesSearch(query, [sem.nom, sem.prenom, sem.matricule]);
  }), [seminaristes, query, selectedGenre, selectedDortoir, selectedNiveau]);

  const activeFilters: ActiveFilter[] = [
    ...(selectedGenre !== "tous" ? [{ label: `Genre : ${GENRES[selectedGenre] ?? selectedGenre}`, onRemove: () => setSelectedGenre("tous") }] : []),
    ...(selectedDortoir !== "tous" ? [{ label: `Dortoir : ${selectedDortoir}`, onRemove: () => setSelectedDortoir("tous") }] : []),
    ...(selectedNiveau !== "tous" ? [{ label: `Niveau : ${selectedNiveau}`, onRemove: () => setSelectedNiveau("tous") }] : []),
  ];
  const filteredOut = activeFilters.length > 0 || !!query.trim();
  const resetFilters = () => {
    setSearchTerm("");
    setSelectedGenre("tous");
    setSelectedDortoir("tous");
    setSelectedNiveau("tous");
  };

  const handleRefresh = () => {
    scientificApi.invalidateCache();
    fetchData();
    toast.success("Liste actualisée");
  };

  const handleAddColumn = () => {
    if (noteColumns >= 10) {
      toast.warning("Maximum 10 colonnes de notes");
      return;
    }
    setNoteColumns(prev => prev + 1);
    toast.success(`Colonne Note ${noteColumns + 1} ajoutée`);
  };

  const handleRemoveColumn = async () => {
    if (noteColumns <= 1) {
      toast.warning("Minimum 1 colonne de notes");
      return;
    }
    setShowDeleteConfirm(true);
  };

  const confirmDeleteColumn = async () => {
    try {
      setDeleting(true);
      const libelleToDelete = `note${noteColumns}`;

      const deletedCount = await scientificApi.deleteNotesByLibelle(libelleToDelete);

      setNoteColumns(prev => prev - 1);
      setShowDeleteConfirm(false);

      toast.success(`${deletedCount} note(s) « Note ${noteColumns} » supprimée(s)`);

      await fetchData();
    } catch (error) {
      toast.error(errorText(error, "Suppression impossible"));
    } finally {
      setDeleting(false);
    }
  };

  const noteColumnIds = Array.from({ length: noteColumns }, (_, i) => i + 1);
  const noteOf = (sem: SeminaristeWithNotes, i: number) => sem.notesMap?.[`note${i}`]?.note;

  const columns: Column<SeminaristeWithNotes>[] = [
    { id: "matricule", header: "Matricule", cell: (s) => <span className="font-mono text-xs">{s.matricule}</span>, sortValue: (s) => s.matricule },
    {
      id: "nom", header: "Nom et prénom", sortValue: (s) => `${s.nom} ${s.prenom ?? ""}`,
      cell: (s) => (
        <div className="min-w-0">
          <div className="font-medium">{s.nom}</div>
          <div className="text-sm text-muted-foreground">{s.prenom}</div>
        </div>
      ),
    },
    { id: "genre", header: "Genre", cell: (s) => s.sexe, sortValue: (s) => s.sexe, hideBelow: "lg" },
    {
      id: "niveau", header: "Niveau", sortValue: (s) => s.niveau, hideBelow: "md",
      cell: (s) => s.niveau ?? <StatusBadge tone="warning">Non classé</StatusBadge>,
    },
    ...noteColumnIds.map((i): Column<SeminaristeWithNotes> => ({
      id: `note${i}`,
      header: `Note ${i}`,
      align: "center",
      sortValue: (s) => noteOf(s, i),
      className: "font-mono font-semibold tabular-nums",
      cell: (s) => noteOf(s, i)?.toFixed(0) || <span className="font-normal text-muted-foreground" aria-label="Aucune note">—</span>,
    })),
  ];

  return (
    <>
      <PageHeader
        title="Notes"
        description="Saisie et suivi des évaluations des séminaristes."
        actions={
          <>
            <Button variant="outline" onClick={handleRefresh} disabled={loading}>
              <RefreshCw className={loading ? "animate-spin" : undefined} aria-hidden="true" />
              Actualiser
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button>
                  <PenLine aria-hidden="true" />
                  Gérer les notes
                  <ChevronDown aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowNotesEntryModal(true)} className="gap-2">
                  <PenLine className="h-4 w-4" aria-hidden="true" />
                  Saisir des notes
                </DropdownMenuItem>
                {noteColumns < 10 && (
                  <DropdownMenuItem onClick={handleAddColumn} className="gap-2">
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    Ajouter la colonne Note {noteColumns + 1}
                  </DropdownMenuItem>
                )}
                {noteColumns > 1 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleRemoveColumn} className="gap-2 text-destructive focus:text-destructive">
                      <Minus className="h-4 w-4" aria-hidden="true" />
                      Supprimer la colonne Note {noteColumns}
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        }
      />

      <FilterBar
        search={searchTerm}
        onSearchChange={setSearchTerm}
        searchLabel="Rechercher un séminariste"
        searchPlaceholder="Nom, prénom ou matricule…"
        filters={
          <>
            <Select value={selectedGenre} onValueChange={setSelectedGenre}>
              <SelectTrigger className="w-full bg-card sm:w-36" aria-label="Filtrer par genre"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous les genres</SelectItem>
                <SelectItem value="M">Masculin</SelectItem>
                <SelectItem value="F">Féminin</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedDortoir} onValueChange={setSelectedDortoir}>
              <SelectTrigger className="w-full bg-card sm:w-40" aria-label="Filtrer par dortoir"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous les dortoirs</SelectItem>
                {dortoirs.map((dortoir) => <SelectItem key={dortoir} value={dortoir}>{dortoir}</SelectItem>)}
              </SelectContent>
            </Select>
            <NiveauFilter value={selectedNiveau} onChange={setSelectedNiveau} niveaux={niveaux} />
          </>
        }
        activeFilters={activeFilters}
        onReset={resetFilters}
        count={
          seminaristes.length > 0
            ? `${countLabel(filteredSeminaristes.length, seminaristes.length, "séminariste", "séminaristes")} · ${allNotes.length.toLocaleString("fr-FR")} note${allNotes.length > 1 ? "s" : ""} saisie${allNotes.length > 1 ? "s" : ""}`
            : undefined
        }
      />

      <DataTable
        caption="Notes des séminaristes par évaluation"
        columns={columns}
        rows={filteredSeminaristes}
        getRowKey={(s) => s.id}
        loading={loading && seminaristes.length === 0}
        error={loadError}
        onRetry={fetchData}
        pageSize={PAGE_SIZE}
        empty={
          <EmptyState
            icon={ClipboardList}
            title={filteredOut ? "Aucun résultat" : "Aucun séminariste"}
            message={filteredOut ? "Aucun séminariste ne correspond à ces filtres." : "Aucun séminariste n'est encore inscrit."}
            action={filteredOut ? <Button variant="outline" onClick={resetFilters}>Réinitialiser les filtres</Button> : undefined}
          />
        }
        renderCard={(s) => (
          <div className="rounded-lg border border-border bg-card p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium">{s.nom} {s.prenom}</p>
                <p className="font-mono text-xs text-muted-foreground">{s.matricule}</p>
              </div>
              {s.niveau ? <span className="text-sm text-muted-foreground">{s.niveau}</span> : <StatusBadge tone="warning">Non classé</StatusBadge>}
            </div>
            <dl className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
              {noteColumnIds.map((i) => (
                <div key={i} className="flex gap-1">
                  <dt className="text-muted-foreground">Note {i}</dt>
                  <dd className="font-mono font-semibold tabular-nums">{noteOf(s, i)?.toFixed(0) || "—"}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      />

      <NotesEntryModal
        open={showNotesEntryModal}
        onClose={() => setShowNotesEntryModal(false)}
        onSuccess={() => {
          fetchData();
          toast.success("Notes mises à jour");
        }}
        currentNoteColumns={noteColumns}
      />

      <ConfirmDialog
        open={showDeleteConfirm}
        busy={deleting}
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDeleteColumn}
        title={`Supprimer la colonne Note ${noteColumns} ?`}
        description={`Toutes les notes « Note ${noteColumns} » de tous les séminaristes seront définitivement supprimées.`}
        confirmLabel="Supprimer la colonne"
      />
    </>
  );
}
