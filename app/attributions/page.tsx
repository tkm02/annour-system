"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, RefreshCw, GraduationCap, Edit3, Scale } from "lucide-react";
import { scientificApi, TestScore } from "@/lib/api";
import { toast } from "sonner";

interface Seminariste {
  id: string;
  matricule: string;
  nom: string;
  prenom: string;
  sexe: string;
  niveau_academique: string | null;
  niveau: string | null;
  age: number;
  dortoir: string;
  note_entree: number | null;
}

export default function TestEntreePage() {
  const [responseData, setResponseData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedNiveau, setSelectedNiveau] = useState("all");

  // Inline editing
  const [editingMatricule, setEditingMatricule] = useState<string | null>(null);
  const [tempNote, setTempNote] = useState<number>(0);
  const [savingMatricule, setSavingMatricule] = useState<string | null>(null);

  // ✅ ÉQUILIBRAGE A/B UNIQUEMENT Secondaire/Primaire
  const [groupCounts, setGroupCounts] = useState({
    'Secondaire A - Rabioul Awal': 0,
    'Secondaire B - Rabioul Thani': 0,
    'Primaire A - Mouharram': 0,
    'Primaire B - Sofar': 0
  });

  const fetchSeminaristes = async () => {
    try {
      setLoading(true);
      const data = await scientificApi.getSeminaristes(1, 100);
      setResponseData(data);
      
      // ✅ Calculer répartition A/B pour Secondaire/Primaire seulement
      const counts = {
        'Secondaire A - Rabioul Awal': 0,
        'Secondaire B - Rabioul Thani': 0,
        'Primaire A - Mouharram': 0,
        'Primaire B - Sofar': 0
      };
      
      data.data?.forEach((sem: Seminariste) => {
        if (sem.niveau) {
          const niveauKeys = Object.keys(counts);
          if (niveauKeys.includes(sem.niveau)) {
            counts[sem.niveau as keyof typeof counts]++;
          }
        }
      });
      
      setGroupCounts(counts);
    } catch (error: any) {
      toast.error(error.message || "Erreur chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeminaristes();
  }, []);

  const seminaristes: Seminariste[] = responseData?.data || [];

  const filteredSeminaristes = seminaristes.filter((sem) => {
    const fullName = `${sem.nom} ${sem.prenom || ''}`.toLowerCase();
    const matchesSearch = 
      !searchTerm || 
      fullName.includes(searchTerm.toLowerCase()) ||
      sem.matricule.toLowerCase().includes(searchTerm.toLowerCase());

    const niveauValue = selectedNiveau === "none" ? "" : selectedNiveau;
    const matchesNiveau = selectedNiveau === "all" || sem.niveau === niveauValue;

    return matchesSearch && matchesNiveau;
  });


  // ✅ ÉQUILIBRAGE UNIQUEMENT Secondaire/Primaire
  const getBalancedNiveau = (note: number): string => {
    if (note >= 16) return "Universitaire - Djoumada Thaniya";
    if (note >= 12) return "Supérieur - Djoumada Oula";
    
    // ✅ Secondaire - ÉQUILIBRAGE A/B
    if (note >= 7) {
      return groupCounts['Secondaire A - Rabioul Awal'] <= groupCounts['Secondaire B - Rabioul Thani']
        ? "Secondaire A - Rabioul Awal"
        : "Secondaire B - Rabioul Thani";
    }
    
    // ✅ Primaire - ÉQUILIBRAGE A/B
    return groupCounts['Primaire A - Mouharram'] <= groupCounts['Primaire B - Sofar']
      ? "Primaire A - Mouharram"
      : "Primaire B - Sofar";
  };

  const getNiveauColor = (note: number) => {
    if (note >= 16) return "text-emerald-600 bg-emerald-50";
    if (note >= 12) return "text-indigo-600 bg-indigo-50";
    if (note >= 7) return "text-blue-600 bg-blue-50";
    return "text-orange-600 bg-orange-50";
  };

  const handleEditNote = (sem: Seminariste) => {
    setEditingMatricule(sem.matricule);
    setTempNote(0);
  };

  const handleSaveNote = async (sem: Seminariste) => {
  if (tempNote === 0) {
    toast.warning("⚠️ Entrez une note entre 0 et 20");
    return;
  }

  try {
    setSavingMatricule(sem.matricule);
    
    const nouveauNiveau = getBalancedNiveau(tempNote);
    
    // ✅ FORMAT QUERY PARAMS
    const testData: TestScore = {
      matricule: sem.matricule,
      note: tempNote,
      niveau: nouveauNiveau,
      created_by: 'admin'
    };
    
    console.log('📤 Envoi test entrée:', testData);
    
    await scientificApi.saveTestEntree(testData);
    
    toast.success(`✅ ${nouveauNiveau} • Note: ${tempNote}/20`);
    
    // ✅ Rafraîchir liste
    scientificApi.invalidateCache();
    await fetchSeminaristes();
    
  } catch (error: any) {
    console.error('❌ Erreur test entrée:', error);
    toast.error(error.message || "Erreur sauvegarde test");
  } finally {
    setSavingMatricule(null);
    setEditingMatricule(null);
    setTempNote(0);
  }
};
  const getNiveauVariant = (niveau: string | null) => {
    if (niveau?.includes('Universitaire')) return "default";
    if (niveau?.includes('Supérieur')) return "secondary";
    if (niveau?.includes('Secondaire')) return "outline";
    if (niveau?.includes('Primaire')) return "outline";
    return "destructive";
  };

  const stats = {
    total: seminaristes.length,
    classed: seminaristes.filter(s => s?.niveau).length,
    toTest: seminaristes.filter(s => !s?.niveau).length,
  };

  console.log('📊 Stats test entrée:', filteredSeminaristes);


  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6 p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-64"></div>
            <div className="h-96 bg-muted rounded"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">TEST D'ENTRÉE</h1>
            <p className="text-muted-foreground">
              {stats.toTest} à classer • Équilibrage A/B Secondaire/Primaire
            </p>
          </div>
        </div>

        {/* ✅ Stats Équilibrage Secondaire/Primaire */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-2 font-semibold">
              <Scale className="h-4 w-4" />
              Équilibrage Secondaire/Primaire
            </div>
            <div>Secondaire A: {groupCounts['Secondaire A - Rabioul Awal']}</div>
            <div>Secondaire B: {groupCounts['Secondaire B - Rabioul Thani']}</div>
            <div className="pt-2 border-t">
              Primaire A: {groupCounts['Primaire A - Mouharram']}
            </div>
            <div>Primaire B: {groupCounts['Primaire B - Sofar']}</div>
          </div>
          
          <div className="text-sm text-right">
            <div><strong>Seuils notes:</strong></div>
            <div>16-20 → Universitaire</div>
            <div>12-15 → Supérieur</div>
            <div>07-11 → Secondaire A/B</div>
            <div>00-06 → Primaire A/B</div>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-md border bg-card">
          <div className="p-6 border-b flex flex-col lg:flex-row gap-4 items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher nom, matricule..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Select value={selectedNiveau} onValueChange={setSelectedNiveau}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Niveau test" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous niveaux</SelectItem>
                  <SelectItem value="Universitaire - Djoumada Thaniya">Universitaire</SelectItem>
                  <SelectItem value="Supérieur - Djoumada Oula">Supérieur</SelectItem>
                  <SelectItem value="Secondaire A - Rabioul Awal">Secondaire A</SelectItem>
                  <SelectItem value="Secondaire B - Rabioul Thani">Secondaire B</SelectItem>
                  <SelectItem value="Primaire A - Mouharram">Primaire A</SelectItem>
                  <SelectItem value="Primaire B - Sofar">Primaire B</SelectItem>
                  <SelectItem value="none">Non classé</SelectItem>
                </SelectContent>
              </Select>
              
              <Button 
                onClick={fetchSeminaristes}
                disabled={loading}
                variant="outline"
                size="sm"
                className="h-10 gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Actualiser
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-accent/50">
                  <TableHead className="w-[120px]">MATRICULE</TableHead>
                  <TableHead>NOM</TableHead>
                  <TableHead className="w-[70px]">SEXE</TableHead>
                  <TableHead className="w-[60px]">ÂGE</TableHead>
                  <TableHead className="w-[160px]">NIVEAU</TableHead>
                  <TableHead className="w-[90px]">NOTE</TableHead>
                  <TableHead className="w-[120px]">ACTION</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSeminaristes.map((sem) => (
                  <TableRow key={sem.id} className="hover:bg-accent/30 border-b border-border/20">
                    <TableCell className="font-medium">{sem.matricule}</TableCell>
                    <TableCell>
                      <div className="font-semibold">{sem.nom}</div>
                      <div className="text-sm text-muted-foreground">{sem.prenom}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={sem.sexe === "M" ? "default" : "secondary"}>
                        {sem.sexe}
                      </Badge>
                    </TableCell>
                    <TableCell>{sem.age}</TableCell>
                    
                    <TableCell>
                      {sem.niveau ? (
                        <Badge variant={getNiveauVariant(sem.niveau)} className="font-semibold px-2 py-1">
                          {sem.niveau}
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="font-semibold">
                          Non classé
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell>
                      {editingMatricule === sem.matricule ? (
                        <div className={`px-2 py-1 rounded border ${getNiveauColor(tempNote)}`}>
                          <Input
                            type="number"
                            min="0"
                            max="20"
                            step="0.25"
                            value={tempNote || ''}
                            onChange={(e) => setTempNote(parseFloat(e.target.value) || 0)}
                            className="w-16 h-8 text-base font-bold text-center bg-transparent border-0 p-0"
                            autoFocus
                          />
                          <div className="text-xs mt-1 font-medium">
                            {getBalancedNiveau(tempNote)}
                          </div>
                        </div>
                      ) : (
                        <div className="px-2 py-1 font-mono font-semibold text-sm bg-muted/50 rounded">
                          {sem.niveau ? sem.note_entree : '—'}
                        </div>
                      )}
                    </TableCell>

                    <TableCell>
                      {editingMatricule === sem.matricule ? (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            onClick={() => handleSaveNote(sem)}
                            disabled={savingMatricule === sem.matricule || tempNote === 0}
                            className="h-9 px-2"
                          >
                            {savingMatricule === sem.matricule ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <GraduationCap className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingMatricule(null);
                              setTempNote(0);
                            }}
                            className="h-9 w-9 p-0"
                          >
                            ✕
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant={sem.niveau ? "outline" : "default"}
                          size="sm"
                          onClick={() => handleEditNote(sem)}
                          disabled={!!sem.niveau}
                          className="h-9 px-3 w-full"
                        >
                          {sem.niveau ? "✓ Classé" : "Saisir"}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredSeminaristes.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      <div className="text-muted-foreground text-sm">
                        Aucun séminariste trouvé
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Légende */}
          <div className="p-4 bg-muted/30 border-t text-xs text-center">
            <div className="font-semibold mb-1">Équilibrage automatique A/B</div>
            <div>16-20: Universitaire | 12-15: Supérieur</div>
            <div>07-11: Secondaire A/B | 00-06: Primaire A/B</div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
