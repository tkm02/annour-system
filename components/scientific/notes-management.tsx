"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { scientificApi, Seminariste } from "@/lib/api";
import { Download, Loader2, Plus, RefreshCw, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import LevelSelectionModal from "./level-selection-modal";

interface SeminaristeWithNotes extends Seminariste {
  notes?: Array<{
    id: string;
    matiere: string;
    note: number;
    type_evaluation: string;
  }>;
}

export default function NotesManagement() {
  // ✅ ÉTATS
  const [seminaristes, setSeminaristes] = useState<SeminaristeWithNotes[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("tous");
  const [selectedDortoir, setSelectedDortoir] = useState("tous");
  const [selectedNiveau, setSelectedNiveau] = useState("tous");
  const [showLevelModal, setShowLevelModal] = useState(false);

  // ✅ FILTRES DYNAMIQUES
  const dynamicFilters = {
    niveaux: Array.from(new Set(seminaristes.map(s => s.niveau).filter(Boolean))),
    dortoirs: Array.from(new Set(seminaristes.map(s => s.dortoir).filter(Boolean))),
  };

  // ✅ FETCH SÉMINARISTES
  const fetchSeminaristes = async () => {
    try {
      setLoading(true);
      console.log("🔄 Fetch séminaristes avec notes...");
      
      const response = await scientificApi.getSeminaristes(1, 10000);
      
      // TODO: Récupérer les notes pour chaque séminariste
      // const notesResponse = await scientificApi.getNotes();
      
      setSeminaristes(response.data);
      console.log(`✅ ${response.total} séminaristes chargés`);
    } catch (error: any) {
      console.error("❌ Erreur fetch:", error);
      toast.error(error.message || "Erreur chargement séminaristes");
    } finally {
      setLoading(false);
    }
  };

  // ✅ FETCH INITIAL
  useEffect(() => {
    fetchSeminaristes();
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
    fetchSeminaristes();
    toast.success("🔄 Liste actualisée");
  };

  // ✅ EXPORTER
  const handleExport = () => {
    toast.info("📥 Export en développement...");
    // TODO: Implémenter export CSV/Excel
  };

  // ✅ HANDLE ADD NOTES
  const handleAddNotes = async (noteData: any) => {
    try {
      console.log("➕ Ajout notes:", noteData);
      // await scientificApi.createNote(noteData);
      toast.success("✅ Notes ajoutées avec succès");
      await fetchSeminaristes();
    } catch (error: any) {
      console.error("❌ Erreur ajout notes:", error);
      toast.error(error.message || "Erreur ajout notes");
    }
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
              {/* Genre */}
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

              {/* Dortoir */}
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

              {/* Niveau */}
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
                AVEC NOTES {seminaristes.filter(s => s.notes?.length).length.toString().padStart(3, "0")}
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
              <Button
                size="sm"
                className="gap-2 bg-primary hover:bg-primary/90 h-9"
                onClick={() => setShowLevelModal(true)}
              >
                <Plus className="h-4 w-4" />
                AJOUTER NOTES
              </Button>
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
                  <TableHead className="w-[80px] text-center">NOTE 1</TableHead>
                  <TableHead className="w-[80px] text-center">NOTE 2</TableHead>
                  <TableHead className="w-[80px] text-center">NOTE 3</TableHead>
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
                    <TableCell className="text-center font-bold font-mono">
                      {seminarist.notes?.[0]?.note?.toString().padStart(2, "0") || "—"}
                    </TableCell>
                    <TableCell className="text-center font-bold font-mono">
                      {seminarist.notes?.[1]?.note?.toString().padStart(2, "0") || "—"}
                    </TableCell>
                    <TableCell className="text-center font-bold font-mono">
                      {seminarist.notes?.[2]?.note?.toString().padStart(2, "0") || "—"}
                    </TableCell>
                  </TableRow>
                ))}
                
                {filteredSeminaristes.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
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

      {/* ✅ MODAL AJOUT NOTES */}
      {showLevelModal && (
        <LevelSelectionModal
          onClose={() => setShowLevelModal(false)}
          onSelectLevel={(noteData) => {
            setShowLevelModal(false);
            handleAddNotes(noteData);
          }}
        />
      )}
    </>
  );
}
