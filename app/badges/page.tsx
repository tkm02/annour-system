"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Search,
  CreditCard,
  Printer,
  Eye,
  Loader2,
  Users,
  RefreshCw,
  FileText,
  Phone,
  Home,
  AlertCircle,
  Heart,
} from "lucide-react";
import { scientificApi, Seminariste } from "@/lib/api";
import { toast } from "sonner";
import jsPDF from "jspdf";

export default function BadgeGenerationPage() {
  const [seminaristes, setSeminaristes] = useState<Seminariste[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedNiveau, setSelectedNiveau] = useState("tous");
  const [selectedSeminaristes, setSelectedSeminaristes] = useState<string[]>([]);
  const [badgeTemplate, setBadgeTemplate] = useState("standard");
  const [generating, setGenerating] = useState(false);
  const [showVerso, setShowVerso] = useState(false);

  const fetchSeminaristes = async () => {
    try {
      setLoading(true);
      const response = await scientificApi.getSeminaristes(1, 500);
      setSeminaristes(response.data);
    } catch (error: any) {
      toast.error(error.message || "Erreur chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeminaristes();
  }, []);

  const filteredSeminaristes = seminaristes.filter((sem) => {
    const fullName = `${sem.nom} ${sem.prenom || ""}`.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      fullName.includes(searchTerm.toLowerCase()) ||
      sem.matricule.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesNiveau = selectedNiveau === "tous" || sem.niveau === selectedNiveau;
    return matchesSearch && matchesNiveau;
  });

  const handleSelectAll = () => {
    if (selectedSeminaristes.length === filteredSeminaristes.length) {
      setSelectedSeminaristes([]);
    } else {
      setSelectedSeminaristes(filteredSeminaristes.map((s) => s.matricule));
    }
  };

  const handleSelectOne = (matricule: string) => {
    setSelectedSeminaristes((prev) =>
      prev.includes(matricule) ? prev.filter((m) => m !== matricule) : [...prev, matricule]
    );
  };

  // ✅ GÉNÉRATION PDF RECTO-VERSO
  const generatePDF = async () => {
    if (selectedSeminaristes.length === 0) {
      toast.warning("⚠️ Sélectionnez au moins un séminariste");
      return;
    }

    try {
      setGenerating(true);
      toast.info("📄 Génération PDF recto-verso...");

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const badgeWidth = 85;
      const badgeHeight = 130;
      const marginX = (210 - badgeWidth * 2) / 3;
      const marginY = 20;
      const spacing = 15;

      for (let i = 0; i < selectedSeminaristes.length; i++) {
        const seminariste = seminaristes.find((s) => s.matricule === selectedSeminaristes[i]);
        if (!seminariste) continue;

        const positionInPage = i % 2;
        const col = positionInPage % 2;
        const x = marginX + col * (badgeWidth + marginX);
        const y = marginY;

        if (i > 0 && positionInPage === 0) {
          pdf.addPage();
        }

        // RECTO
        drawBadgeRectoToPDF(pdf, seminariste, x, y, badgeWidth, badgeHeight);
      }

      // VERSO (nouvelle page)
      pdf.addPage();
      for (let i = 0; i < selectedSeminaristes.length; i++) {
        const seminariste = seminaristes.find((s) => s.matricule === selectedSeminaristes[i]);
        if (!seminariste) continue;

        const positionInPage = i % 2;
        const col = positionInPage % 2;
        const x = marginX + col * (badgeWidth + marginX);
        const y = marginY;

        if (i > 0 && positionInPage === 0 && i < selectedSeminaristes.length) {
          pdf.addPage();
        }

        // VERSO
        drawBadgeVersoToPDF(pdf, seminariste, x, y, badgeWidth, badgeHeight);
      }

      pdf.save(`badges-recto-verso-${new Date().toISOString().split("T")[0]}.pdf`);
      toast.success(`✅ ${selectedSeminaristes.length} badge(s) recto-verso générés`);
    } catch (error: any) {
      console.error("❌ Erreur PDF:", error);
      toast.error(error.message || "Erreur génération PDF");
    } finally {
      setGenerating(false);
    }
  };

  // ✅ RECTO
  const drawBadgeRectoToPDF = (
    pdf: jsPDF,
    sem: Seminariste,
    x: number,
    y: number,
    w: number,
    h: number
  ) => {
    // Border
    pdf.setDrawColor(59, 130, 246);
    pdf.setLineWidth(0.5);
    pdf.roundedRect(x, y, w, h, 3, 3);
    pdf.setFillColor(239, 246, 255);
    pdf.roundedRect(x, y, w, h, 3, 3, "F");

    // ✅ LOGOS (2 emplacements)
    // Logo Gauche
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.3);
    pdf.rect(x + 5, y + 3, 15, 15);
    pdf.setFontSize(6);
    pdf.setTextColor(150, 150, 150);
    pdf.text("LOGO 1", x + 12.5, y + 11, { align: "center" });

    // Logo Droit
    pdf.rect(x + w - 20, y + 3, 15, 15);
    pdf.text("LOGO 2", x + w - 12.5, y + 11, { align: "center" });

    // Header
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(59, 130, 246);
    pdf.text("SÉMINAIRE AN-NOUR", x + w / 2, y + 12, { align: "center" });

    pdf.setFontSize(7);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(100, 100, 100);
    pdf.text("Année 2024-2025", x + w / 2, y + 16, { align: "center" });

    // Photo
    const photoSize = 28;
    const photoX = x + w / 2 - photoSize / 2;
    const photoY = y + 20;
    pdf.setFillColor(220, 220, 220);
    pdf.circle(photoX + photoSize / 2, photoY + photoSize / 2, photoSize / 2, "F");
    pdf.setFontSize(18);
    pdf.setTextColor(150, 150, 150);
    pdf.text("👤", photoX + photoSize / 2, photoY + photoSize / 2 + 4, { align: "center" });

    // Nom
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0, 0, 0);
    const nomLines = pdf.splitTextToSize(sem.nom.toUpperCase(), w - 10);
    pdf.text(nomLines, x + w / 2, y + 57, { align: "center" });

    // Prénom
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(59, 130, 246);
    pdf.text(sem.prenom, x + w / 2, y + 66, { align: "center" });

    // Matricule
    pdf.setFontSize(8);
    pdf.setFont("courier", "bold");
    pdf.setTextColor(0, 0, 0);
    pdf.setFillColor(255, 255, 255);
    pdf.roundedRect(x + w / 2 - 18, y + 71, 36, 5, 2, 2, "F");
    pdf.text(sem.matricule, x + w / 2, y + 74.5, { align: "center" });

    // Niveau
    pdf.setFontSize(7);
    pdf.setFont("helvetica", "bold");
    pdf.setFillColor(240, 240, 240);
    pdf.roundedRect(x + 5, y + 83, w - 10, 7, 2, 2, "F");
    pdf.setTextColor(60, 60, 60);
    pdf.text(sem.niveau || "Non classé", x + w / 2, y + 87.5, { align: "center" });

    // Dortoir
    pdf.setFontSize(7);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Dortoir: ${sem.dortoir}`, x + w / 2, y + 95, { align: "center" });

    // Sexe + Âge
    pdf.setFontSize(6);
    pdf.text(`${sem.sexe === "M" ? "Masculin" : "Féminin"} • ${sem.age} ans`, x + w / 2, y + 100, {
      align: "center",
    });

    // QR Code
    pdf.setDrawColor(200, 200, 200);
    pdf.rect(x + w / 2 - 10, y + 105, 20, 20);
    pdf.setFontSize(5);
    pdf.setTextColor(150, 150, 150);
    pdf.text("QR CODE", x + w / 2, y + 116, { align: "center" });

    // Footer
    pdf.setFontSize(5);
    pdf.setTextColor(120, 120, 120);
    pdf.text("www.seminaire-annour.ci", x + w / 2, y + h - 2, { align: "center" });
  };

  // ✅ VERSO - DÉTAILS MÉDICAUX
  const drawBadgeVersoToPDF = (
    pdf: jsPDF,
    sem: Seminariste,
    x: number,
    y: number,
    w: number,
    h: number
  ) => {
    // Border
    pdf.setDrawColor(220, 38, 38);
    pdf.setLineWidth(0.5);
    pdf.roundedRect(x, y, w, h, 3, 3);
    pdf.setFillColor(254, 242, 242);
    pdf.roundedRect(x, y, w, h, 3, 3, "F");

    // Header VERSO
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(220, 38, 38);
    pdf.text("INFORMATIONS DÉTAILLÉES", x + w / 2, y + 8, { align: "center" });

    // Ligne séparatrice
    pdf.setDrawColor(220, 38, 38);
    pdf.setLineWidth(0.3);
    pdf.line(x + 5, y + 11, x + w - 5, y + 11);

    let currentY = y + 18;

    // ✅ SECTION IDENTITÉ
    pdf.setFontSize(7);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0, 0, 0);
    pdf.text("IDENTITÉ", x + 5, currentY);
    currentY += 5;

    pdf.setFontSize(6);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(60, 60, 60);
    pdf.text(`Matricule: ${sem.matricule}`, x + 5, currentY);
    currentY += 4;
    pdf.text(`Nom complet: ${sem.nom} ${sem.prenom}`, x + 5, currentY);
    currentY += 4;
    pdf.text(`Âge: ${sem.age} ans • Sexe: ${sem.sexe === "M" ? "Masculin" : "Féminin"}`, x + 5, currentY);
    currentY += 4;
    pdf.text(`Niveau: ${sem.niveau || "Non classé"}`, x + 5, currentY);
    currentY += 4;
    pdf.text(`Dortoir: ${sem.dortoir}`, x + 5, currentY);
    currentY += 7;

    // ✅ SECTION CONTACTS
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0, 0, 0);
    pdf.text("CONTACTS", x + 5, currentY);
    currentY += 5;

    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(60, 60, 60);
    pdf.text(`Parent/Tuteur: ${sem.contact_parent || "Non renseigné"}`, x + 5, currentY);
    currentY += 4;
    pdf.text(`Séminariste: ${sem.contact_seminariste || "Non renseigné"}`, x + 5, currentY);
    currentY += 4;
    pdf.text(`Commune: ${sem.commune_habitation || "Non renseignée"}`, x + 5, currentY);
    currentY += 7;

    // ✅ SECTION MÉDICALE (IMPORTANT)
    pdf.setFillColor(255, 237, 213);
    pdf.roundedRect(x + 3, currentY - 3, w - 6, 28, 2, 2, "F");
    
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(234, 88, 12);
    pdf.text("⚕️ INFORMATIONS MÉDICALES", x + 5, currentY);
    currentY += 5;

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(6);
    pdf.setTextColor(0, 0, 0);
    pdf.text("Allergies:", x + 5, currentY);
    currentY += 4;
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(60, 60, 60);
    const allergieLines = pdf.splitTextToSize(sem.allergie || "RAS", w - 12);
    pdf.text(allergieLines, x + 5, currentY);
    currentY += allergieLines.length * 3.5 + 2;

    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0, 0, 0);
    pdf.text("Antécédents médicaux:", x + 5, currentY);
    currentY += 4;
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(60, 60, 60);
    const antecedentLines = pdf.splitTextToSize(sem.antecedent_medical || "Néant", w - 12);
    pdf.text(antecedentLines, x + 5, currentY);
    currentY += antecedentLines.length * 3.5 + 5;

    // ✅ URGENCE
    pdf.setFillColor(254, 226, 226);
    pdf.roundedRect(x + 3, currentY - 2, w - 6, 12, 2, 2, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(6);
    pdf.setTextColor(220, 38, 38);
    pdf.text("🚨 EN CAS D'URGENCE", x + 5, currentY);
    currentY += 4;
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(0, 0, 0);
    pdf.text(`Contacter: ${sem.contact_parent || "Voir administration"}`, x + 5, currentY);
    currentY += 4;
    pdf.text("Ou l'administration du séminaire An-Nour", x + 5, currentY);

    // Footer
    pdf.setFontSize(5);
    pdf.setTextColor(120, 120, 120);
    pdf.text("Document confidentiel - Usage interne uniquement", x + w / 2, y + h - 2, {
      align: "center",
    });
  };

  // ✅ BADGE RECTO (React)
  const BadgeRecto = ({ seminariste }: { seminariste: Seminariste }) => (
    <div className="w-[340px] h-[520px] bg-gradient-to-br from-blue-50 via-white to-blue-50 rounded-2xl shadow-2xl p-6 border-4 border-primary/20 flex flex-col items-center justify-between relative overflow-hidden">
      {/* Watermark */}
      <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
        <CreditCard className="w-64 h-64 text-primary" />
      </div>

      {/* ✅ LOGOS */}
      <div className="absolute top-2 left-2 right-2 flex justify-between z-20">
        <div className="w-16 h-16 border-2 border-dashed border-primary/30 rounded-lg flex items-center justify-center text-xs text-muted-foreground bg-white/50">
          LOGO 1
        </div>
        <div className="w-16 h-16 border-2 border-dashed border-primary/30 rounded-lg flex items-center justify-center text-xs text-muted-foreground bg-white/50">
          LOGO 2
        </div>
      </div>

      {/* Header */}
      <div className="text-center space-y-1 z-10 mt-16">
        <div className="text-sm font-black text-primary uppercase tracking-widest">
          Séminaire An-Nour
        </div>
        <div className="text-xs text-muted-foreground font-semibold">Année 2024-2025</div>
        <div className="h-1 w-16 bg-gradient-to-r from-primary to-blue-300 mx-auto rounded-full mt-2" />
      </div>

      {/* Photo */}
      <div className="relative z-10">
        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary/20 to-blue-100 border-4 border-white shadow-xl flex items-center justify-center overflow-hidden">
          {seminariste.photo_url ? (
            <img src={seminariste.photo_url} alt={seminariste.nom} className="w-full h-full object-cover" />
          ) : (
            <Users className="h-16 w-16 text-primary/40" />
          )}
        </div>
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-bold shadow-lg">
          SÉMINARISTE
        </div>
      </div>

      {/* Info */}
      <div className="text-center space-y-2 w-full z-10">
        <div className="font-black text-xl uppercase leading-tight tracking-tight text-foreground">
          {seminariste.nom}
        </div>
        <div className="font-bold text-base text-primary capitalize">{seminariste.prenom}</div>
        <div className="inline-flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-md border border-border">
          <span className="text-xs font-medium text-muted-foreground">Matricule:</span>
          <span className="text-sm font-mono font-black text-foreground">{seminariste.matricule}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center space-y-2 w-full z-10">
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 p-2 rounded-xl">
          <Badge variant="default" className="text-xs px-3 py-0.5 font-semibold">
            {seminariste.niveau || "Non classé"}
          </Badge>
          <div className="text-xs text-muted-foreground mt-1 font-medium">
            Dortoir: {seminariste.dortoir}
          </div>
        </div>
        <div className="text-[10px] text-muted-foreground font-medium">www.seminaire-annour.ci</div>
      </div>
    </div>
  );

  // ✅ BADGE VERSO (React)
  const BadgeVerso = ({ seminariste }: { seminariste: Seminariste }) => (
    <div className="w-[340px] h-[520px] bg-gradient-to-br from-red-50 via-white to-red-50 rounded-2xl shadow-2xl p-6 border-4 border-red-300/30 flex flex-col relative overflow-hidden">
      <div className="space-y-4">
        {/* Header */}
        <div className="text-center border-b-2 border-red-200 pb-3">
          <h3 className="font-black text-red-600 text-sm uppercase tracking-wider">
            Informations Détaillées
          </h3>
        </div>

        {/* Identité */}
        <div className="space-y-2">
          <h4 className="font-bold text-xs text-foreground flex items-center gap-1">
            <Users className="h-3 w-3" /> IDENTITÉ
          </h4>
          <div className="text-xs space-y-1 text-muted-foreground bg-muted/30 p-2 rounded">
            <div>
              <strong>Matricule:</strong> {seminariste.matricule}
            </div>
            <div>
              <strong>Nom complet:</strong> {seminariste.nom} {seminariste.prenom}
            </div>
            <div>
              <strong>Âge:</strong> {seminariste.age} ans • <strong>Sexe:</strong>{" "}
              {seminariste.sexe === "M" ? "Masculin" : "Féminin"}
            </div>
            <div>
              <strong>Niveau:</strong> {seminariste.niveau || "Non classé"}
            </div>
            <div>
              <strong>Dortoir:</strong> {seminariste.dortoir}
            </div>
          </div>
        </div>

        {/* Contacts */}
        <div className="space-y-2">
          <h4 className="font-bold text-xs text-foreground flex items-center gap-1">
            <Phone className="h-3 w-3" /> CONTACTS
          </h4>
          <div className="text-xs space-y-1 text-muted-foreground bg-muted/30 p-2 rounded">
            <div>
              <strong>Parent/Tuteur:</strong> {seminariste.contact_parent || "Non renseigné"}
            </div>
            <div>
              <strong>Séminariste:</strong> {seminariste.contact_seminariste || "Non renseigné"}
            </div>
            <div>
              <strong>Commune:</strong> {seminariste.commune_habitation || "Non renseignée"}
            </div>
          </div>
        </div>

        {/* Médical */}
        <div className="space-y-2 bg-orange-50 p-3 rounded-lg border-2 border-orange-200">
          <h4 className="font-bold text-xs text-orange-700 flex items-center gap-1">
            <Heart className="h-3 w-3" /> INFORMATIONS MÉDICALES
          </h4>
          <div className="text-xs space-y-2 text-foreground">
            <div>
              <strong className="text-orange-700">Allergies:</strong>
              <div className="mt-1 text-muted-foreground">{seminariste.allergie || "RAS"}</div>
            </div>
            <div>
              <strong className="text-orange-700">Antécédents:</strong>
              <div className="mt-1 text-muted-foreground">
                {seminariste.antecedent_medical || "Néant"}
              </div>
            </div>
          </div>
        </div>

        {/* Urgence */}
        <div className="bg-red-100 p-3 rounded-lg border-2 border-red-300">
          <h4 className="font-bold text-xs text-red-700 flex items-center gap-1 mb-2">
            <AlertCircle className="h-3 w-3" /> EN CAS D'URGENCE
          </h4>
          <div className="text-xs text-red-900 space-y-1">
            <div>
              <strong>Contacter:</strong> {seminariste.contact_parent || "Voir administration"}
            </div>
            <div className="text-[10px]">Ou l'administration du séminaire An-Nour</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-2 left-0 right-0 text-center text-[9px] text-muted-foreground">
        Document confidentiel - Usage interne uniquement
      </div>
    </div>
  );

  if (loading) {
    return (
      <DashboardLayout>
        <Card>
          <CardContent className="p-12">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <div className="text-lg font-semibold">Chargement...</div>
            </div>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <CreditCard className="h-7 w-7 text-primary" />
              GÉNÉRATION DE BADGES RECTO-VERSO
            </h1>
            <p className="text-muted-foreground">Badges avec logos et informations médicales</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* SÉLECTION */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Sélection des Séminaristes</span>
                  <Badge variant="outline" className="text-base">
                    {selectedSeminaristes.length} sélectionné(s)
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={selectedNiveau} onValueChange={setSelectedNiveau}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tous">Tous niveaux</SelectItem>
                      {Array.from(new Set(seminaristes.map((s) => s.niveau).filter(Boolean))).map(
                        (niveau) => (
                          <SelectItem key={niveau} value={niveau || ""}>
                            {niveau}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" onClick={fetchSeminaristes}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>

                <div className="border rounded-lg max-h-[500px] overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background">
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={
                              selectedSeminaristes.length === filteredSeminaristes.length &&
                              filteredSeminaristes.length > 0
                            }
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                        <TableHead>MATRICULE</TableHead>
                        <TableHead>NOM & PRÉNOM</TableHead>
                        <TableHead>NIVEAU</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSeminaristes.map((sem) => (
                        <TableRow key={sem.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedSeminaristes.includes(sem.matricule)}
                              onCheckedChange={() => handleSelectOne(sem.matricule)}
                            />
                          </TableCell>
                          <TableCell className="font-mono font-semibold">{sem.matricule}</TableCell>
                          <TableCell>
                            <div className="font-semibold">{sem.nom}</div>
                            <div className="text-sm text-muted-foreground">{sem.prenom}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{sem.niveau || "Non classé"}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* PREVIEW */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Aperçu Badge
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowVerso(!showVerso)}
                    className="text-xs"
                  >
                    {showVerso ? "Voir Recto" : "Voir Verso"}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center">
                {selectedSeminaristes.length > 0 ? (
                  <div className="scale-[0.65] origin-top">
                    {showVerso ? (
                      <BadgeVerso
                        seminariste={seminaristes.find((s) => s.matricule === selectedSeminaristes[0])!}
                      />
                    ) : (
                      <BadgeRecto
                        seminariste={seminaristes.find((s) => s.matricule === selectedSeminaristes[0])!}
                      />
                    )}
                  </div>
                ) : (
                  <div className="w-64 h-96 border-2 border-dashed rounded-xl flex items-center justify-center">
                    <div className="text-center space-y-2">
                      <CreditCard className="h-12 w-12 mx-auto text-muted-foreground" />
                      <div className="text-sm text-muted-foreground">Sélectionnez un séminariste</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 pt-2">
                  <Button
                    className="w-full gap-2"
                    size="lg"
                    onClick={generatePDF}
                    disabled={selectedSeminaristes.length === 0 || generating}
                  >
                    {generating ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Génération...
                      </>
                    ) : (
                      <>
                        <FileText className="h-5 w-5" />
                        Télécharger PDF Recto-Verso ({selectedSeminaristes.length})
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    disabled={selectedSeminaristes.length === 0}
                  >
                    <Printer className="h-4 w-4" />
                    Imprimer
                  </Button>
                </div>

                <div className="text-xs text-muted-foreground p-3 bg-muted/50 rounded-lg space-y-1">
                  <div className="font-semibold mb-1">ℹ️ Information:</div>
                  <div>• 2 emplacements pour logos</div>
                  <div>• Recto: Identité + Photo</div>
                  <div>• Verso: Infos médicales</div>
                  <div>• 2 badges par page A4</div>
                  <div>• Format impression optimisé</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
