"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Note, scientificApi, Seminariste } from "@/lib/api";
import { AlertTriangle, ChevronDown, Download, Loader2, Minus, Plus, RefreshCw, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import NotesEntryModal from "./notes-entry-modal";

interface SeminaristeWithNotes extends Seminariste {
  notesMap?: Record<string, Note>; // { "note1": Note, "note2": Note, ... }
}

export default function NotesManagement() {
  // ✅ ÉTATS
  const [seminaristes, setSeminaristes] = useState<SeminaristeWithNotes[]>([]);
  const [allNotes, setAllNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("tous");
  const [selectedDortoir, setSelectedDortoir] = useState("tous");
  const [selectedNiveau, setSelectedNiveau] = useState("tous");
  // ✅ MODAL ENTRÉE NOTES
  const [showNotesEntryModal, setShowNotesEntryModal] = useState(false);
  
  // ✅ COLONNES DYNAMIQUES (1-4)
  const [noteColumns, setNoteColumns] = useState(3);
  
  // ✅ MODAL CONFIRMATION SUPPRESSION
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // ✅ FILTRES DYNAMIQUES
  const dynamicFilters = {
    niveaux: Array.from(new Set(seminaristes.map(s => s.niveau).filter(Boolean))),
    dortoirs: Array.from(new Set(seminaristes.map(s => s.dortoir).filter(Boolean))),
  };

  // ✅ FETCH SÉMINARISTES ET NOTES
  const fetchData = async () => {
    try {
      setLoading(true);
      
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
    } catch (error: any) {
      console.error("❌ Erreur fetch:", error);
      toast.error(error.message || "Erreur chargement données");
    } finally {
      setLoading(false);
    }
  };

  // ✅ FETCH INITIAL
  useEffect(() => {
    fetchData();
  }, []);

  // ✅ FILTRER SÉMINARISTES
  const filteredSeminaristes = seminaristes.filter((sem) => {
    const fullName = `${sem.nom} ${sem.prenom || ''}`.toLowerCase();
    const matchesSearch = 
      !searchTerm || 
      fullName.includes(searchTerm.toLowerCase()) ||
      sem.matricule.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesGenre = selectedGenre === "tous" || sem.sexe === selectedGenre;
    
    const matchesDortoir = 
      selectedDortoir === "tous" || 
      sem.dortoir.toLowerCase().includes(selectedDortoir.toLowerCase());
    
    const matchesNiveau = 
      selectedNiveau === "tous" || 
      sem.niveau === selectedNiveau;

    return matchesSearch && matchesGenre && matchesDortoir && matchesNiveau;
  });

  // ✅ REFRESH
  const handleRefresh = () => {
    scientificApi.invalidateCache();
    fetchData();
    toast.success("🔄 Liste actualisée");
  };

  // ✅ EXPORTER
  const handleExport = () => {
    toast.info("📥 Export en développement...");
  };

  // ✅ AJOUTER COLONNE (NOTE 4)
  const handleAddColumn = () => {
    if (noteColumns >= 10) {
      toast.warning("Maximum 10 colonnes de notes");
      return;
    }
    setNoteColumns(prev => prev + 1);
    toast.success(`✅ Colonne NOTE ${noteColumns + 1} ajoutée`);
  };

  // ✅ SUPPRIMER COLONNE (avec confirmation)
  const handleRemoveColumn = async () => {
    if (noteColumns <= 1) {
      toast.warning("Minimum 1 colonne de notes");
      return;
    }
    setShowDeleteConfirm(true);
  };

  // ✅ CONFIRMER SUPPRESSION
  const confirmDeleteColumn = async () => {
    try {
      setDeleting(true);
      const libelleToDelete = `note${noteColumns}`;
      
      const deletedCount = await scientificApi.deleteNotesByLibelle(libelleToDelete);
      
      setNoteColumns(prev => prev - 1);
      setShowDeleteConfirm(false);
      
      toast.success(`✅ ${deletedCount} note(s) "${libelleToDelete}" supprimée(s)`);
      
      // Rafraîchir les données
      await fetchData();
    } catch (error: any) {
      console.error("❌ Erreur suppression:", error);
      toast.error(error.message || "Erreur lors de la suppression");
    } finally {
      setDeleting(false);
    }
  };

  // ✅ HANDLE ADD NOTES - Open modal
  const handleOpenNotesEntry = () => {
    setShowNotesEntryModal(true);
  };

  // ✅ GÉNÉRER LES COLONNES DE NOTES DYNAMIQUEMENT
  const renderNoteColumns = () => {
    const columns = [];
    for (let i = 1; i <= noteColumns; i++) {
      columns.push(
        <TableHead key={`note-header-${i}`} className="w-[80px] text-center">
          NOTE {i}
        </TableHead>
      );
    }
    return columns;
  };

  const renderNoteCells = (seminarist: SeminaristeWithNotes) => {
    const cells = [];
    for (let i = 1; i <= noteColumns; i++) {
      const noteKey = `note${i}`;
      const note = seminarist.notesMap?.[noteKey];
      cells.push(
        <TableCell key={`note-cell-${i}`} className="text-center font-bold font-mono">
          {note?.note?.toFixed(0) || "—"}
        </TableCell>
      );
    }
    return cells;
  };

  // ✅ LOADING STATE
  if (loading) {
    return (
      <Card>
        <CardContent className="p-12">
          <div className="flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <div className="text-lg font-semibold">Chargement des notes...</div>
            <p className="text-sm text-muted-foreground">Veuillez patienter</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-border">
        <CardHeader className="space-y-4">
          {/* ✅ SEARCH AND FILTERS */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, prénom ou matricule..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Genre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tous">TOUS</SelectItem>
                  <SelectItem value="M">Masculin</SelectItem>
                  <SelectItem value="F">Féminin</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedDortoir} onValueChange={setSelectedDortoir}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Dortoir" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tous">TOUS</SelectItem>
                  {dynamicFilters.dortoirs.map((dortoir) => (
                    <SelectItem key={dortoir} value={dortoir}>
                      {dortoir}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedNiveau} onValueChange={setSelectedNiveau}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Niveau" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tous">TOUS</SelectItem>
                  {dynamicFilters.niveaux.map((niveau) => (
                    <SelectItem key={niveau} value={niveau || ''}>
                      {niveau || 'Non classé'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* ✅ ACTION BUTTONS */}
          <div className="flex flex-col sm:flex-row gap-2 sm:justify-between sm:items-center">
            <div className="flex gap-2 flex-wrap">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                TOTAL {seminaristes.length.toString().padStart(3, "0")}
              </Badge>
              <Badge variant="outline" className="bg-secondary/10 text-secondary border-secondary/20">
                FILTRES {filteredSeminaristes.length.toString().padStart(3, "0")}
              </Badge>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                NOTES {allNotes.length.toString().padStart(3, "0")}
              </Badge>
              <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20">
                COLONNES {noteColumns}
              </Badge>
            </div>

            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleRefresh}
                className="gap-2 h-9"
              >
                <RefreshCw className="h-4 w-4" />
                Actualiser
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2 h-9"
                onClick={handleExport}
              >
                <Download className="h-4 w-4" />
                EXPORTER
              </Button>
              
              {/* ✅ DROPDOWN AJOUTER/SUPPRIMER NOTE */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" className="gap-2 bg-primary hover:bg-primary/90 h-9">
                    <Plus className="h-4 w-4" />
                    GÉRER NOTES
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem 
                    onClick={handleOpenNotesEntry}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Saisir des notes
                  </DropdownMenuItem>
                  {noteColumns < 10 && (
                    <DropdownMenuItem 
                      onClick={handleAddColumn}
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4 text-green-600" />
                      Ajouter colonne NOTE {noteColumns + 1}
                    </DropdownMenuItem>
                  )}
                  {noteColumns > 1 && (
                    <DropdownMenuItem 
                      onClick={handleRemoveColumn}
                      className="gap-2 text-destructive focus:text-destructive"
                    >
                      <Minus className="h-4 w-4" />
                      Supprimer colonne NOTE {noteColumns}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* ✅ RESULTS COUNT */}
          <div className="text-sm text-muted-foreground">
            {filteredSeminaristes.length > 0 
              ? `Affichage de ${filteredSeminaristes.length} séminariste(s)`
              : "Aucun résultat"}
          </div>
        </CardHeader>

        <CardContent>
          {/* ✅ TABLE */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">N°</TableHead>
                  <TableHead className="w-[120px]">MATRICULE</TableHead>
                  <TableHead>NOM & PRÉNOM</TableHead>
                  <TableHead className="w-[70px]">GENRE</TableHead>
                  <TableHead className="w-[200px]">NIVEAU</TableHead>
                  {renderNoteColumns()}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSeminaristes.map((seminarist, index) => (
                  <TableRow key={seminarist.id}>
                    <TableCell className="font-mono text-muted-foreground w-[50px]">
                      {index + 1}
                    </TableCell>
                    <TableCell className="font-medium font-mono">
                      {seminarist.matricule}
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold">{seminarist.nom}</div>
                      <div className="text-sm text-muted-foreground">{seminarist.prenom}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={seminarist.sexe === "M" ? "default" : "secondary"}>
                        {seminarist.sexe}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {seminarist.niveau ? (
                        <Badge variant="outline" className="font-semibold">
                          {seminarist.niveau}
                        </Badge>
                      ) : (
                        <Badge variant="destructive">Non classé</Badge>
                      )}
                    </TableCell>
                    {renderNoteCells(seminarist)}
                  </TableRow>
                ))}
                
                {filteredSeminaristes.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5 + noteColumns} className="h-24 text-center">
                      <div className="text-muted-foreground">
                        Aucun séminariste trouvé
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* ✅ PAGINATION PLACEHOLDER */}
          {filteredSeminaristes.length > 50 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button variant="outline" size="sm">Précédent</Button>
              <Button variant="outline" size="sm" className="bg-primary text-primary-foreground">
                1
              </Button>
              <Button variant="outline" size="sm">2</Button>
              <Button variant="outline" size="sm">3</Button>
              <span className="text-muted-foreground">...</span>
              <Button variant="outline" size="sm">Suivant</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ✅ MODAL SAISIE NOTES */}
      <NotesEntryModal
        open={showNotesEntryModal}
        onClose={() => setShowNotesEntryModal(false)}
        onSuccess={() => {
          fetchData();
          toast.success("✅ Notes mises à jour");
        }}
        currentNoteColumns={noteColumns}
      />

      {/* ✅ MODAL CONFIRMATION SUPPRESSION */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Confirmer la suppression
            </DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer <span className="font-semibold">toutes les notes de la colonne NOTE {noteColumns}</span> ? 
              Cette action est irréversible et supprimera les données de tous les séminaristes.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={deleting}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteColumn}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Suppression...
                </>
              ) : (
                <>
                  <Minus className="mr-2 h-4 w-4" />
                  Supprimer NOTE {noteColumns}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
