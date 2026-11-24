"use client";

import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { Edit, Loader2, RefreshCw, Search } from "lucide-react";
import { toast } from "sonner";

import Pager from "@/components/common/pager";
import { EmptyState, ErrorState, LoadingState, errorText } from "@/components/common/states";
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
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { scientificApi, type Note, type UpdateNote } from "@/lib/api";
import { formatDate } from "@/lib/format";

const PAGE_SIZE = 20;

/** « note1 » → « Évaluation 1 » ; type et libellé peuvent être vides. */
const libelleLabel = (libelle: string | null) => {
  if (!libelle) return "—";
  const match = /^note(\d+)$/i.exec(libelle);
  return match ? `Évaluation ${match[1]}` : libelle;
};

/**
 * F-A5 : notes réelles de GET /scientific/notes (type Note de lib/api.ts).
 * Pas de matière ni de coefficient (décision : ces champs n'existent pas).
 */
export default function NotesTable() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLibelle, setSelectedLibelle] = useState("toutes");
  const [page, setPage] = useState(1);

  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [updateData, setUpdateData] = useState<UpdateNote>({ note: 0, observation: "" });
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      setError(null);
      setNotes(await scientificApi.getNotes());
    } catch (err) {
      setError(errorText(err, "Chargement des notes impossible"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const libelles = useMemo(
    () => Array.from(new Set(notes.map((n) => n.libelle).filter((l): l is string => !!l))).sort(),
    [notes]
  );

  const filteredNotes = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return notes.filter((note) => {
      const fullName = `${note.nom_seminariste ?? ""} ${note.prenom_seminariste ?? ""}`.toLowerCase();
      const matchesSearch = !term || fullName.includes(term) || note.matricule.toLowerCase().includes(term);
      const matchesLibelle = selectedLibelle === "toutes" || note.libelle === selectedLibelle;
      return matchesSearch && matchesLibelle;
    });
  }, [notes, searchTerm, selectedLibelle]);

  const pageNotes = filteredNotes.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openEditModal = (note: Note) => {
    setEditingNote(note);
    setUpdateData({ note: note.note, observation: note.observation ?? "" });
    setUpdateError(null);
  };

  const handleUpdateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNote) return;
    if (!Number.isFinite(updateData.note) || updateData.note < 0 || updateData.note > 20) {
      setUpdateError("La note doit être comprise entre 0 et 20");
      return;
    }
    try {
      setUpdating(true);
      await scientificApi.updateNote(editingNote.id, updateData);
      toast.success("Note mise à jour. Pensez à recalculer l'année dans Bulletins si des bulletins existent.");
      await fetchNotes();
      setEditingNote(null);
    } catch (err) {
      setUpdateError(errorText(err, "Mise à jour impossible"));
    } finally {
      setUpdating(false);
    }
  };

  return (
    <>
      <Card className="border-border">
        <CardHeader className="space-y-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <Input
                placeholder="Rechercher par nom ou matricule…"
                aria-label="Rechercher une note"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                className="pl-10"
              />
            </div>
            <Select value={selectedLibelle} onValueChange={(v) => { setSelectedLibelle(v); setPage(1); }}>
              <SelectTrigger className="lg:w-48" aria-label="Filtrer par évaluation">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="toutes">Toutes les évaluations</SelectItem>
                {libelles.map((l) => <SelectItem key={l} value={l}>{libelleLabel(l)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:justify-between sm:items-center">
            <div className="flex gap-2">
              <Badge variant="outline">Total {notes.length}</Badge>
              <Badge variant="outline">Filtrées {filteredNotes.length}</Badge>
            </div>
            <Button variant="ghost" size="sm" onClick={fetchNotes} className="gap-2 h-9" disabled={loading}>
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Actualiser
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {loading && notes.length === 0 ? (
            <LoadingState label="Chargement des notes…" />
          ) : error ? (
            <ErrorState message={error} onRetry={fetchNotes} />
          ) : filteredNotes.length === 0 ? (
            <EmptyState message="Aucune note trouvée." />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Matricule</TableHead>
                    <TableHead>Séminariste</TableHead>
                    <TableHead>Évaluation</TableHead>
                    <TableHead>Note</TableHead>
                    <TableHead className="hidden md:table-cell">Type</TableHead>
                    <TableHead className="hidden md:table-cell">Observation</TableHead>
                    <TableHead className="hidden lg:table-cell">Date</TableHead>
                    <TableHead><span className="sr-only">Actions</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageNotes.map((note) => (
                    <TableRow key={note.id}>
                      <TableCell className="font-mono text-xs">{note.matricule}</TableCell>
                      <TableCell>
                        <div className="font-medium">{note.nom_seminariste ?? "—"}</div>
                        <div className="text-sm text-muted-foreground">{note.prenom_seminariste ?? ""}</div>
                      </TableCell>
                      <TableCell>{libelleLabel(note.libelle)}</TableCell>
                      <TableCell className="font-semibold tabular-nums">{note.note.toFixed(2)}</TableCell>
                      <TableCell className="hidden md:table-cell">{note.type ? <Badge variant="outline">{note.type}</Badge> : "—"}</TableCell>
                      <TableCell className="hidden md:table-cell max-w-xs truncate">{note.observation || "—"}</TableCell>
                      <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">{formatDate(note.created_at)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => openEditModal(note)}
                          aria-label={`Modifier la note de ${note.matricule} (${libelleLabel(note.libelle)})`}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          <Pager page={page} limit={PAGE_SIZE} total={filteredNotes.length} onPageChange={setPage} disabled={loading} />
        </CardContent>
      </Card>

      <Dialog open={!!editingNote} onOpenChange={(open) => !open && !updating && setEditingNote(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier la note — {editingNote?.matricule}</DialogTitle>
            <DialogDescription>
              {editingNote?.nom_seminariste} {editingNote?.prenom_seminariste} · {libelleLabel(editingNote?.libelle ?? null)}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateNote} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="edit-note">Note (0 à 20) *</Label>
              <Input id="edit-note" type="number" min={0} max={20} step={0.25} value={updateData.note}
                onChange={(e) => setUpdateData((prev) => ({ ...prev, note: parseFloat(e.target.value) }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-observation">Observation</Label>
              <Input id="edit-observation" maxLength={500} value={updateData.observation}
                onChange={(e) => setUpdateData((prev) => ({ ...prev, observation: e.target.value }))} />
            </div>
            {updateError && <p className="text-sm text-destructive" role="alert">{updateError}</p>}
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setEditingNote(null)} disabled={updating}>Annuler</Button>
              <Button type="submit" disabled={updating}>
                {updating && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Enregistrer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
