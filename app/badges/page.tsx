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
} from "lucide-react";
import { scientificApi, Seminariste } from "@/lib/api";
import { toast } from "sonner";
import jsPDF from "jspdf";
import QRCode from "qrcode";
import logoAnnour from "@/public/ANNOUR.png";
import AEEMCI from "@/public/Logo_AEEMCI.jpeg";

export default function BadgeGenerationPage() {
  const [seminaristes, setSeminaristes] = useState<Seminariste[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedNiveau, setSelectedNiveau] = useState("tous");
  const [selectedSeminaristes, setSelectedSeminaristes] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [showVerso, setShowVerso] = useState(false);
  const [qrCodes, setQrCodes] = useState<{ [key: string]: string }>({});

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

  // ✅ Génération QR Code pour preview
  useEffect(() => {
    const generateQRCodes = async () => {
      const codes: { [key: string]: string } = {};
      for (const sem of selectedSeminaristes.slice(0, 1)) {
        try {
          const qrDataUrl = await QRCode.toDataURL(sem, {
            width: 200,
            margin: 1,
          });
          codes[sem] = qrDataUrl;
        } catch (err) {
          console.error("QR Code error:", err);
        }
      }
      setQrCodes(codes);
    };

    if (selectedSeminaristes.length > 0) {
      generateQRCodes();
    }
  }, [selectedSeminaristes]);

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

  // ✅ GÉNÉRATION PDF avec RECTO et VERSO côte à côte
  const generatePDF = async () => {
    if (selectedSeminaristes.length === 0) {
      toast.warning("⚠️ Sélectionnez au moins un séminariste");
      return;
    }

    try {
      setGenerating(true);
      toast.info("📄 Génération PDF avec recto-verso côte à côte...");

      const pdf = new jsPDF({
        orientation: "landscape", // ✅ Paysage pour mettre 2 badges côte à côte
        unit: "mm",
        format: "a4",
      });

      const badgeWidth = 100;
      const badgeHeight = 145;
      const marginX = (297 - badgeWidth * 2) / 3; // 297mm largeur A4 paysage
      const marginY = (210 - badgeHeight) / 2; // Centrer verticalement

      let isFirstPage = true;

      // ✅ GÉNÉRER RECTO et VERSO côte à côte pour chaque séminariste
      for (let i = 0; i < selectedSeminaristes.length; i++) {
        const seminariste = seminaristes.find(
          (s) => s.matricule === selectedSeminaristes[i]
        );
        if (!seminariste) continue;

        // Ajouter une nouvelle page (sauf pour le premier badge)
        if (!isFirstPage) {
          pdf.addPage();
        }
        isFirstPage = false;

        // Position RECTO (gauche)
        const xRecto = marginX;
        const y = marginY;

        // Position VERSO (droite)
        const xVerso = marginX + badgeWidth + marginX;

        // Dessiner RECTO
        await drawBadgeRectoToPDF(pdf, seminariste, xRecto, y, badgeWidth, badgeHeight);

        // Dessiner VERSO
        await drawBadgeVersoToPDF(pdf, seminariste, xVerso, y, badgeWidth, badgeHeight);
      }

      pdf.save(`badges-annour-${new Date().toISOString().split("T")[0]}.pdf`);
      toast.success(
        `✅ ${selectedSeminaristes.length} badge(s) générés (recto-verso côte à côte)`
      );
    } catch (error: any) {
      console.error("❌ Erreur PDF:", error);
      toast.error(error.message || "Erreur génération PDF");
    } finally {
      setGenerating(false);
    }
  };

  // ✅ Fonction pour ajouter un logo en arrière-plan avec opacité
  const addWatermarkLogo = (
    pdf: jsPDF,
    logoSrc: string,
    x: number,
    y: number,
    w: number,
    h: number,
    opacity: number = 0.5
  ) => {
    pdf.saveGraphicsState();
    pdf.setGState(new pdf.GState({ opacity: opacity }));

    const logoWidth = w * 1.1;
    const aspectRatio = 2517 / 1467;
    const logoHeight = logoWidth / aspectRatio;

    const logoX = x + (w - logoWidth) / 2;
    const logoY = y + (h - logoHeight) / 2;

    pdf.addImage(logoSrc, "PNG", logoX, logoY, logoWidth, logoHeight);
    pdf.restoreGraphicsState();
  };

  // ✅ RECTO
  const drawBadgeRectoToPDF = async (
    pdf: jsPDF,
    sem: Seminariste,
    x: number,
    y: number,
    w: number,
    h: number
  ) => {
    // Border vert clair
    pdf.setDrawColor(166, 195, 60);
    pdf.setLineWidth(1);
    pdf.rect(x, y, w, h);

    // Background blanc
    pdf.setFillColor(255, 255, 255);
    pdf.rect(x, y, w, h, "F");

    // ✅ LOGO EN ARRIÈRE-PLAN (watermark)
    addWatermarkLogo(pdf, logoAnnour.src, x, y, w, h, 0.08);

    // Logo gauche AEEMCI
    const logoSize = 12;
    const logoX = x + 5;
    const logoY = y + 4;

    try {
      pdf.addImage(AEEMCI.src, "JPEG", logoX, logoY, logoSize, logoSize);
    } catch (error) {
      console.error("Erreur logo AEEMCI:", error);
    }

    // Logo droit Annour
    const logoMaxSize = 12;
    const aspectRatioNour = 2517 / 1467;
    const logoHeight = logoMaxSize / aspectRatioNour;
    const offsetYNour = (logoMaxSize - logoHeight) / 2;

    try {
      pdf.addImage(
        logoAnnour.src,
        "PNG",
        x + w - 17,
        y + 4 + offsetYNour,
        logoMaxSize,
        logoHeight
      );
    } catch (error) {
      console.error("Erreur logo Annour:", error);
    }

    // Header
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(166, 195, 60);
    pdf.text("AEEMCI", x + w / 2, y + 8, { align: "center" });

    pdf.setFontSize(9);
    pdf.setTextColor(0, 0, 0);
    pdf.text("SERA-EST", x + w / 2, y + 13, { align: "center" });

    pdf.setFontSize(6);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(100, 100, 100);
    pdf.text("Sous-comité Cocody I & Sous-comité Bingerville", x + w / 2, y + 17, {
      align: "center",
    });

    // Titre "SEMINAIRE AN-NOUR"
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(166, 195, 60);
    pdf.text("SEMINAIRE AN-NOUR 25", x + w / 2, y + 27, { align: "center" });

    // Photo circulaire avec border vert
    const photoSize = 30;
    const photoX = x + w / 2;
    const photoY = y + 45;

    pdf.setDrawColor(166, 195, 60);
    pdf.setLineWidth(1.2);
    pdf.circle(photoX, photoY, photoSize / 2);

    pdf.setFillColor(240, 240, 240);
    pdf.circle(photoX, photoY, photoSize / 2 - 1, "F");

    // Ajouter la photo si disponible
    if (sem.photo_url) {
      try {
        // Charger et ajouter la photo (vous devrez implémenter cette fonction)
        // pdf.addImage(photoData, "JPEG", photoX - photoSize/2, photoY - photoSize/2, photoSize, photoSize);
      } catch (error) {
        console.error("Erreur photo:", error);
      }
    }

    // Badge "SEMINARISTE"
    pdf.setFillColor(166, 195, 60);
    pdf.roundedRect(x + w / 2 - 18, y + 58, 36, 6, 3, 3, "F");
    pdf.setFontSize(7);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(255, 255, 255);
    pdf.text("SEMINARISTE", x + w / 2, y + 62, { align: "center" });

    // Nom
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(166, 195, 60);
    pdf.text(sem.nom.toUpperCase(), x + w / 2, y + 70, { align: "center" });

    // Prénom
    pdf.setFontSize(9);
    pdf.setTextColor(0, 0, 0);
    pdf.text(sem.prenom.toUpperCase(), x + w / 2, y + 75, { align: "center" });

    // Matricule
    pdf.setDrawColor(166, 195, 60);
    pdf.setLineWidth(0.8);
    pdf.roundedRect(x + 8, y + 80, w - 16, 7, 3, 3);

    pdf.setFontSize(8);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(100, 100, 100);
    pdf.text("Matricule :", x + 12, y + 85);

    pdf.setFontSize(8);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0, 0, 0);
    pdf.text(sem.matricule, x + w - 12, y + 85, { align: "right" });

    // Cadre dortoir
    pdf.setDrawColor(166, 195, 60);
    pdf.setLineWidth(0.8);
    pdf.setFillColor(255, 255, 255);
    pdf.roundedRect(x + 10, y + 95, w - 20, 20, 4, 4, "FD");

    // Niveau
    pdf.setDrawColor(166, 195, 60);
    pdf.setLineWidth(0.8);
    pdf.roundedRect(x + w / 2 - 25, y + 91, 50, 8, 4, 4);

    pdf.setFillColor(255, 255, 255);
    pdf.roundedRect(x + w / 2 - 25, y + 91, 50, 8, 4, 4, "F");

    pdf.setFontSize(8);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0, 0, 0);
    pdf.text(sem.niveau || "Universitaire", x + w / 2, y + 96, {
      align: "center",
    });

    // Dortoir
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(0, 0, 0);
    pdf.text("Dortoir :", x + 15, y + 108, { align: "left" });

    pdf.setFont("helvetica", "bold");
    pdf.text(sem.dortoir || "Salwa - Réconfort", x + w - 15, y + 108, {
      align: "right",
    });

    // Footer URL
    pdf.setFontSize(6);
    pdf.setTextColor(166, 195, 60);
    pdf.setFont("helvetica", "bold");
    pdf.text("https://an-nour25.vercel.app", x + w / 2, y + h - 3, {
      align: "center",
    });
  };

  // ✅ VERSO
  const drawBadgeVersoToPDF = async (
    pdf: jsPDF,
    sem: Seminariste,
    x: number,
    y: number,
    w: number,
    h: number
  ) => {
    // Border vert
    pdf.setDrawColor(166, 195, 60);
    pdf.setLineWidth(1);
    pdf.rect(x, y, w, h);

    // Background
    pdf.setFillColor(255, 255, 255);
    pdf.rect(x, y, w, h, "F");

    // ✅ LOGO EN ARRIÈRE-PLAN (watermark)
    addWatermarkLogo(pdf, logoAnnour.src, x, y, w, h, 0.08);

    // Header
    // pdf.setFontSize(8);
    // pdf.setFont("helvetica", "bold");
    // pdf.setTextColor(166, 195, 60);
    // pdf.text("AEEMCI", x + w / 2, y + 6, { align: "center" });

    // pdf.setFontSize(9);
    // pdf.setTextColor(0, 0, 0);
    // pdf.text("SERA-EST", x + w / 2, y + 11, { align: "center" });

    pdf.setFontSize(6);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(100, 100, 100);
    pdf.text("Sous-comité Cocody I & Sous-comité Bingerville", x + w / 2, y + 15, {
      align: "center",
    });

    let currentY = y + 22;

    // SECTION CONTACTS
    pdf.setDrawColor(166, 195, 60);
    pdf.setLineWidth(0.8);
    pdf.roundedRect(x + 5, currentY, w - 10, 28, 3, 3);

    pdf.setFontSize(8);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0, 0, 0);
    pdf.text("Contacts", x + w / 2, currentY + 5, { align: "center" });

    currentY += 10;

    pdf.setFontSize(7);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(0, 0, 0);
    pdf.text("Parents :", x + 8, currentY);
    pdf.text(sem.contact_parent || "0555990076", x + 45, currentY);

    // currentY += 5;
    // pdf.text("Séminariste :", x + 8, currentY);
    // pdf.text(sem.contact_seminariste || "0555990076", x + 45, currentY);

    currentY += 5;
    pdf.text("Commune :", x + 8, currentY);
    pdf.text(sem.commune_habitation || "Bingerville", x + 45, currentY);

    currentY += 20;

    // SECTION INFORMATIONS MÉDICALES
    pdf.setDrawColor(166, 195, 60);
    pdf.roundedRect(x + 5, currentY, w - 10, 35, 3, 3);

    pdf.setFontSize(8);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0, 0, 0);
    pdf.text("INFORMATIONS MÉDICALES", x + w / 2, currentY + 5, {
      align: "center",
    });

    currentY += 10;

    pdf.setFontSize(7);
    pdf.setFont("helvetica", "bold");
    pdf.text("Allergies :", x + 8, currentY);
    currentY += 4;

    pdf.setFont("helvetica", "normal");
    const allergieLines = pdf.splitTextToSize(sem.allergie || "RAS", w - 20);
    pdf.text(allergieLines, x + 8, currentY);
    currentY += allergieLines.length * 4 + 2;

    pdf.setFont("helvetica", "bold");
    pdf.text("Antécédents :", x + 8, currentY);
    currentY += 4;

    pdf.setFont("helvetica", "normal");
    const antecedentLines = pdf.splitTextToSize(
      sem.antecedent_medical || "Néant",
      w - 20
    );
    pdf.text(antecedentLines, x + 8, currentY);

    // QR CODE
    try {
      const qrDataUrl = await QRCode.toDataURL(sem.matricule, {
        width: 300,
        margin: 1,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });

      const qrSize = 25;
      const qrX = x + w / 2 - qrSize / 2;
      const qrY = y + h - 32;

      pdf.addImage(qrDataUrl, "PNG", qrX, qrY, qrSize, qrSize);
    } catch (err) {
      console.error("QR Code error:", err);
      pdf.setDrawColor(200, 200, 200);
      pdf.rect(x + w / 2 - 12, y + h - 32, 24, 24);
    }

    // Footer
    pdf.setFontSize(6);
    pdf.setTextColor(166, 195, 60);
    pdf.setFont("helvetica", "bold");
    pdf.text("https://an-nour25.vercel.app", x + w / 2, y + h - 3, {
      align: "center",
    });
  };

  // ✅ BADGE RECTO React (Preview)
 // ✅ BADGE RECTO React - Design identique au PDF
const BadgeRecto = ({ seminariste }: { seminariste: Seminariste }) => (
  <div className="relative w-[400px] h-[630px] bg-white rounded-lg shadow-2xl border-4 border-[#A6C33C] overflow-hidden">
    {/* ✅ Watermark logo en arrière-plan */}
    <div className="absolute inset-0 flex items-center justify-center opacity-[0.08] pointer-events-none">
      <img
        src={logoAnnour.src}
        alt="Watermark"
        className="w-[80%] h-auto object-contain"
      />
    </div>

    {/* Contenu principal */}
    <div className="relative z-10 p-6 flex flex-col items-center">
      {/* Logos en haut */}
      <div className="absolute top-4 left-4 right-4 flex justify-between">
        <div className="w-12 h-12 border border-gray-300 flex items-center justify-center overflow-hidden">
          <img
            src={AEEMCI.src}
            alt="AEEMCI"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="w-12 h-12 border border-gray-300 flex items-center justify-center overflow-hidden">
          <img
            src={logoAnnour.src}
            alt="ANNOUR"
            className="w-full h-auto object-contain"
          />
        </div>
      </div>

      {/* Header */}
      <div className="text-center mt-12 space-y-0.5">
        <div className="text-sm font-bold text-[#A6C33C]">AEEMCI</div>
        <div className="text-base font-bold text-black">SERA-EST</div>
        <div className="text-[10px] text-gray-500">
          Sous-comité Cocody I & Sous-comité Bingerville
        </div>
      </div>

      {/* Titre */}
      <div className="text-center mt-3">
        <div className="text-2xl font-bold text-[#A6C33C]">
          SEMINAIRE AN-NOUR 25
        </div>
      </div>

      {/* Photo circulaire */}
      <div className="mt-5 relative">
        <div className="w-[120px] h-[120px] rounded-full border-[3px] border-[#A6C33C] bg-gray-100 flex items-center justify-center overflow-hidden">
          {seminariste.photo_url ? (
            <img
              src={seminariste.photo_url}
              alt={seminariste.nom}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <Users className="h-12 w-12 text-gray-400" />
            </div>
          )}
        </div>
      </div>

      {/* Badge "SEMINARISTE" */}
      <div className="mt-3 bg-[#A6C33C] text-white px-7 py-1.2 mt-[-10px] z-10 rounded-full">
        <span className="text-xs font-bold">SEMINARISTE</span>
      </div>

      {/* Nom et Prénom */}
      <div className="text-center mt-4 space-y-0.5">
        <div className="text-[22px] font-bold text-[#A6C33C] uppercase leading-tight">
          {seminariste.nom}
        </div>
        <div className="text-lg font-bold text-black uppercase leading-tight">
          {seminariste.prenom}
        </div>
      </div>

      {/* Matricule */}
      <div className="mt-3 w-[90%] border-2 border-[#A6C33C] rounded-lg px-3 py-1.5 flex justify-between items-center">
        <span className="text-xs text-gray-500">Matricule :</span>
        <span className="text-sm font-bold text-black">
          {seminariste.matricule}
        </span>
      </div>

      {/* Cadre niveau + dortoir */}
      <div className="mt-6 mb-8 w-[88%] relative">
        {/* Grand cadre dortoir */}
        <div className="border-2 border-[#A6C33C] rounded-2xl px-4 py-5 bg-white">
          {/* Badge niveau (chevauche le grand cadre) */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 border-2 border-[#A6C33C] bg-white w-[80%] rounded-lg px-8 py-1.5">
            <span className="text-sm font-bold text-black">
              {seminariste.niveau || "Universitaire"}
            </span>
          </div>

          {/* Dortoir */}
          <div className="flex justify-between items-center text-sm mt-5">
            <span className="text-black">Dortoir :</span>
            <span className="font-bold text-black">
              {seminariste.dortoir || "Salwa - Réconfort"}
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute  bottom-3 left-0 right-0 text-center">
        <span className="text-xs font-bold text-[#A6C33C]">
          https://an-nour25.vercel.app
        </span>
      </div>
    </div>
  </div>
);

// ✅ BADGE VERSO React - Design identique au PDF
const BadgeVerso = ({ seminariste }: { seminariste: Seminariste }) => (
  <div className="relative w-[400px] h-[630px] bg-white rounded-lg shadow-2xl border-4 border-[#A6C33C] overflow-hidden">
    {/* ✅ Watermark logo en arrière-plan */}
    <div className="absolute inset-0 flex items-center justify-center opacity-[0.08] pointer-events-none">
      <img
        src={logoAnnour.src}
        alt="Watermark"
        className="w-[80%] h-auto object-contain"
      />
    </div>

    {/* Contenu principal */}
    <div className="relative z-10 p-5 flex flex-col">
      {/* Header */}
      <div className="text-center space-y-0.5 mb-3">
        <div className="text-sm font-bold text-[#A6C33C]">AEEMCI</div>
        <div className="text-base font-bold text-black">SERA-EST</div>
        <div className="text-[10px] text-gray-500">
          Sous-comité Cocody I & Sous-comité Bingerville
        </div>
      </div>

      {/* Section Contacts */}
      <div className="border-2 border-[#A6C33C] rounded-xl p-4 space-y-2.5">
        <div className="text-center font-bold text-sm text-black">
          Contacts
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-black">Parents :</span>
            <span className="text-black">
              {seminariste.contact_parent || "0555990076"}
            </span>
          </div>
          {/* <div className="flex justify-between text-xs">
            <span className="text-black">Séminariste :</span>
            <span className="text-black">
              {seminariste.contact_seminariste || "0555990076"}
            </span>
          </div> */}
          <div className="flex justify-between text-xs">
            <span className="text-black">Commune :</span>
            <span className="text-black">
              {seminariste.commune_habitation || "Bingerville"}
            </span>
          </div>
        </div>
      </div>

      {/* Section Informations Médicales */}
      <div className="border-2 border-[#A6C33C] rounded-xl p-4 mt-4 space-y-2.5">
        <div className="text-center font-bold text-sm text-black">
          INFORMATIONS MÉDICALES
        </div>
        <div className="space-y-2">
          <div>
            <div className="font-bold text-xs text-black">Allergies :</div>
            <div className="text-xs text-black mt-0.5">
              {seminariste.allergie || "RAS"}
            </div>
          </div>
          <div>
            <div className="font-bold text-xs text-black">Antécédents :</div>
            <div className="text-xs text-black mt-0.5">
              {seminariste.antecedent_medical || "Néant"}
            </div>
          </div>
        </div>
      </div>

      {/* QR Code */}
      <div className="flex-1 flex items-center justify-center mt-4 mb-8">
        {qrCodes[seminariste.matricule] ? (
          <img
            src={qrCodes[seminariste.matricule]}
            alt="QR Code"
            className="w-[180px] h-[180px]"
          />
        ) : (
          <div className="w-[100px] h-[100px] border-2 border-gray-300 flex items-center justify-center">
            <span className="text-[10px] text-gray-400">QR CODE</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="absolute bottom-3 left-0 right-0 text-center">
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <CreditCard className="h-7 w-7 text-[#A6C33C]" />
              GÉNÉRATION DE BADGES AN-NOUR
            </h1>
            <p className="text-muted-foreground">
              Badges recto-verso côte à côte avec QR code
            </p>
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
                            className="border-[#A6C33C]"
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
                              className="border-[#A6C33C]"
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
                        seminariste={
                          seminaristes.find(
                            (s) => s.matricule === selectedSeminaristes[0]
                          )!
                        }
                      />
                    ) : (
                      <BadgeRecto
                        seminariste={
                          seminaristes.find(
                            (s) => s.matricule === selectedSeminaristes[0]
                          )!
                        }
                      />
                    )}
                  </div>
                ) : (
                  <div className="w-64 h-96 border-2 border-dashed rounded-xl flex items-center justify-center">
                    <div className="text-center space-y-2">
                      <CreditCard className="h-12 w-12 mx-auto text-muted-foreground" />
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
                <div className="space-y-2 pt-2">
                  <Button
                    className="w-full gap-2 bg-[#A6C33C] hover:bg-[#95B035]"
                    size="lg"
                    onClick={generatePDF}
                    disabled={selectedSeminaristes.length === 0 || generating}
                  >
                    {generating ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Génération PDF...
                      </>
                    ) : (
                      <>
                        <FileText className="h-5 w-5" />
                        Télécharger PDF ({selectedSeminaristes.length})
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
                  <div className="font-semibold mb-1">
                    ✅ Badges professionnels :
                  </div>
                  <div>• Recto-verso côte à côte</div>
                  <div>• 1 badge par page (recto + verso)</div>
                  <div>• Logo en arrière-plan subtil</div>
                  <div>• QR Code avec matricule</div>
                  <div>• Format A4 paysage</div>
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
