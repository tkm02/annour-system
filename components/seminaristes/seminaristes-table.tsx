"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Edit3,
  Trash2,
  RefreshCw,
  Plus,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  scientificApi,
  StaticMetadata,
  Seminariste,
  CreateSeminariste,
} from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "../../contexts/auth-context";

interface SeminaristesTableProps {
  seminaristes: Seminariste[];
  total: number;
  onRefresh: () => void;
}

export default function SeminaristesTable({
  seminaristes,
  total,
  onRefresh,
}: SeminaristesTableProps) {
  // ✅ ÉTATS FILTRES
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("tous");
  const [selectedDortoir, setSelectedDortoir] = useState("tous");
  const [selectedNiveau, setSelectedNiveau] = useState("tous");

  const {user} = useAuth();
  const isAdmin = user?.role.toUpperCase() === "ADMINISTRATION";

  // ✅ FILTRES DYNAMIQUES
  const dynamicFilters = useMemo(() => {
    const genres = Array.from(new Set(seminaristes.map((s) => s.sexe))).sort();
    const niveaux = Array.from(
      new Set(seminaristes.map((s) => s.niveau_academique))
    )
      .filter(Boolean)
      .sort();
    const dortoirs = Array.from(new Set(seminaristes.map((s) => s.dortoir)))
      .filter(Boolean)
      .sort();

    return { genres, niveaux, dortoirs };
  }, [seminaristes]);

  // ✅ MÉTADONNÉES
  const [metadata, setMetadata] = useState<StaticMetadata | null>(null);
  const [loadingMetadata, setLoadingMetadata] = useState(false);

  // ✅ MODAL FORMULAIRE UNIFIÉ
  const [showFormModal, setShowFormModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingMatricule, setEditingMatricule] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateSeminariste>({
    nom: "",
    prenom: "",
    sexe: "M",
    age: 0,
    commune_habitation: "",
    niveau_academique: "",
    dortoir_code: "",
    contact_parent: "",
    contact_seminariste: "",
    allergie: "RAS",
    antecedent_medical: "Néant",
  });
  const [loading, setLoading] = useState(false);

  // ✅ MODAL SUPPRESSION
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [seminaristeToDelete, setSeminaristeToDelete] =
    useState<Seminariste | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ✅ FETCH METADATA
  useEffect(() => {
    fetchMetadata();
  }, []);

  const fetchMetadata = async () => {
    try {
      setLoadingMetadata(true);
      const data = await scientificApi.getStaticMetadata();
      setMetadata(data);
      console.log("✅ Métadonnées chargées:", data);
    } catch (error) {
      console.error("❌ Erreur métadonnées:", error);
      toast.error("Impossible de charger les options");
    } finally {
      setLoadingMetadata(false);
    }
  };

  // ✅ MAPPING SEMINARISTE → FORM
  const mapSeminaristeToFormData = (
    seminarist: Seminariste
  ): CreateSeminariste => {
    const dortoirCode = metadata?.dortoirs
      ? Object.values(metadata.dortoirs)
          .flat()
          .find((d) =>
            d.name.toLowerCase().includes(seminarist.dortoir.toLowerCase())
          )?.code || ""
      : "";

    return {
      nom: seminarist.nom,
      prenom: seminarist.prenom,
      sexe: seminarist.sexe,
      age: seminarist.age,
      commune_habitation: seminarist.commune_habitation || "",
      niveau_academique: seminarist.niveau_academique,
      dortoir_code: dortoirCode,
      contact_parent: seminarist.contact_parent || "",
      contact_seminariste: seminarist.contact_seminariste || "",
      allergie: seminarist.allergie || "RAS",
      antecedent_medical: seminarist.antecedent_medical || "Néant",
    };
  };

  // ✅ OUVRIR MODAL CRÉATION
  const openCreateModal = () => {
    setIsEditMode(false);
    setEditingMatricule(null);
    setFormData({
      nom: "",
      prenom: "",
      sexe: "M",
      age: 0,
      commune_habitation: "",
      niveau_academique: "",
      dortoir_code: "",
      contact_parent: "",
      contact_seminariste: "",
      allergie: "RAS",
      antecedent_medical: "Néant",
    });
    setShowFormModal(true);
  };

  // ✅ OUVRIR MODAL ÉDITION
  const openEditModal = (seminarist: Seminariste) => {
    if (!metadata) {
      toast.error("Métadonnées non chargées");
      return;
    }
    setIsEditMode(true);
    setEditingMatricule(seminarist.matricule);
    setFormData(mapSeminaristeToFormData(seminarist));
    setShowFormModal(true);
  };

  // ✅ CONFIRMER SUPPRESSION
  const confirmDelete = (seminarist: Seminariste) => {
    setSeminaristeToDelete(seminarist);
    setShowDeleteModal(true);
  };

  // ✅ SUPPRIMER
  const handleDelete = async () => {
    if (!seminaristeToDelete) return;

    try {
      setDeleting(true);
      await scientificApi.deleteSeminariste(seminaristeToDelete.matricule);
      toast.success("✅ Séminariste supprimé");
      scientificApi.invalidateCache();
      onRefresh();
      setShowDeleteModal(false);
      setSeminaristeToDelete(null);
    } catch (error: any) {
      console.error("❌ Erreur suppression:", error);
      toast.error(error.message || "Erreur suppression");
    } finally {
      setDeleting(false);
    }
  };

  // ✅ FILTRER SÉMINARISTES
  const filteredSeminaristes = seminaristes.filter((seminarist) => {
    const fullName = `${seminarist.nom} ${seminarist.prenom}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchTerm.toLowerCase()) ||
      seminarist.matricule.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesGenre =
      selectedGenre === "tous" || seminarist.sexe === selectedGenre;
    const matchesDortoir =
      selectedDortoir === "tous" ||
      seminarist.dortoir.toLowerCase().includes(selectedDortoir.toLowerCase());
    const matchesNiveau =
      selectedNiveau === "tous" ||
      seminarist.niveau_academique === selectedNiveau;

    return matchesSearch && matchesGenre && matchesDortoir && matchesNiveau;
  });

  // ✅ HANDLE INPUT
  const handleInputChange = (field: keyof CreateSeminariste, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: field === "age" ? parseInt(value) || 0 : value,
    }));
  };

  // ✅ SUBMIT UNIFIÉ
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      if (isEditMode && editingMatricule) {
        await scientificApi.updateSeminariste(editingMatricule, formData);
        toast.success("✅ Séminariste modifié");
      } else {
        await scientificApi.createSeminariste(formData);
        toast.success("✅ Séminariste ajouté");
      }

      scientificApi.invalidateCache();
      onRefresh();
      setShowFormModal(false);
    } catch (error: any) {
      console.error("❌ Erreur formulaire:", error);
      toast.error(
        error.message || `Erreur ${isEditMode ? "modification" : "ajout"}`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* ✅ TABLE */}
      <Card className="border-border">
        <CardHeader className="space-y-4">
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

              <Select value={selectedNiveau} onValueChange={setSelectedNiveau}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Niveau" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tous">TOUS</SelectItem>
                  {dynamicFilters.niveaux.map((niveau) => (
                    <SelectItem key={niveau} value={niveau}>
                      {niveau}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={selectedDortoir}
                onValueChange={setSelectedDortoir}
              >
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
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:justify-between sm:items-center">
            <div className="flex gap-2 flex-wrap">
              <Badge variant="outline" className="bg-primary/10">
                TOTAL {total.toString().padStart(3, "0")}
              </Badge>
              <Badge variant="outline" className="bg-secondary/10">
                FILTRES{" "}
                {filteredSeminaristes.length.toString().padStart(3, "0")}
              </Badge>
            </div>

            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onRefresh}
                className="gap-2 h-9"
              >
                <RefreshCw className="h-4 w-4" />
                Actualiser
              </Button>
              {isAdmin && (<Button size="sm" className="gap-2" onClick={openCreateModal}>
                <Plus className="h-4 w-4" />
                Ajouter Séminariste
              </Button>)}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>MATRICULE</TableHead>
                  <TableHead>NOM & PRÉNOM</TableHead>
                  <TableHead>GENRE</TableHead>
                  <TableHead>ÂGE</TableHead>
                  <TableHead>NIVEAU</TableHead>
                  <TableHead>DORTOIR</TableHead>
                  {isAdmin && (<TableHead>ACTIONS</TableHead>)}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSeminaristes.map((seminarist) => (
                  <TableRow key={seminarist.id}>
                    <TableCell className="font-medium">
                      {seminarist.matricule}
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      <div className="font-medium">{seminarist.nom}</div>
                      <div className="text-sm text-muted-foreground">
                        {seminarist.prenom}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          seminarist.sexe === "M" ? "default" : "secondary"
                        }
                      >
                        {seminarist.sexe}
                      </Badge>
                    </TableCell>
                    <TableCell>{seminarist.age}</TableCell>
                    <TableCell>
                      {seminarist.niveau_academique.toUpperCase()}
                    </TableCell>
                    <TableCell className="max-w-[150px] truncate">
                      {seminarist.dortoir.toUpperCase()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {isAdmin && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => openEditModal(seminarist)}
                              title="Modifier"
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-destructive"
                              onClick={() => confirmDelete(seminarist)}
                              title="Supprimer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredSeminaristes.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="h-24 text-center text-muted-foreground"
                    >
                      Aucun séminariste trouvé
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ✅ MODAL FORMULAIRE (même code que votre version) */}
      <Dialog open={showFormModal} onOpenChange={setShowFormModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditMode
                ? "Modifier le Séminariste"
                : "Nouvelle Inscription Séminariste"}
            </DialogTitle>
            <DialogDescription>
              {isEditMode
                ? `Modifiez les informations du séminariste ${editingMatricule}`
                : "Remplissez toutes les informations pour inscrire un nouveau séminariste"}
            </DialogDescription>
          </DialogHeader>

          {loadingMetadata ? (
            <div className="p-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>Chargement des options...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* ✅ LIGNE 1: Nom, Prénom, Genre */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nom *</label>
                  <Input
                    required
                    value={formData.nom}
                    onChange={(e) => handleInputChange("nom", e.target.value)}
                    placeholder="Nom de famille"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Prénom *</label>
                  <Input
                    required
                    value={formData.prenom}
                    onChange={(e) =>
                      handleInputChange("prenom", e.target.value)
                    }
                    placeholder="Prénom(s)"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Genre *</label>
                  <Select
                    value={formData.sexe}
                    onValueChange={(value) => handleInputChange("sexe", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="M">Masculin</SelectItem>
                      <SelectItem value="F">Féminin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* ✅ LIGNE 2: Âge, Niveau Académique, Dortoir */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Âge *</label>
                  <Input
                    required
                    type="number"
                    value={formData.age || ""}
                    onChange={(e) => handleInputChange("age", e.target.value)}
                    min={5}
                    max={35}
                    placeholder="12"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Niveau Académique *
                  </label>
                  <Select
                    value={formData.niveau_academique}
                    onValueChange={(value) =>
                      handleInputChange("niveau_academique", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez" />
                    </SelectTrigger>
                    <SelectContent>
                      {metadata &&
                        Object.entries(metadata.niveaux_academiques).map(
                          ([categorie, niveaux]) => (
                            <div key={categorie}>
                              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase">
                                {categorie}
                              </div>
                              {niveaux.map((niveau) => (
                                <SelectItem key={niveau} value={niveau}>
                                  {niveau}
                                </SelectItem>
                              ))}
                            </div>
                          )
                        )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Dortoir *</label>
                  <Select
                    value={formData.dortoir_code}
                    onValueChange={(value) =>
                      handleInputChange("dortoir_code", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez" />
                    </SelectTrigger>
                    <SelectContent>
                      {metadata?.dortoirs ? (
                        Object.entries(metadata.dortoirs).map(
                          ([categorie, dortoirsList]) => (
                            <div key={categorie}>
                              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                {categorie}
                              </div>
                              {dortoirsList.map((dortoir) => (
                                <SelectItem
                                  key={dortoir.code}
                                  value={dortoir.code}
                                >
                                  {dortoir.name}
                                </SelectItem>
                              ))}
                            </div>
                          )
                        )
                      ) : (
                        <SelectItem value="" disabled>
                          Aucun dortoir disponible
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* ✅ LIGNE 3: Commune Habitation, Contact Parent */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Commune d'habitation *
                  </label>
                  <Select
                    value={formData.commune_habitation}
                    onValueChange={(value) =>
                      handleInputChange("commune_habitation", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez" />
                    </SelectTrigger>
                    <SelectContent>
                      {metadata?.communes?.length ? (
                        metadata.communes.map((commune) => (
                          <SelectItem key={commune} value={commune}>
                            {commune}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="" disabled>
                          Aucune commune disponible
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Contact Parent/Tuteur *
                  </label>
                  <Input
                    required
                    type="tel"
                    value={formData.contact_parent}
                    onChange={(e) =>
                      handleInputChange("contact_parent", e.target.value)
                    }
                    placeholder="01 23 45 67 89"
                  />
                </div>
              </div>

              {/* ✅ LIGNE 4: Contact Séminariste, Allergies */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Contact Séminariste
                  </label>
                  <Input
                    value={formData.contact_seminariste}
                    onChange={(e) =>
                      handleInputChange("contact_seminariste", e.target.value)
                    }
                    placeholder="01 23 45 67 89 (optionnel)"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Allergies</label>
                  <Input
                    value={formData.allergie}
                    onChange={(e) =>
                      handleInputChange("allergie", e.target.value)
                    }
                    placeholder="RAS, Asthme, Diabète..."
                  />
                </div>
              </div>

              {/* ✅ LIGNE 5: Antécédents médicaux */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Antécédents médicaux
                </label>
                <Input
                  value={formData.antecedent_medical}
                  onChange={(e) =>
                    handleInputChange("antecedent_medical", e.target.value)
                  }
                  placeholder="Néant, Opération, Maladie chronique..."
                />
              </div>

              {/* ✅ FOOTER ACTIONS */}
              <DialogFooter className="gap-2 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowFormModal(false)}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-primary hover:bg-primary/90"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isEditMode ? "Modification..." : "Ajout..."}
                    </>
                  ) : (
                    <>
                      {isEditMode ? (
                        <>
                          <Edit3 className="mr-2 h-4 w-4" />
                          Enregistrer les modifications
                        </>
                      ) : (
                        <>
                          <Plus className="mr-2 h-4 w-4" />
                          Inscrire Séminariste
                        </>
                      )}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ✅ MODAL SUPPRESSION */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Confirmer suppression
            </DialogTitle>
            <DialogDescription>
              Supprimer{" "}
              <span className="font-semibold">
                {seminaristeToDelete?.nom} {seminaristeToDelete?.prenom}
              </span>{" "}
              ({seminaristeToDelete?.matricule}) ?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Suppression..." : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
