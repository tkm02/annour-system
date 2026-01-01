"use client";

import DashboardLayout from "@/components/layout/dashboard-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
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
import { Feedback, FeedbackAnalytics, feedbackApi } from "@/lib/api";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
    Eye,
    Loader2,
    MessageSquare,
    Star,
    ThumbsUp,
    Trash2,
    Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function FeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [analytics, setAnalytics] = useState<FeedbackAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingList, setLoadingList] = useState(false);
  
  // Filters
  const [filterSexe, setFilterSexe] = useState<string>("all");
  const [filterRecommande, setFilterRecommande] = useState<string>("all");
  
  // Pagination
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 50;

  // Selection for details
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Initial Data Load
  useEffect(() => {
    fetchInitialData();
  }, []);

  // Fetch list when filters or page change
  useEffect(() => {
    fetchFeedbacks();
  }, [page, filterSexe, filterRecommande]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [analyticsData, feedbackData] = await Promise.all([
        feedbackApi.getAnalytics(),
        fetchFeedbacks(true), // Direct fetch for first load
      ]);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Impossible de charger les données");
    } finally {
      setLoading(false);
    }
  };

  const fetchFeedbacks = async (isInitial = false) => {
    if (!isInitial) setLoadingList(true);
    try {
      const filters: any = {};
      if (filterSexe !== "all") filters.sexe = filterSexe;
      if (filterRecommande !== "all")
        filters.recommande = filterRecommande === "true";

      const res = await feedbackApi.getAll(page, LIMIT, filters);
      setFeedbacks(res.data);
      setTotal(res.total);
      return res;
    } catch (error) {
      console.error("Error fetching feedbacks:", error);
      if (!isInitial) toast.error("Erreur lors du chargement des avis");
    } finally {
      if (!isInitial) setLoadingList(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet avis ?")) return;

    try {
      await feedbackApi.delete(id);
      toast.success("Avis supprimé avec succès");
      
      // Refresh list and analytics
      fetchFeedbacks();
      const newAnalytics = await feedbackApi.getAnalytics();
      setAnalytics(newAnalytics);
    } catch (error) {
      console.error("Error deleting feedback:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const openDetails = (feedback: Feedback) => {
    setSelectedFeedback(feedback);
    setIsDetailOpen(true);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex h-[80vh] items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Avis & Feedbacks</h1>
          <p className="text-muted-foreground">
            Consultez les retours des séminaristes
          </p>
        </div>

        {/* Analytics Cards */}
        {analytics && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Avis
                </CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics.total_responses}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Note Globale
                </CardTitle>
                <Star className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics.moyenne_globale.toFixed(1)}/5
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Recommandation
                </CardTitle>
                <ThumbsUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics.pourcentage_recommande.toFixed(0)}%
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Participation F
                </CardTitle>
                <Users className="h-4 w-4 text-pink-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics.repartition_sexe.F || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                   sur {analytics.total_responses} total
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters & Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-card p-4 rounded-lg border">
          <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-center">
            <Select value={filterSexe} onValueChange={setFilterSexe}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sexe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les sexes</SelectItem>
                <SelectItem value="M">Masculin</SelectItem>
                <SelectItem value="F">Féminin</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filterRecommande}
              onValueChange={setFilterRecommande}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Recommandation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tout</SelectItem>
                <SelectItem value="true">Recommande</SelectItem>
                <SelectItem value="false">Ne recommande pas</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="text-sm text-muted-foreground">
            {total} résultat(s)
          </div>
        </div>

        {/* Table */}
        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Sexe</TableHead>
                <TableHead className="text-center">Note</TableHead>
                <TableHead className="text-center">Org.</TableHead>
                <TableHead className="text-center">Kiam</TableHead>
                <TableHead className="text-center">Dortoir</TableHead>
                <TableHead className="text-center">Repas</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingList ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : feedbacks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    Aucun avis trouvé
                  </TableCell>
                </TableRow>
              ) : (
                feedbacks.map((f) => (
                  <TableRow
                    key={f.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => openDetails(f)}
                  >
                    <TableCell className="font-medium whitespace-nowrap">
                      {format(new Date(f.created_at), "dd MMM HH:mm", {
                        locale: fr,
                      })}
                    </TableCell>
                    <TableCell>{f.nom || "Anonyme"}</TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={
                          f.sexe === "M"
                            ? "bg-blue-100 text-blue-700 hover:bg-blue-100"
                            : "bg-pink-100 text-pink-700 hover:bg-pink-100"
                        }
                      >
                        {f.sexe}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center font-bold">
                      {f.note_globale}
                    </TableCell>
                    <TableCell className="text-center">
                      <NoteBadge note={f.note_organisation} />
                    </TableCell>
                    <TableCell className="text-center">
                      <NoteBadge note={f.qualite_formations} />
                    </TableCell>
                    <TableCell className="text-center">
                      <NoteBadge note={f.confort_dortoirs} />
                    </TableCell>
                    <TableCell className="text-center">
                      <NoteBadge note={f.qualite_nourriture} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            openDetails(f);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={(e) => handleDelete(f.id, e)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Controls could go here if needed */}
      </div>

      {/* Details Modal */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails de l'avis</DialogTitle>
          </DialogHeader>
          {selectedFeedback && (
            <div className="grid gap-6 py-4">
              {/* Header Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="font-semibold text-muted-foreground">Nom</label>
                  <p className="text-lg">{selectedFeedback.nom || "Anonyme"}</p>
                </div>
                <div>
                  <label className="font-semibold text-muted-foreground">Date</label>
                  <p>
                    {format(
                      new Date(selectedFeedback.created_at),
                      "dd MMMM yyyy à HH:mm",
                      { locale: fr }
                    )}
                  </p>
                </div>
                <div>
                  <label className="font-semibold text-muted-foreground">Sexe</label>
                  <p>{selectedFeedback.sexe === "M" ? "Masculin" : "Féminin"}</p>
                </div>
                <div>
                  <label className="font-semibold text-muted-foreground">
                    Recommande
                  </label>
                  <p>
                    {selectedFeedback.recommande ? (
                      <span className="flex items-center gap-1 text-green-600 font-medium">
                        <ThumbsUp className="h-4 w-4" /> Oui
                      </span>
                    ) : (
                      <span className="text-red-500 font-medium">Non</span>
                    )}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Notes Détaillées</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <NoteItem
                    label="Globale"
                    value={selectedFeedback.note_globale}
                    isMain
                  />
                  <NoteItem
                    label="Organisation"
                    value={selectedFeedback.note_organisation}
                  />
                  <NoteItem
                    label="Contenu / Kiam"
                    value={selectedFeedback.qualite_contenu}
                  />
                  <NoteItem
                    label="Formations"
                    value={selectedFeedback.qualite_formations}
                  />
                  <NoteItem
                    label="Dortoirs"
                    value={selectedFeedback.confort_dortoirs}
                  />
                  <NoteItem
                    label="Nourriture"
                    value={selectedFeedback.qualite_nourriture}
                  />
                </div>
              </div>

              <div className="border-t pt-4 space-y-4">
                <div>
                  <h3 className="font-semibold mb-1">Points Appréciés</h3>
                  <p className="bg-muted p-3 rounded-md text-sm whitespace-pre-wrap">
                    {selectedFeedback.points_apprecies || "Aucun commentaire"}
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Suggestions</h3>
                  <p className="bg-muted p-3 rounded-md text-sm whitespace-pre-wrap">
                    {selectedFeedback.suggestions || "Aucune suggestion"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

function NoteBadge({ note }: { note: number }) {
  let color = "bg-gray-100 text-gray-800";
  if (note >= 4) color = "bg-green-100 text-green-800";
  else if (note >= 3) color = "bg-yellow-100 text-yellow-800";
  else if (note > 0) color = "bg-red-100 text-red-800";

  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${color}`}>
      {note}/5
    </span>
  );
}

function NoteItem({
  label,
  value,
  isMain = false,
}: {
  label: string;
  value: number;
  isMain?: boolean;
}) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`font-bold ${isMain ? "text-xl" : "text-base"}`}>
        {value}/5
      </span>
    </div>
  );
}
