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
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { CreateNote, scientificApi, UpdateNote } from "@/lib/api";
import { CheckCircle2, Download, Edit, GraduationCap, Plus, RefreshCw, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

interface Note {
  id: string;
  matricule: string;
  nom_seminariste: string;
  prenom_seminariste: string;
  matiere_code: string;
  nom_matiere: string;
  coefficient: number;
  note: number;
  type: string;
  observation: string;
  created_at: string;
}

interface Seminariste {
  matricule: string;
  nom: string;
  prenom: string;
  niveau_academique: string;
}

interface Matiere {
  code: string;
  nom: string;
  coefficient: number;
}

interface NotesTableProps {}

export default function NotesTable({}: NotesTableProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("tous");
  const [selectedNiveau, setSelectedNiveau] = useState("tous");

  // ✅ MODAL ÉDITION NOTE
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [updateData, setUpdateData] = useState<UpdateNote>({
    note: 0,
    observation: "",
  });
  const [updating, setUpdating] = useState(false);

  // ✅ AJOUT NOTE - ÉTAPE 1: SÉLECTION NIVEAU
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [selectedLevelForAdd, setSelectedLevelForAdd] = useState("");
  const [availableLevels, setAvailableLevels] = useState<string[]>([]);

  // ✅ AJOUT NOTE - ÉTAPE 2: FORMULAIRE
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);
  const [seminaristesOfLevel, setSeminaristesOfLevel] = useState<Seminariste[]>([]);
  const [availableMatieres, setAvailableMatieres] = useState<Matiere[]>([]);
  const [createData, setCreateData] = useState<CreateNote>({
    matricule: "",
    matiere_code: "",
    note: 0,
    type: "",
    observation: "",
  });
  const [creating, setCreating] = useState(false);

  // ✅ FILTRES DYNAMIQUES
  const dynamicFilters = useMemo(() => {
    const genres = Array.from(new Set(notes.map(n => 
      n.nom_seminariste.includes(" ") ? "M" : "F"
    ))).sort();
    
    const niveaus = Array.from(new Set(
      notes.map(n => n.matricule.split("-")[0])
    )).filter(Boolean).sort();
    
    return { genres, niveaus };
  }, [notes]);

  // Fetch notes
  useEffect(() => {
    fetchNotes();
    fetchMetadata();
  }, []);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const data = await scientificApi.getNotes();
      setNotes(data as Note[]);
    } catch (error) {
      console.error("Erreur notes:", error);
      toast.error("Erreur chargement notes");
    } finally {
      setLoading(false);
    }
  };

  const fetchMetadata = async () => {
    try {
      const metadata = await scientificApi.getStaticMetadata();
      
      // Extraire niveaux
      const levels = Object.values(metadata.niveaux_academiques || {}).flat();
      setAvailableLevels(levels);

      // Mock matières (à adapter selon votre API)
      setAvailableMatieres([
        { code: "MATH", nom: "Mathématiques", coefficient: 3 },
        { code: "FR", nom: "Français", coefficient: 3 },
        { code: "ANG", nom: "Anglais", coefficient: 2 },
        { code: "HIS", nom: "Histoire", coefficient: 2 },
        { code: "SVT", nom: "SVT", coefficient: 2 },
      ]);
    } catch (error) {
      console.error("Erreur metadata:", error);
    }
  };

  // ✅ ÉTAPE 1: OUVRIR MODAL NIVEAU
  const openLevelSelectionModal = () => {
    setSelectedLevelForAdd("");
    setShowLevelModal(true);
  };

  // ✅ ÉTAPE 2: CHARGER SÉMINARISTES DU NIVEAU
  const handleLevelSelected = async () => {
    if (!selectedLevelForAdd) {
      toast.error("Veuillez sélectionner un niveau");
      return;
    }

    try {
      setLoading(true);
      const allSeminaristes = await scientificApi.getSeminaristes();
      
      // Filtrer par niveau
      const filtered = allSeminaristes.filter(
        (s: Seminariste) => s.niveau_academique === selectedLevelForAdd
      );

      setSeminaristesOfLevel(filtered);
      setShowLevelModal(false);
      setShowAddNoteModal(true);
      setCreateData({
        matricule: "",
        matiere_code: "",
        note: 0,
        type: "Devoir",
        observation: "",
      });
    } catch (error) {
      console.error("Erreur séminaristes:", error);
      toast.error("Erreur chargement séminaristes");
    } finally {
      setLoading(false);
    }
  };

  // ✅ FERMER MODAL AJOUT
  const closeAddNoteModal = () => {
    setShowAddNoteModal(false);
    setSeminaristesOfLevel([]);
    setCreateData({
      matricule: "",
      matiere_code: "",
      note: 0,
      type: "",
      observation: "",
    });
  };

  // ✅ CREATE NOTE
  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!createData.matricule || !createData.matiere_code) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    try {
      setCreating(true);
      await scientificApi.createNote(createData);
      toast.success("Note ajoutée avec succès!");

      // Refresh
      await fetchNotes();
      closeAddNoteModal();
    } catch (error: any) {
      console.error("Erreur création:", error);
      toast.error(error.message || "Erreur ajout note");
    } finally {
      setCreating(false);
    }
  };

  // ✅ OUVRIR MODAL ÉDITION
  const openEditModal = (note: Note) => {
    setEditingNote(note);
    setUpdateData({
      note: note.note,
      observation: note.observation,
    });
    setShowEditModal(true);
  };

  // ✅ FERMER MODAL ÉDITION
  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingNote(null);
    setUpdateData({ note: 0, observation: "" });
  };

  // ✅ UPDATE NOTE
  const handleUpdateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNote) return;

    try {
      setUpdating(true);
      await scientificApi.updateNote(editingNote.id, updateData);
      toast.success("Note mise à jour avec succès!");

      await fetchNotes();
      closeEditModal();
    } catch (error: any) {
      console.error("Erreur update:", error);
      toast.error(error.message || "Erreur mise à jour note");
    } finally {
      setUpdating(false);
    }
  };

  const filteredNotes = notes.filter((note) => {
    const fullName = `${note.nom_seminariste} ${note.prenom_seminariste}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchTerm.toLowerCase()) ||
      note.matricule.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.nom_matiere.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesGenre = selectedGenre === "tous";
    const matchesNiveau = selectedNiveau === "tous" || 
      note.matricule.includes(selectedNiveau);

    return matchesSearch && matchesGenre && matchesNiveau;
  });

  if (loading && notes.length === 0) {
    return (
      <Card className="border-border">
        <CardContent className="p-8">
          <div className="space-y-4">
            <div className="h-8 w-64 bg-muted rounded animate-pulse" />
            <div className="space-y-2">
              {Array(5).fill(0).map((_, i) => (
                <div key={i} className="h-10 bg-muted rounded animate-pulse" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-border">
        <CardHeader className="space-y-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, matricule ou matière..."
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
                  {dynamicFilters.genres.map((genre) => (
                    <SelectItem key={genre} value={genre}>
                      {genre === "M" ? "Masculin" : "Féminin"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedNiveau} onValueChange={setSelectedNiveau}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Niveau" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tous">TOUS</SelectItem>
                  {dynamicFilters.niveaus.map((niveau) => (
                    <SelectItem key={niveau} value={niveau}>
                      {niveau}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:justify-between sm:items-center">
            <div className="flex gap-2">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                TOTAL {notes.length.toString().padStart(3, "0")}
              </Badge>
              <Badge variant="outline" className="bg-secondary/10 text-secondary border-secondary/20">
                FILTRES {filteredNotes.length.toString().padStart(3, "0")}
              </Badge>
            </div>

            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={fetchNotes} className="gap-2 h-9">
                <RefreshCw className="h-4 w-4" />
                Actualiser
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                Exporter
              </Button>
              {/* ✅ BOUTON AJOUTER NOTE */}
              <Button 
                size="sm" 
                className="gap-2 bg-primary hover:bg-primary/90"
                onClick={openLevelSelectionModal}
              >
                <Plus className="h-4 w-4" />
                Ajouter Note
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">N°</TableHead>
                  <TableHead>MATRICULE</TableHead>
                  <TableHead>SÉMINARISTE</TableHead>
                  <TableHead>NOTE</TableHead>
                  <TableHead>TYPE</TableHead>
                  <TableHead>DATE</TableHead>
                  <TableHead>ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredNotes.slice(0, 20).map((note, index) => (
                  <TableRow key={note.id}>
                    <TableCell className="font-mono text-muted-foreground w-[50px]">
                      {index + 1}
                    </TableCell>
                    <TableCell className="font-medium">{note.matricule}</TableCell>
                    <TableCell className="max-w-[200px]">
                      <div>
                        <div className="font-medium">{note.nom_seminariste}</div>
                        <div className="text-sm text-muted-foreground">{note.prenom_seminariste}</div>
                      </div>
                    </TableCell>
                    {/* <TableCell className="max-w-[150px] truncate">{note.nom_matiere}</TableCell>
                    <TableCell>{note.coefficient}</TableCell> */}
                    <TableCell className="font-semibold text-primary">
                      {note.note?.toFixed(2) || "00.00"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{note.type}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(note.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-secondary hover:text-secondary/80"
                          onClick={() => openEditModal(note)}
                          title="Modifier note"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredNotes.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                      Aucune note trouvée
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {notes.length > 20 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-muted-foreground">
                Affichage 1-20 sur {notes.length.toString().padStart(3, "0")} notes
              </div>
              <div className="flex gap-1">
                <Button variant="outline" size="sm">Précédent</Button>
                <Button variant="outline" size="sm">Suivant</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ✅ MODAL ÉTAPE 1: SÉLECTION NIVEAU */}
      <Dialog open={showLevelModal} onOpenChange={setShowLevelModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              Sélectionner le Niveau Académique
            </DialogTitle>
            <DialogDescription>
              Choisissez le niveau académique des séminaristes pour lesquels vous souhaitez ajouter des notes
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Niveau *</label>
              <Select value={selectedLevelForAdd} onValueChange={setSelectedLevelForAdd}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sélectionnez un niveau" />
                </SelectTrigger>
                <SelectContent>
                  {availableLevels.map((level) => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowLevelModal(false)}
            >
              Annuler
            </Button>
            <Button
              onClick={handleLevelSelected}
              disabled={!selectedLevelForAdd}
              className="bg-primary hover:bg-primary/90"
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Continuer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ✅ MODAL ÉTAPE 2: FORMULAIRE AJOUT NOTE */}
      <Dialog open={showAddNoteModal} onOpenChange={setShowAddNoteModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ajouter une Note - {selectedLevelForAdd}</DialogTitle>
            <DialogDescription>
              Remplissez les informations pour ajouter une nouvelle note
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateNote} className="space-y-4">
            {/* Séminariste */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Séminariste *</label>
              <Select 
                value={createData.matricule} 
                onValueChange={(value) => setCreateData(prev => ({ ...prev, matricule: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un séminariste" />
                </SelectTrigger>
                <SelectContent>
                  {seminaristesOfLevel.map((sem) => (
                    <SelectItem key={sem.matricule} value={sem.matricule}>
                      {sem.nom} {sem.prenom} ({sem.matricule})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Matière */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Matière *</label>
              <Select 
                value={createData.matiere_code} 
                onValueChange={(value) => setCreateData(prev => ({ ...prev, matiere_code: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez une matière" />
                </SelectTrigger>
                <SelectContent>
                  {availableMatieres.map((mat) => (
                    <SelectItem key={mat.code} value={mat.code}>
                      {mat.nom} (Coeff: {mat.coefficient})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Type évaluation + Note */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Type d'évaluation *</label>
                <Select 
                  value={createData.type} 
                  onValueChange={(value) => setCreateData(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Devoir">Devoir</SelectItem>
                    <SelectItem value="Composition">Composition</SelectItem>
                    <SelectItem value="Interrogation">Interrogation</SelectItem>
                    <SelectItem value="Examen">Examen</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Note *</label>
                <Input
                  type="number"
                  min={0}
                  max={20}
                  step={0.5}
                  required
                  value={createData.note}
                  onChange={(e) => setCreateData(prev => ({ 
                    ...prev, 
                    note: parseFloat(e.target.value) || 0 
                  }))}
                  placeholder="15.5"
                />
              </div>
            </div>

            {/* Observation */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Observation</label>
              <Input
                value={createData.observation}
                onChange={(e) => setCreateData(prev => ({ ...prev, observation: e.target.value }))}
                placeholder="Bonne prestation, à encourager..."
              />
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={closeAddNoteModal}
                disabled={creating}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={creating || !createData.matricule || !createData.matiere_code}
                className="bg-primary hover:bg-primary/90"
              >
                {creating ? "Ajout..." : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Ajouter la Note
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ✅ MODAL MODIFICATION NOTE */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Modifier Note - {editingNote?.matricule}
            </DialogTitle>
            <DialogDescription>
              Modifiez la note et l'observation pour{" "}
              <span className="font-semibold">
                {editingNote?.nom_seminariste} {editingNote?.prenom_seminariste}
              </span>
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateNote} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Note <span className="text-destructive">*</span></label>
              <Input
                type="number"
                min={0}
                max={20}
                step={0.5}
                required
                value={updateData.note}
                onChange={(e) => setUpdateData(prev => ({
                  ...prev,
                  note: parseFloat(e.target.value) || 0
                }))}
                className="w-full"
                placeholder="15.5"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Observation</label>
              <Input
                value={updateData.observation}
                onChange={(e) => setUpdateData(prev => ({
                  ...prev,
                  observation: e.target.value
                }))}
                placeholder="Très bonne performance..."
              />
            </div>

            <div className="text-xs text-muted-foreground">
              Matière: <span className="font-medium">{editingNote?.nom_matiere}</span> | 
              Coeff: <span className="font-medium">{editingNote?.coefficient}</span>
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={closeEditModal}
                disabled={updating}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={updating}
                className="bg-primary hover:bg-primary/90"
              >
                {updating ? "Mise à jour..." : (
                  <>
                    <Edit className="mr-2 h-4 w-4" />
                    Enregistrer
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
