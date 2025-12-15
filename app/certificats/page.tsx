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
  Award,
  Download,
  Eye,
  Loader2,
  RefreshCw,
  FileText,
} from "lucide-react";
import { scientificApi, Seminariste } from "@/lib/api";
import { toast } from "sonner";
import jsPDF from "jspdf";
import logoAnnour from "@/public/ANNOUR.png";
import AEEMCI from "@/public/Logo_AEEMCI.jpeg";

export default function CertificatePage() {
  const [seminaristes, setSeminaristes] = useState<Seminariste[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedNiveau, setSelectedNiveau] = useState("tous");
  const [selectedSeminaristes, setSelectedSeminaristes] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const fetchSeminaristes = async () => {
    try {
      setLoading(true);
      const response = await scientificApi.getSeminaristes(1, 100);
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
    const matchesNiveau =
      selectedNiveau === "tous" || sem.niveau === selectedNiveau;
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
      prev.includes(matricule)
        ? prev.filter((m) => m !== matricule)
        : [...prev, matricule]
    );
  };

  // ✅ Fonction pour ajouter le watermark
  const addWatermarkLogo = (
    pdf: jsPDF,
    logoSrc: string,
    x: number,
    y: number,
    w: number,
    h: number,
    opacity: number = 0.05
  ) => {
    pdf.saveGraphicsState();
    pdf.setGState(new pdf.GState({ opacity: opacity }));

    const logoWidth = w * 0.6;
    const aspectRatio = 2517 / 1467;
    const logoHeight = logoWidth / aspectRatio;

    const logoX = x + (w - logoWidth) / 2;
    const logoY = y + (h - logoHeight) / 2;

    pdf.addImage(logoSrc, "PNG", logoX, logoY, logoWidth, logoHeight);
    pdf.restoreGraphicsState();
  };

  // ✅ Génération du certificat en PDF
  const drawCertificateToPDF = async (
    pdf: jsPDF,
    sem: Seminariste,
    x: number,
    y: number,
    w: number,
    h: number
  ) => {
    // Background blanc
    pdf.setFillColor(255, 255, 255);
    pdf.rect(x, y, w, h, "F");

    // ✅ Watermark en arrière-plan
    addWatermarkLogo(pdf, logoAnnour.src, x, y, w, h, 0.05);

    // ✅ Border décoratif
    pdf.setDrawColor(166, 195, 60);
    pdf.setLineWidth(3);
    pdf.rect(x + 5, y + 5, w - 10, h - 10);

    pdf.setDrawColor(166, 195, 60);
    pdf.setLineWidth(1);
    pdf.rect(x + 8, y + 8, w - 16, h - 16);

    // ✅ Logos en haut
    const logoSize = 20;
    const logoY = y + 15;

    // Logo AEEMCI (gauche)
    try {
      pdf.addImage(AEEMCI.src, "JPEG", x + 20, logoY, logoSize, logoSize);
    } catch (error) {
      console.error("Erreur logo AEEMCI:", error);
    }

    // Logo Annour (droite)
    const aspectRatioNour = 2517 / 1467;
    const logoHeightNour = logoSize / aspectRatioNour;
    const offsetYNour = (logoSize - logoHeightNour) / 2;

    try {
      pdf.addImage(
        logoAnnour.src,
        "PNG",
        x + w - 40,
        logoY + offsetYNour,
        logoSize,
        logoHeightNour
      );
    } catch (error) {
      console.error("Erreur logo Annour:", error);
    }

    // ✅ Header
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(166, 195, 60);
    pdf.text("AEEMCI", x + w / 2, y + 20, { align: "center" });

    pdf.setFontSize(14);
    pdf.setTextColor(0, 0, 0);
    pdf.text("SERAE", x + w / 2, y + 28, { align: "center" });

    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(100, 100, 100);
    pdf.text(
      "Sous-comité Cocody I & Sous-comité Bingerville",
      x + w / 2,
      y + 35,
      { align: "center" }
    );

    // ✅ Titre "CERTIFICAT DE PARTICIPATION"
    pdf.setFontSize(32);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(166, 195, 60);
    pdf.text("CERTIFICAT", x + w / 2, y + 60, { align: "center" });

    pdf.setFontSize(20);
    pdf.setTextColor(0, 0, 0);
    pdf.text("DE PARTICIPATION", x + w / 2, y + 72, { align: "center" });

    // ✅ Ligne décorative
    pdf.setDrawColor(166, 195, 60);
    pdf.setLineWidth(0.5);
    pdf.line(x + w / 2 - 60, y + 78, x + w / 2 + 60, y + 78);

    // ✅ Texte de présentation
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(0, 0, 0);
    pdf.text("Décerné à", x + w / 2, y + 95, { align: "center" });

    // ✅ Nom du participant
    pdf.setFontSize(28);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(166, 195, 60);
    pdf.text(
      `${sem.prenom.toUpperCase()} ${sem.nom.toUpperCase()}`,
      x + w / 2,
      y + 110,
      { align: "center" }
    );

    // ✅ Ligne sous le nom
    pdf.setDrawColor(166, 195, 60);
    pdf.setLineWidth(0.8);
    const nameWidth = pdf.getTextWidth(
      `${sem.prenom.toUpperCase()} ${sem.nom.toUpperCase()}`
    );
    pdf.line(
      x + w / 2 - nameWidth / 2 - 10,
      y + 115,
      x + w / 2 + nameWidth / 2 + 10,
      y + 115
    );

    // ✅ Matricule
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "italic");
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Matricule : ${sem.matricule}`, x + w / 2, y + 123, {
      align: "center",
    });

    // ✅ Texte principal
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(0, 0, 0);

    const mainText = [
      "Pour avoir participé avec assiduité et engagement",
      "au Séminaire An-Nour 2025 organisé par l'AEEMCI/SERA-EST",
      "Sous-comité Cocody I & Sous-comité Bingerville",
    ];

    let currentY = y + 130;
    mainText.forEach((line) => {
      pdf.text(line, x + w / 2, currentY, { align: "center" });
      currentY += 6;
    });

    // ✅ Niveau et Dortoir
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(166, 195, 60);
    pdf.text(`Niveau : ${sem.niveau || "Universitaire"}`, x + w / 2, y + 153, {
      align: "center",
    });

    pdf.setTextColor(0, 0, 0);
    pdf.text(`Dortoir : ${sem.dortoir || "Non assigné"}`, x + w / 2, y + 158, {
      align: "center",
    });

    // ✅ Date et lieu
    const currentDate = new Date().toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Fait à Abidjan, le ${currentDate}`, x + w / 2, y + h - 20, {
      align: "center",
    });

    // ✅ Signatures
    const signatureY = y + h - 30;

    // Signature gauche
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0, 0, 0);
    pdf.text("Le Président", x + 40, signatureY);
    pdf.setLineWidth(0.5);
    pdf.line(x + 25, signatureY + 2, x + 70, signatureY + 2);

    // Signature droite
    pdf.text("Le Coordinateur", x + w - 55, signatureY);
    pdf.line(x + w - 70, signatureY + 2, x + w - 25, signatureY + 2);

    // ✅ Footer
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(166, 195, 60);
    pdf.text("https://an-nour25.vercel.app", x + w / 2, y + h - 15, {
      align: "center",
    });
  };

  // ✅ Génération des certificats
  const generateCertificates = async () => {
    if (selectedSeminaristes.length === 0) {
      toast.warning("⚠️ Sélectionnez au moins un séminariste");
      return;
    }

    try {
      setGenerating(true);
      toast.info("📄 Génération des certificats en cours...");

      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const certWidth = 297 - 20; // A4 paysage avec marges
      const certHeight = 210 - 20;
      const marginX = 10;
      const marginY = 10;

      let isFirst = true;

      for (let i = 0; i < selectedSeminaristes.length; i++) {
        const seminariste = seminaristes.find(
          (s) => s.matricule === selectedSeminaristes[i]
        );
        if (!seminariste) continue;

        if (!isFirst) {
          pdf.addPage();
        }
        isFirst = false;

        await drawCertificateToPDF(
          pdf,
          seminariste,
          marginX,
          marginY,
          certWidth,
          certHeight
        );
      }

      pdf.save(
        `certificats-annour-${new Date().toISOString().split("T")[0]}.pdf`
      );
      toast.success(
        `✅ ${selectedSeminaristes.length} certificat(s) généré(s)`
      );
    } catch (error: any) {
      console.error("❌ Erreur PDF:", error);
      toast.error(error.message || "Erreur génération PDF");
    } finally {
      setGenerating(false);
    }
  };

  // ✅ Preview React du certificat
  const CertificatePreview = ({ seminariste }: { seminariste: Seminariste }) => (
    <div className="relative w-full aspect-[297/210] bg-white rounded-lg shadow-2xl overflow-hidden">
      {/* Watermark */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.05] pointer-events-none">
        <img
          src={logoAnnour.src}
          alt="Watermark"
          className="w-[60%] h-auto object-contain"
        />
      </div>

      {/* Border décoratif */}
      <div className="absolute inset-2 border-4 border-[#A6C33C] rounded-lg"></div>
      <div className="absolute inset-[14px] border border-[#A6C33C] rounded-lg"></div>

      {/* Contenu */}
      <div className="relative z-10 p-8 h-full flex flex-col items-center">
        {/* Logos */}
        <div className="flex justify-between w-full mb-4">
          <img src={AEEMCI.src} alt="AEEMCI" className="h-12 w-12 object-cover" />
          <img
            src={logoAnnour.src}
            alt="ANNOUR"
            className="h-12 w-auto object-contain"
          />
        </div>

        {/* Header */}
        <div className="text-center space-y-0.5 mb-6">
          <div className="text-base font-bold text-[#A6C33C]">AEEMCI</div>
          <div className="text-lg font-bold text-black">SERAE</div>
          <div className="text-xs text-gray-500">
            Sous-comité Cocody I & Sous-comité Bingerville
          </div>
        </div>

        {/* Titre */}
        <div className="text-center mb-4">
          <div className="text-4xl font-bold text-[#A6C33C] mb-1">
            CERTIFICAT
          </div>
          <div className="text-xl font-bold text-black">DE PARTICIPATION</div>
          <div className="w-32 h-0.5 bg-[#A6C33C] mx-auto mt-2"></div>
        </div>

        {/* Décerné à */}
        <div className="text-center mb-2">
          <div className="text-base text-black">Décerné à</div>
        </div>

        {/* Nom */}
        <div className="text-center mb-1">
          <div className="text-3xl font-bold text-[#A6C33C]">
            {seminariste.prenom.toUpperCase()} {seminariste.nom.toUpperCase()}
          </div>
          <div className="w-64 h-0.5 bg-[#A6C33C] mx-auto mt-1"></div>
        </div>

        {/* Matricule */}
        <div className="text-xs italic text-gray-500 mb-6">
          Matricule : {seminariste.matricule}
        </div>

        {/* Texte principal */}
        <div className="text-center text-sm space-y-1 mb-6">
          <p>Pour avoir participé avec assiduité et engagement</p>
          <p>au Séminaire An-Nour 2025 organisé par l'AEEMCI/SERAE</p>
          <p>Sous-comité Cocody I & Sous-comité Bingerville</p>
        </div>

        {/* Niveau et Dortoir */}
        <div className="text-center space-y-1 mb-6">
          <div className="text-sm font-bold text-[#A6C33C]">
            Niveau : {seminariste.niveau || "Universitaire"}
          </div>
          <div className="text-sm font-bold text-black">
            Dortoir : {seminariste.dortoir || "Non assigné"}
          </div>
        </div>

        {/* Date */}
        <div className="text-xs text-gray-500 mb-4">
          Fait à Abidjan, le{" "}
          {new Date().toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </div>

        {/* Signatures */}
        <div className="flex justify-between w-full px-12 mb-6">
          <div className="text-center">
            <div className="text-sm font-bold mb-1">Le Président</div>
            <div className="w-32 h-0.5 bg-black"></div>
          </div>
          <div className="text-center">
            <div className="text-sm font-bold mb-1">Le Coordinateur</div>
            <div className="w-32 h-0.5 bg-black"></div>
          </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-4 left-0 right-0 text-center">
          <span className="text-xs font-bold text-[#A6C33C]">
            https://an-nour25.vercel.app
          </span>
        </div>
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
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Award className="h-7 w-7 text-[#A6C33C]" />
              GÉNÉRATION DE CERTIFICATS DE PARTICIPATION
            </h1>
            <p className="text-muted-foreground">
              Certificats officiels Séminaire An-Nour 2025
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sélection */}
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
                  <Select
                    value={selectedNiveau}
                    onValueChange={setSelectedNiveau}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tous">Tous niveaux</SelectItem>
                      {Array.from(
                        new Set(
                          seminaristes.map((s) => s.niveau).filter(Boolean)
                        )
                      ).map((niveau) => (
                        <SelectItem key={niveau} value={niveau || ""}>
                          {niveau}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchSeminaristes}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>

                <div className="border rounded-lg max-h-[500px] overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background">
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                          className="border-[#AC3]"
                            checked={
                              selectedSeminaristes.length ===
                                filteredSeminaristes.length &&
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
                            className="border-[#AC3]"
                              checked={selectedSeminaristes.includes(
                                sem.matricule
                              )}
                              onCheckedChange={() =>
                                handleSelectOne(sem.matricule)
                              }
                            />
                          </TableCell>
                          <TableCell className="font-mono font-semibold">
                            {sem.matricule}
                          </TableCell>
                          <TableCell>
                            <div className="font-semibold">{sem.nom}</div>
                            <div className="text-sm text-muted-foreground">
                              {sem.prenom}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {sem.niveau || "Non classé"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview et Options */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Aperçu Certificat
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedSeminaristes.length > 0 ? (
                  <div className="scale-75 origin-top">
                    <CertificatePreview
                      seminariste={
                        seminaristes.find(
                          (s) => s.matricule === selectedSeminaristes[0]
                        )!
                      }
                    />
                  </div>
                ) : (
                  <div className="aspect-[297/210] border-2 border-dashed rounded-lg flex items-center justify-center">
                    <div className="text-center space-y-2">
                      <Award className="h-12 w-12 mx-auto text-muted-foreground" />
                      <div className="text-sm text-muted-foreground">
                        Sélectionnez un séminariste
                      </div>
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
                <Button
                  className="w-full gap-2 bg-[#A6C33C] hover:bg-[#95B035]"
                  size="lg"
                  onClick={generateCertificates}
                  disabled={selectedSeminaristes.length === 0 || generating}
                >
                  {generating ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Génération en cours...
                    </>
                  ) : (
                    <>
                      <Download className="h-5 w-5" />
                      Télécharger PDF ({selectedSeminaristes.length})
                    </>
                  )}
                </Button>

                <div className="text-xs text-muted-foreground p-3 bg-muted/50 rounded-lg space-y-1">
                  <div className="font-semibold mb-1">
                    ✅ Certificats professionnels :
                  </div>
                  <div>• Design officiel AEEMCI/SERAE</div>
                  <div>• Format A4 paysage</div>
                  <div>• Watermark subtil</div>
                  <div>• Bordure décorative</div>
                  <div>• 1 certificat par page</div>
                  <div>• Prêt à imprimer</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
