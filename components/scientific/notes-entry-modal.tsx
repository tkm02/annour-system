"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { scientificApi, Seminariste, CreateNote } from "@/lib/api";
import { Loader2, Save, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface NotesEntryModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentNoteColumns: number;
}

interface SeminaristeForNotes extends Seminariste {
  noteValues: { [key: string]: number | null };
}

export default function NotesEntryModal({
  open,
  onClose,
  onSuccess,
  currentNoteColumns,
}: NotesEntryModalProps) {
  const [step, setStep] = useState<"level" | "notes">("level");
  const [selectedNiveau, setSelectedNiveau] = useState("");
  const [availableLevels, setAvailableLevels] = useState<string[]>([]);
  const [seminaristes, setSeminaristes] = useState<SeminaristeForNotes[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      fetchLevels();
      setStep("level");
      setSelectedNiveau("");
      setSeminaristes([]);
    }
  }, [open]);

  const fetchLevels = async () => {
    try {
      const response = await scientificApi.getSeminaristes(1, 10000);
      const levels: string[] = [];
      response.data.forEach((s: Seminariste) => {
        if (s.niveau && !levels.includes(s.niveau)) {
          levels.push(s.niveau);
        }
      });
      setAvailableLevels(levels.sort());
    } catch (error) {
      console.error("Erreur chargement niveaux:", error);
    }
  };

  const handleLevelConfirm = async () => {
    if (!selectedNiveau) {
      toast.error("Veuillez sélectionner un niveau");
      return;
    }

    try {
      setLoading(true);
      const response = await scientificApi.getSeminaristes(1, 10000);
      
      const filtered = response.data.filter(
        (s: Seminariste) => s.niveau === selectedNiveau
      );

      const allNotes = await scientificApi.getNotes();
      const notesByMatricule: Record<string, Record<string, number>> = {};
      
      allNotes.forEach((n: any) => {
        if (!notesByMatricule[n.matricule]) {
          notesByMatricule[n.matricule] = {};
        }
        notesByMatricule[n.matricule][n.libelle] = n.note;
      });

      const semWithNotes: SeminaristeForNotes[] = filtered.map((sem: Seminariste) => ({
        ...sem,
        noteValues: {
          note1: notesByMatricule[sem.matricule]?.note1 ?? null,
          note2: notesByMatricule[sem.matricule]?.note2 ?? null,
          note3: notesByMatricule[sem.matricule]?.note3 ?? null,
          note4: notesByMatricule[sem.matricule]?.note4 ?? null,
        },
      }));

      setSeminaristes(semWithNotes);
      setStep("notes");
    } catch (error: any) {
      console.error("Erreur chargement séminaristes:", error);
      toast.error(error.message || "Erreur chargement");
    } finally {
      setLoading(false);
    }
  };

  const handleNoteChange = (matricule: string, libelle: string, value: string) => {
    const numValue = value === "" ? null : parseFloat(value);
    setSeminaristes((prev) =>
      prev.map((sem) =>
        sem.matricule === matricule
          ? { ...sem, noteValues: { ...sem.noteValues, [libelle]: numValue } }
          : sem
      )
    );
  };

  const handleSaveNotes = async () => {
    try {
      setSaving(true);
      let savedCount = 0;

      for (const sem of seminaristes) {
        for (let i = 1; i <= currentNoteColumns; i++) {
          const libelle = `note${i}`;
          const noteValue = sem.noteValues[libelle];
          
          if (noteValue !== null && noteValue !== undefined) {
            const noteData: CreateNote = {
              matricule: sem.matricule,
              note: noteValue,
              type_evaluation: "EVALUATION",
              libelle: libelle,
              observation: "",
            };
            
            try {
              await scientificApi.createNote(noteData);
              savedCount++;
            } catch (err) {
              // Note might already exist, continue
            }
          }
        }
      }

      toast.success(`✅ ${savedCount} notes enregistrées`);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Erreur sauvegarde:", error);
      toast.error(error.message || "Erreur sauvegarde notes");
    } finally {
      setSaving(false);
    }
  };

  const renderNoteInputs = (sem: SeminaristeForNotes) => {
    const inputs = [];
    for (let i = 1; i <= currentNoteColumns; i++) {
      const libelle = `note${i}`;
      inputs.push(
        <TableCell key={libelle}>
          <Input
            type="number"
            min={0}
            max={20}
            step={0.5}
            value={sem.noteValues[libelle] ?? ""}
            onChange={(e) => handleNoteChange(sem.matricule, libelle, e.target.value)}
            className="w-16 text-center"
            placeholder="—"
          />
        </TableCell>
      );
    }
    return inputs;
  };

  const renderNoteHeaders = () => {
    const headers = [];
    for (let i = 1; i <= currentNoteColumns; i++) {
      headers.push(
        <TableHead key={`header-${i}`} className="text-center w-20">
          NOTE {i}
        </TableHead>
      );
    }
    return headers;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === "level" ? "Sélectionner le niveau (test d'entrée)" : `Saisie des notes - ${selectedNiveau}`}
          </DialogTitle>
          <DialogDescription>
            {step === "level"
              ? "Choisissez le niveau attribué après le test d'entrée pour les séminaristes"
              : `Entrez les notes pour chaque séminariste (colonnes NOTE 1 à NOTE ${currentNoteColumns})`}
          </DialogDescription>
        </DialogHeader>

        {step === "level" ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Niveau (attribué après test d&apos;entrée) *</label>
              <Select value={selectedNiveau} onValueChange={setSelectedNiveau}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un niveau" />
                </SelectTrigger>
                <SelectContent>
                  {availableLevels.length === 0 ? (
                    <SelectItem value="none" disabled>Aucun niveau disponible</SelectItem>
                  ) : (
                    availableLevels.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {availableLevels.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Aucun séminariste n&apos;a encore de niveau attribué. Veuillez d&apos;abord effectuer les tests d&apos;entrée.
                </p>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Annuler
              </Button>
              <Button
                onClick={handleLevelConfirm}
                disabled={!selectedNiveau || loading}
                className="bg-primary hover:bg-primary/90"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Chargement...
                  </>
                ) : (
                  "Continuer"
                )}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge variant="outline">
                {seminaristes.length} séminariste(s) trouvé(s)
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep("level")}
              >
                ← Changer de niveau
              </Button>
            </div>

            {seminaristes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Aucun séminariste trouvé pour ce niveau
              </div>
            ) : (
              <div className="overflow-x-auto border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">N°</TableHead>
                      <TableHead>MATRICULE</TableHead>
                      <TableHead>NOM & PRÉNOM</TableHead>
                      <TableHead className="w-16">GENRE</TableHead>
                      {renderNoteHeaders()}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {seminaristes.map((sem, index) => (
                      <TableRow key={sem.matricule}>
                        <TableCell className="font-mono text-muted-foreground">
                          {index + 1}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {sem.matricule}
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold">{sem.nom}</div>
                          <div className="text-sm text-muted-foreground">
                            {sem.prenom}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={sem.sexe === "M" ? "default" : "secondary"}>
                            {sem.sexe}
                          </Badge>
                        </TableCell>
                        {renderNoteInputs(sem)}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            <DialogFooter className="gap-2 pt-4 border-t">
              <Button variant="outline" onClick={onClose} disabled={saving}>
                <X className="mr-2 h-4 w-4" />
                Annuler
              </Button>
              <Button
                onClick={handleSaveNotes}
                disabled={saving || seminaristes.length === 0}
                className="bg-primary hover:bg-primary/90"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Enregistrer les notes
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
