"use client";
import { EDITION } from "@/lib/edition";

import { DataTable, type Column } from "@/components/common/data-table";
import Field from "@/components/common/field";
import { FilterBar } from "@/components/common/filter-bar";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState, errorText } from "@/components/common/states";
import { StatusBadge } from "@/components/common/status-badge";
import {
  GeneratePanel,
  ListPanel,
  NiveauFilter,
  niveauxOf,
  PreviewPanel,
  SelectionActions,
  seminaristeColumns,
} from "@/components/documents/document-panels";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { addToSelection, applySelection, isAllSelected } from "@/lib/selection";
import { countLabel, matchesSearch } from "@/lib/table";
import { scientificApi, Seminariste } from "@/lib/api";
import logoAnnour from "@/public/ANNOUR.png";
import certBgDonateur from "@/public/cert-bg-donateur.png";
import AEEMCI from "@/public/Logo_AEEMCI.jpeg";
import jsPDF from "jspdf";
import {
  Award,
  Download,
  Printer,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

// ✅ INTERFACE STAFF
interface StaffMember {
  id: string;
  nom: string;
  prenom: string;
  fonction: string; // "Formateur", "Comité d'Organisation", "Donateur"
  telephone: string;
  selected: boolean;
}

// Couleurs (logo / charte)
const BRAND_BLUE = { r: 0x14, g: 0x32, b: 0x64 }; // #143264
const BRAND_GREEN = { r: 0xa6, g: 0xc3, b: 0x3c }; // #A6C33C
const GOLD = { r: 212, g: 175, b: 55 };

function safeRoundedRect(
  pdf: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  rx: number,
  ry: number,
  style: "S" | "F" | "FD" | "DF"
) {
  const anyPdf = pdf as any;
  if (typeof anyPdf.roundedRect === "function") {
    anyPdf.roundedRect(x, y, w, h, rx, ry, style);
  } else {
    // fallback
    pdf.rect(x, y, w, h, style as any);
  }
}

function safeSetLineDash(pdf: jsPDF, pattern: number[] = [2, 2], phase = 0) {
  const anyPdf = pdf as any;
  if (typeof anyPdf.setLineDash === "function") anyPdf.setLineDash(pattern, phase);
}

function drawCornerOrnaments(pdf: jsPDF, x: number, y: number, w: number, h: number) {
  const ox = x;
  const oy = y;
  const ix = x + w;
  const iy = y + h;
  const L = 10;

  // Top-left
  pdf.line(ox, oy + L, ox, oy);
  pdf.line(ox, oy, ox + L, oy);
  // Top-right
  pdf.line(ix - L, oy, ix, oy);
  pdf.line(ix, oy, ix, oy + L);
  // Bottom-left
  pdf.line(ox, iy - L, ox, iy);
  pdf.line(ox, iy, ox + L, iy);
  // Bottom-right
  pdf.line(ix - L, iy, ix, iy);
  pdf.line(ix, iy - L, ix, iy);
}

function drawCertificateFrameSimple(
  pdf: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number
) {
  // Fond
  pdf.setFillColor(255, 255, 255);
  pdf.rect(x, y, w, h, "F");

  // Accent bar (haut)
  pdf.setFillColor(BRAND_GREEN.r, BRAND_GREEN.g, BRAND_GREEN.b);
  pdf.rect(x, y, w, 6, "F");

  // Bordure extérieure
  pdf.setDrawColor(BRAND_BLUE.r, BRAND_BLUE.g, BRAND_BLUE.b);
  pdf.setLineWidth(1.4);
  safeRoundedRect(pdf, x + 8, y + 8, w - 16, h - 16, 4, 4, "S");

  // Bordure intérieure (pointillée)
  pdf.setDrawColor(BRAND_BLUE.r, BRAND_BLUE.g, BRAND_BLUE.b);
  pdf.setLineWidth(0.6);
  safeSetLineDash(pdf, [2, 2], 0);
  safeRoundedRect(pdf, x + 14, y + 14, w - 28, h - 28, 3, 3, "S");
  safeSetLineDash(pdf, [], 0);

  // Ornements coins
  pdf.setLineWidth(0.8);
  drawCornerOrnaments(pdf, x + 16, y + 16, w - 32, h - 32);

  // Filet bas
  pdf.setDrawColor(BRAND_GREEN.r, BRAND_GREEN.g, BRAND_GREEN.b);
  pdf.setLineWidth(1);
  pdf.line(x + 18, y + h - 16, x + w - 18, y + h - 16);
}

function addWatermarkLogo(
  pdf: jsPDF,
  logoSrc: string,
  x: number,
  y: number,
  w: number,
  h: number,
  opacity: number = 0.06
) {
  const anyPdf = pdf as any;
  try {
    pdf.saveGraphicsState();
    if (anyPdf.GState) {
      pdf.setGState(new anyPdf.GState({ opacity }));
    }
    const logoWidth = w * 0.8;
    const aspectRatio = 2517 / 1467;
    const logoHeight = logoWidth / aspectRatio;

    // IMPORTANT: logoAnnour est PNG
    pdf.addImage(
      logoSrc,
      "PNG",
      x + (w - logoWidth) / 2,
      y + (h - logoHeight) / 2,
      logoWidth,
      logoHeight
    );
  } catch {
    // watermark facultatif
  } finally {
    try {
      pdf.restoreGraphicsState();
    } catch {}
  }
}

export default function CertificatePage() {
  // STATE SEMINARISTES
  const [seminaristes, setSeminaristes] = useState<Seminariste[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const query = useDebouncedValue(searchTerm);
  const [selectedNiveau, setSelectedNiveau] = useState("tous");
  const [selectedSeminaristes, setSelectedSeminaristes] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);

  // STATE STAFF
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [newStaff, setNewStaff] = useState({
    nom: "",
    prenom: "",
    fonction: "Comité d'Organisation",
    telephone: "",
  });

  const fetchSeminaristes = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const response = await scientificApi.getSeminaristes(1, 10000);
      setSeminaristes(response.data);
    } catch (error) {
      setLoadError(errorText(error, "Chargement des séminaristes impossible"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeminaristes();
  }, []);

  const niveaux = useMemo(() => niveauxOf(seminaristes), [seminaristes]);
  const filteredSeminaristes = useMemo(() => seminaristes.filter((sem) =>
    (selectedNiveau === "tous" || sem.niveau === selectedNiveau) &&
    matchesSearch(query, [sem.nom, sem.prenom, sem.matricule])
  ), [seminaristes, query, selectedNiveau]);
  const filteredKeys = filteredSeminaristes.map((s) => s.matricule);

  // ✅ GESTION STAFF
  const handleAddStaff = () => {
    if (!newStaff.nom || !newStaff.prenom) {
      toast.warning("Nom et Prénom requis");
      return;
    }
    const staff: StaffMember = {
      id: Date.now().toString(),
      nom: newStaff.nom.toUpperCase(),
      prenom: newStaff.prenom.toUpperCase(),
      fonction: newStaff.fonction,
      telephone: newStaff.telephone,
      selected: true,
    };
    setStaffList([...staffList, staff]);
    setNewStaff({
      nom: "",
      prenom: "",
      fonction: "Comité d'Organisation",
      telephone: "",
    });
    toast.success("Membre ajouté");
  };

  const removeStaff = (id: string) => setStaffList(staffList.filter((s) => s.id !== id));

  // =================================================================================================
  // ✅ PARTICIPATION DESIGN (NOUVEAU CADRE SIMPLE + LOGOS)
  // =================================================================================================
  const drawCertificateParticipation = async (
    pdf: jsPDF,
    sem: Seminariste,
    x: number,
    y: number,
    w: number,
    h: number
  ) => {
    // Frame
    drawCertificateFrameSimple(pdf, x, y, w, h);

    // Watermark (logo An-Nour)
    addWatermarkLogo(pdf, logoAnnour.src, x, y, w, h, 0.10);

    // Header logos
    const logoSize = 24;
    const logoY = y + 22;

    try {
      // AEEMCI JPEG
      pdf.addImage(AEEMCI.src, "JPEG", x + 24, logoY, logoSize, logoSize);
    } catch {}

    const aspectRatioNour = 2517 / 1467;
    const logoHeightNour = logoSize / aspectRatioNour;
    try {
      // An-Nour PNG
      pdf.addImage(logoAnnour.src, "PNG", x + w - 24 - logoSize, logoY, logoSize, logoHeightNour);
    } catch {}

    // Center header text
    const centerX = x + w / 2;
    pdf.setTextColor(0, 0, 0);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.text("AEEMCI", centerX, y + 24, { align: "center" });

    pdf.setFontSize(8.5);
    pdf.text(
      "Association des Elèves et Etudiants Musulmans de Côte d'Ivoire",
      centerX,
      y + 30,
      { align: "center" }
    );

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8.5);
    pdf.text("Secrétariat Régional Abidjan-Est", centerX, y + 35, { align: "center" });
    pdf.text("Sous-comités de Bingerville et de Cocody 1", centerX, y + 40, { align: "center" });

    // Seminaire logo block (centré) - SUPPRIMÉ
    /*
    try {
      const semLogoW = 60;
      const semLogoH = 23;
      pdf.addImage(seminaireLogo.src, "PNG", centerX - semLogoW / 2, y + 50, semLogoW, semLogoH);
    } catch {}
    */

    // Title - Tailles agrandies
    const titleY = y + 65;
    pdf.setTextColor(BRAND_BLUE.r, BRAND_BLUE.g, BRAND_BLUE.b);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(28); // Agrandi de 24 à 28
    pdf.text("ATTESTATION", centerX, titleY, { align: "center" });

    pdf.setFontSize(20); // Agrandi de 16 à 20
    pdf.text("DE PARTICIPATION", centerX, titleY + 12, { align: "center" });

    // Décernée à - Agrandi
    pdf.setTextColor(0, 0, 0);
    pdf.setFont("helvetica", "italic");
    pdf.setFontSize(13); // Agrandi de 11 à 13
    pdf.text("Décernée à", centerX, titleY + 26, { align: "center" });

    // Name
    pdf.setTextColor(BRAND_BLUE.r, BRAND_BLUE.g, BRAND_BLUE.b);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(26);
    pdf.text(`${(sem.prenom || "").toUpperCase()} ${sem.nom.toUpperCase()}`, centerX, titleY + 42, {
      align: "center",
    });

    // Motif décoratif sous le nom (ligne ornementale avec losanges)
    const ornamentY = titleY + 47;
    const ornamentWidth = 80;
    pdf.setDrawColor(BRAND_GREEN.r, BRAND_GREEN.g, BRAND_GREEN.b);
    pdf.setLineWidth(0.8);
    // Ligne gauche
    pdf.line(centerX - ornamentWidth, ornamentY, centerX - 8, ornamentY);
    // Losange central
    pdf.setFillColor(BRAND_GREEN.r, BRAND_GREEN.g, BRAND_GREEN.b);
    const diamondSize = 3;
    pdf.triangle(centerX, ornamentY - diamondSize, centerX - diamondSize, ornamentY, centerX, ornamentY + diamondSize, "F");
    pdf.triangle(centerX, ornamentY - diamondSize, centerX + diamondSize, ornamentY, centerX, ornamentY + diamondSize, "F");
    // Ligne droite
    pdf.line(centerX + 8, ornamentY, centerX + ornamentWidth, ornamentY);

    // Helper pour dessiner une ligne de texte centré avec des segments en gras
    const drawCenteredLineSegments = (
      segments: { text: string; bold?: boolean }[],
      yLine: number
    ) => {
      pdf.setFontSize(12.5); // Agrandi de 11.5 à 12.5
      
      // Calculer la largeur totale
      let totalWidth = 0;
      const segmentWidths = segments.map(seg => {
        pdf.setFont("helvetica", seg.bold ? "bold" : "normal");
        const w = pdf.getTextWidth(seg.text);
        totalWidth += w;
        return w;
      });

      let currentX = centerX - totalWidth / 2;

      segments.forEach((seg, i) => {
        pdf.setFont("helvetica", seg.bold ? "bold" : "normal");
        pdf.text(seg.text, currentX, yLine);
        currentX += segmentWidths[i];
      });
    };

    // Body Lines - Après le nom et le motif
    pdf.setTextColor(0, 0, 0);
    const bodyY = titleY + 60; // Ajusté pour laisser place au motif
    
    // Ligne 1
    drawCenteredLineSegments([
      { text: "Pour sa participation effective à la " },
      { text: EDITION.libelle, bold: true },
      { text: " du séminaire de formation" }
    ], bodyY);

    // Ligne 2 (suite)
    drawCenteredLineSegments([
      { text: "islamique et managériale AN NOUR qui s'est tenu du " },
      { text: EDITION.dates, bold: true }
    ], bodyY + 8);
    
    // Ligne 3
    drawCenteredLineSegments([
        { text: "au " },
        { text: EDITION.lieu, bold: true },
        { text: "." }
    ], bodyY + 16);


    // Signature - Remonté et avec espace pour signature/cachet
    const sigY = y + h - 55; // Remonté significativement
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.text("PRÉSIDENT DU SOUS COMITÉ DE COCODY", x + w - 70, sigY, { align: "center" });
    
    // Espace pour signature et cachet (20mm d'espace)
    // Trait de signature
    pdf.setLineWidth(0.5);
    pdf.setDrawColor(0, 0, 0);
    pdf.line(x + w - 100, sigY + 18, x + w - 40, sigY + 18); 
    
    // Nom du signataire (après l'espace signature)
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "normal");
    pdf.text("M. Ouattara El Hadj Bachirou", x + w - 70, sigY + 24, { align: "center" });

    // Footer (date) - Repositionné à gauche en bas, aligné avec la zone de signature
    pdf.setFontSize(10);
    pdf.setTextColor(80, 80, 80);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Fait à ${EDITION.ville}, le ${EDITION.dateCloture}`, x + 22, sigY + 10);

  };

  // React Preview Participation (NOUVEAU CADRE)
  const CertificateParticipationPreview = ({ data }: { data: Seminariste }) => (
    <div className="relative w-full aspect-[297/210] bg-white pointer-events-none select-none overflow-hidden shadow-2xl border">
      {/* Accent bar top */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-[#A6C33C]" />

      {/* Outer border */}
      <div className="absolute inset-3 rounded-md border-2 border-[#143264]" />
      {/* Inner dashed */}
      <div className="absolute inset-6 rounded-md border border-dashed border-[#143264]" />

      {/* Watermark */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ opacity: 0.12, transform: "rotate(-18deg)" }}
      >
        <img src={logoAnnour.src} className="w-[80%] h-auto object-contain" alt="" />
      </div>

      {/* Content */}
      <div className="absolute inset-0 top-10 bottom-10 left-12 right-12 flex flex-col items-center">
        {/* Header row */}
        <div className="w-full flex justify-between items-start px-2">
          <div className="w-16">
            <img src={AEEMCI.src} alt="AEEMCI" className="w-full h-auto object-contain" />
          </div>

          <div className="flex-1 text-center pt-1">
            <div className="text-[12px] font-bold text-black uppercase tracking-wide">AEEMCI</div>
            <div className="text-[10px] font-bold text-black leading-tight mt-1">
              Association des Elèves et Etudiants
              <br />
              Musulmans de Côte d&apos;Ivoire
            </div>
            <div className="text-[9px] text-gray-700 mt-1">
              Secrétariat Régional Abidjan-Est
              <br />
              Sous-comités de Bingerville et de Cocody 1
            </div>
          </div>

          <div className="w-16 flex justify-end">
            <img src={logoAnnour.src} alt="An-Nour" className="w-full h-auto object-contain" />
          </div>
        </div>

        {/* Seminaire logo - SUPPRIMÉ */ }
        {/* <div className="w-full mt-4 mb-2 flex justify-center items-center">
          <div className="w-48">
            <img src={seminaireLogo.src} className="w-full h-auto" alt="Seminaire An Nour" />
          </div>
        </div> */}   

        {/* Title */}
        <div className="text-center mt-24">
          <h1 className="text-4xl font-extrabold text-[#143264] tracking-wide">ATTESTATION</h1>
          <h2 className="text-lg font-bold text-[#143264] uppercase tracking-widest mt-1">
            DE PARTICIPATION
          </h2>
        </div>

        {/* Recipient */}
        <div className="text-center mt-5">
          <p className="text-sm font-medium text-black italic mb-2">Décernée à</p>
          <h3 className="text-4xl font-extrabold text-[#143264] uppercase tracking-wide px-4">
            {data.prenom} {data.nom}
          </h3>
        </div>

        {/* Body */}
        <div className="text-center mt-6 px-8 max-w-[88%]">
          <p className="text-[13px] leading-relaxed font-medium text-gray-900">
            Pour sa participation effective à la <span className="font-bold">{EDITION.libelle}</span> du séminaire de formation islamique et managériale AN NOUR qui s&apos;est tenu du <span className="font-bold">{EDITION.dates}</span> au <span className="font-bold">{EDITION.lieu}</span> .
          </p>
        </div>

        {/* Signature Section - Remontée avec espace pour signature/cachet */}
        <div className="absolute bottom-12 right-2 flex flex-col items-center min-w-[200px]">
          <div className="text-[10px] font-bold text-black uppercase">PRÉSIDENT DU SOUS COMITÉ DE COCODY</div>
          {/* Espace pour signature et cachet */}
          <div className="h-10"></div>
          <div className="w-48 h-[0.5px] bg-black mb-1"></div>
          <div className="text-sm font-medium text-black">M. Ouattara El Hadj Bachirou</div>
        </div>

        {/* Footer (date) - Positionnée à gauche, alignée avec la zone de signature */}
        <div className="absolute bottom-16 left-2 text-[11px] text-gray-600">
          Fait à {EDITION.ville}, le {EDITION.dateCloture}
        </div>
      </div>
    </div>
  );

  // =================================================================================================
  // 🟡 REMERCIEMENT DESIGN (CADRE SIMPLE + RUBAN + SCEAU + LOGOS)
  // =================================================================================================
  const getRemerciementRichText = (fonction: string): { text: string; bold?: boolean }[] => {
    const common = [
      { text: "au " },
      { text: "Séminaire de Formation Islamique et Managériale (An-Nour)", bold: true },
      { text: ", organisé du " },
      { text: EDITION.dates, bold: true },
      { text: " au " },
      { text: EDITION.lieu, bold: true },
    ];

    switch (fonction) {
      case "Formateur":
        return [
          { text: "Pour sa remarquable contribution pédagogique et son dévouement dans l'encadrement des participants " },
          ...common,
          { text: ", en reconnaissance de son apport scientifique et de son engagement au service de la transmission du savoir islamique et managérial." }
        ];
      case "Donateur":
        return [
          { text: "En reconnaissance de son généreux soutien et de sa précieuse contribution à la réussite du " },
          ...common,
          { text: ", témoignage de son engagement constant au service du savoir, du développement et du rayonnement de la communauté." }
        ];
      default:
        return [
          { text: "En reconnaissance de son engagement constant, de son sens de l'organisation et de son dévouement exemplaire ayant largement contribué à la réussite du " },
          ...common,
          { text: ". Témoignage de son esprit d'équipe, de sa rigueur et de son service désintéressé au profit de la communauté." }
        ];
    }
  };

  /* ========================================================= */
  /*  DESIGN SPECIFIQUE: DONATEURS (OU TOUS REMERCIEMENTS)     */
  /* ========================================================= */
  const drawCertificateRemerciement = async (
    pdf: jsPDF,
    staff: StaffMember,
    x: number,
    y: number,
    w: number,
    h: number
  ) => {
    // Si c'est un Donateu (ou si on veut appliquer ce design à tous les remerciements ?)
    // Le user a dit "voici le model des donateurs".
    // On va appliquer ce design SPECIFIQUE si fonction === "Donateur"
    // MAIS pour l'instant, le code précédent appliquait un design générique.
    // On va switcher sur le design.
    
    const isDonateur = staff.fonction === "Donateur";

    if (isDonateur) {
        // --- DESIGN DONATEUR (Vert / Watercolor) ---
        try {
            // Fond image Donateur
            pdf.addImage(certBgDonateur.src, "PNG", x, y, w, h);
        } catch (e) {
            // Fallback si l'image plante
            pdf.setFillColor(255, 255, 255);
            pdf.rect(x, y, w, h, "F");
        }
        
        // Pas de watermark supplémentaire car déjà dans l'image de fond ?
        // L'image de fond générée "cert_bg_donateur" a déjà les tâches vertes, la barre bleue, le ruban bleu.
        // Elle a aussi le Sceau ? Oui dans la génération j'ai demandé de garder le sceau.
        // Donc on écrit juste par dessus.

        // Logos Header
        const logoSize = 18;
        const logoY = y + 15;
        
        // AEEMCI (Gauche, un peu décalé car barre bleue à gauche)
        try {
          pdf.addImage(AEEMCI.src, "JPEG", x + 25, logoY, logoSize, logoSize);
        } catch {}

        // An-Nour (Droite, avant le ruban)
        const aspectRatioNour = 2517 / 1467;
        const logoHeightNour = logoSize / aspectRatioNour;
        try {
            // Ruban environ 30px à droite. On se met à gauche du ruban.
           pdf.addImage(logoAnnour.src, "PNG", x + w - 50, logoY, logoSize, logoHeightNour);
        } catch {}

        // Header Text
        const centerX = x + w / 2;
        pdf.setTextColor(0, 0, 0);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(9);
        pdf.text("AEEMCI", centerX, y + 18, { align: "center" });
        
        pdf.setFontSize(8);
        pdf.text("Association des Elèves et Etudiants Musulmans de Côte d'Ivoire", centerX, y + 23, { align: "center" });
        pdf.setFont("helvetica", "normal");
        pdf.text("Secrétariat Régional Abidjan-Est", centerX, y + 27, { align: "center" });
        pdf.text("Sous-comités de Bingerville et de Cocody 1", centerX, y + 31, { align: "center" });

        // SEMINAIRE LOGO (Centré) - SUPPRIMÉ
        /*
        try {
            const semLogoW = 60; 
            const semLogoH = 23;
            // Centre par rapport à la page, ajustement Y
            pdf.addImage(seminaireLogo.src, "PNG", centerX - semLogoW / 2, y + 45, semLogoW, semLogoH);
        } catch {}
        */

        // TITRE
        // Centré
        const titleY = y + 85;
        pdf.setTextColor(20, 50, 100); // Bleu foncé
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(28);
        pdf.text("ATTESTATION", centerX, titleY, { align: "center" });
        pdf.setFontSize(18);
        pdf.text("DE REMERCIEMENT", centerX, titleY + 10, { align: "center" });

        // Décerné à
        pdf.setTextColor(0, 0, 0);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(10);
        pdf.text("Décerné à", centerX, titleY + 22, { align: "center" });

        // NOM
        pdf.setTextColor(20, 50, 100);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(24);
        pdf.text(`${staff.prenom.toUpperCase()} ${staff.nom.toUpperCase()}`, centerX, titleY + 35, { align: "center" });

        // Corps du texte HTML-like manual break logic would be complex. 
        // We will use the Helper drawCenteredLineSegments you added earlier (need to make sure it's accessible here)
        // Accessing the helper defined in drawCertificateParticipation is not possible directly if it's inside that function.
        // CHECK: drawCenteredLineSegments was defined INSIDE drawCertificateParticipation in previous step.
        // We need to move it OUT or redefine it. 
        // Since I cannot easily move it out in this chunk without viewing more, I will redefine a local simpler version/
        
        const drawRichLine = (segments: { text: string; bold?: boolean }[], yLine: number) => {
           pdf.setFontSize(11);
           let totalWidth = 0;
           const widths = segments.map(s => {
               pdf.setFont("helvetica", s.bold ? "bold" : "normal");
               const w = pdf.getTextWidth(s.text);
               totalWidth += w;
               return w;
           });
           let cx = centerX - totalWidth / 2;
           segments.forEach((s, i) => {
               pdf.setFont("helvetica", s.bold ? "bold" : "normal");
               pdf.text(s.text, cx, yLine);
               cx += widths[i];
           });
        };

        const bodyY = titleY + 50;
        const spacing = 6;

        // Manually breaking lines for Donateur (approx)
        // "En reconnaissance de son généreux soutien et de sa précieuse contribution à la réussite du"
        drawRichLine([{ text: "En reconnaissance de son généreux soutien et de sa précieuse contribution à la réussite du" }], bodyY);
        
        // "Séminaire de Formation Islamique et Managériale (An-Nour), organisé du 20 au 25 décembre 2025"
        drawRichLine([
            { text: "Séminaire de Formation Islamique et Managériale (An-Nour)", bold: true },
            { text: ", organisé du " },
            { text: EDITION.dates, bold: true }
        ], bodyY + spacing);

        // "au Lycée Moderne de Cocody, témoignage de son engagement constant au service du"
        drawRichLine([
             { text: "au " },
             { text: EDITION.lieu, bold: true },
             { text: ", témoignage de son engagement constant au service du" }
        ], bodyY + spacing * 2);

        // "savoir, du développement et du rayonnement de la communauté."
        drawRichLine([{ text: "savoir, du développement et du rayonnement de la communauté." }], bodyY + spacing * 3);

        // Signature Manager Général (droite, bas)
        // Attention au ruban/sceau
        // Signature Manager Général (droite, bas)
        const sigY = y + h - 30;
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "bold");
        pdf.text("PRÉSIDENT DU SOUS COMITÉ DE COCODY", x + w - 80, sigY, { align: "center" });
        
        // trait
        pdf.setLineWidth(0.5);
        pdf.setDrawColor(0, 0, 0);
        pdf.line(x + w - 110, sigY + 2, x + w - 50, sigY + 2);

        pdf.setFontSize(11);
        pdf.setFont("helvetica", "normal");
        pdf.text("M. Ouattara El Hadj Bachirou", x + w - 80, sigY + 7, { align: "center" });

    } else {
        // --- DESIGN AUTRES (Comité, Formateur) -> Reprise ancien design "Cadre Simple" ---
        
        // Frame
        drawCertificateFrameSimple(pdf, x, y, w, h);

        // Watermark (logo An-Nour)
        addWatermarkLogo(pdf, logoAnnour.src, x, y, w, h, 0.05);

        // Ruban à droite
        const ribbonW = 26;
        pdf.setFillColor(BRAND_BLUE.r, BRAND_BLUE.g, BRAND_BLUE.b);
        pdf.rect(x + w - 18 - ribbonW, y + 8, ribbonW, h - 16, "F");
        // "Queue" en bas
        pdf.setFillColor(255, 255, 255);
        pdf.triangle(
            x + w - 18 - ribbonW, y + h - 8,
            x + w - 18 - ribbonW + ribbonW/2, y + h - 18,
            x + w - 18, y + h - 8,
            "F"
        );

        // Sceau doré
        const sealX = x + w - 18 - ribbonW/2;
        const sealY = y + h - 58;
        const sealR = 16;
        pdf.setFillColor(GOLD.r, GOLD.g, GOLD.b);
        pdf.circle(sealX, sealY, sealR, "F");
        pdf.setDrawColor(255, 255, 255);
        pdf.setLineWidth(1);
        pdf.circle(sealX, sealY, sealR - 2, "S");
        pdf.setLineWidth(0.5);
        pdf.circle(sealX, sealY, sealR - 5, "S");

        // Header logos
        const logoSize = 20;
        const logoY = y + 20;

        try {
            pdf.addImage(AEEMCI.src, "JPEG", x + 24, logoY, logoSize, logoSize);
        } catch {}

        const aspectRatioNour = 2517 / 1467;
        const logoHeightNour = logoSize / aspectRatioNour;
        try {
            // On le place sans toucher le ruban
            pdf.addImage(logoAnnour.src, "PNG", x + w - 24 - ribbonW - 20, logoY, logoSize, logoHeightNour);
        } catch {}

        // Header text 
        const centerX = x + w / 2 - 10;
        pdf.setTextColor(0, 0, 0);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(10);
        pdf.text("AEEMCI", centerX, y + 24, { align: "center" });

        pdf.setFontSize(8.5);
        pdf.text("Association des Elèves et Etudiants Musulmans de Côte d'Ivoire", centerX, y + 30, { align: "center" });

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8.5);
        pdf.text("Secrétariat Régional Abidjan-Est", centerX, y + 35, { align: "center" });
        pdf.text("Sous-comités de Bingerville et de Cocody 1", centerX, y + 40, { align: "center" });

        // Title
        pdf.setTextColor(BRAND_BLUE.r, BRAND_BLUE.g, BRAND_BLUE.b);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(30);
        pdf.text("ATTESTATION", centerX, y + 82, { align: "center" });
        pdf.setFontSize(20);
        pdf.text("DE REMERCIEMENT", centerX, y + 92, { align: "center" });

        // Décerné à
        pdf.setTextColor(0, 0, 0);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(11);
        pdf.text("Décernée à", centerX, y + 105, { align: "center" });

        // Name
        pdf.setTextColor(BRAND_BLUE.r, BRAND_BLUE.g, BRAND_BLUE.b);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(26);
        pdf.text(`${staff.prenom.toUpperCase()} ${staff.nom.toUpperCase()}`, centerX, y + 120, { align: "center" });

        // Body
        // Redefine helper locally as well
        const drawRichLine = (segments: { text: string; bold?: boolean }[], yLine: number) => {
           pdf.setFontSize(11.2);
           let totalWidth = 0;
           const widths = segments.map(s => {
               pdf.setFont("helvetica", s.bold ? "bold" : "normal");
               const w = pdf.getTextWidth(s.text);
               totalWidth += w;
               return w;
           });
           let cx = centerX - totalWidth / 2;
           segments.forEach((s, i) => {
               pdf.setFont("helvetica", s.bold ? "bold" : "normal");
               pdf.text(s.text, cx, yLine);
               cx += widths[i];
           });
        };

        const bodyY = y + 135;
        const spacing = 6;

        if (staff.fonction === "Formateur") {
            // Formateur text split
             drawRichLine([{ text: "Pour sa remarquable contribution pédagogique et son dévouement dans l'encadrement des" }], bodyY);
             drawRichLine([
                 { text: "participants au " },
                 { text: "Séminaire de Formation Islamique et Managériale (An-Nour)", bold: true },
                 { text: "," }
             ], bodyY + spacing);
             
             drawRichLine([
                 { text: "organisé du " },
                 { text: EDITION.dates, bold: true },
                 { text: " au " },
                 { text: EDITION.lieu, bold: true },
                 { text: ", en reconnaissance de son" } 
             ], bodyY + spacing * 2);

             drawRichLine([{ text: "apport scientifique et de son engagement au service de la transmission du savoir" }], bodyY + spacing * 3);
             drawRichLine([{ text: "islamique et managérial." }], bodyY + spacing * 4);

        } else {
             // Default (Comité/Autre) text split
             // "En reconnaissance de son engagement constant, de son sens de l'organisation et de son dévouement"
             drawRichLine([{ text: "En reconnaissance de son engagement constant, de son sens de l'organisation et de son" }], bodyY);
             drawRichLine([
                 { text: "dévouement exemplaire ayant largement contribué à la réussite du " },
                 { text: "Séminaire de" } // cut for length?
             ], bodyY + spacing);
             
             // "Formation Islamique et Managériale (An-Nour), organisé du 20 au 25 décembre 2025"
             drawRichLine([
                 { text: "Formation Islamique et Managériale (An-Nour)", bold: true },
                 { text: ", organisé du " },
                 { text: EDITION.dates, bold: true }
             ], bodyY + spacing * 2);

             // "au Lycée Moderne de Cocody. Témoignage de son esprit d'équipe, de sa rigueur et"
             drawRichLine([
                 { text: "au " },
                 { text: EDITION.lieu, bold: true },
                 { text: ". Témoignage de son esprit d'équipe, de sa rigueur et" }
             ], bodyY + spacing * 3);

             drawRichLine([{ text: "de son service désintéressé au profit de la communauté." }], bodyY + spacing * 4);
        }

        // Footer (date)
        pdf.setFontSize(10);
        pdf.setTextColor(80, 80, 80);
        pdf.text(`Fait à ${EDITION.ville}, le ${EDITION.dateCloture}`, x + 22, y + h - 22);

        // Footer (date)
        pdf.setFontSize(10);
        pdf.setTextColor(80, 80, 80);
        pdf.text(`Fait à ${EDITION.ville}, le ${EDITION.dateCloture}`, x + 22, y + h - 22);

        // Signature
        const sigY = y + h - 35;
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "bold");
        pdf.text("PRÉSIDENT DU SOUS COMITÉ DE COCODY", x + w - 92, sigY, { align: "center" });
        
        // trait
        pdf.setLineWidth(0.5);
        pdf.setDrawColor(0, 0, 0);
        pdf.line(x + w - 122, sigY + 2, x + w - 62, sigY + 2);

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(11);
        pdf.text("M. Ouattara El Hadj Bachirou", x + w - 92, sigY + 7, { align: "center" });
    }
  };

  // React Preview Remerciement (NOUVEAU CADRE + CONDITIONAL DONATEUR)
  const CertificateRemerciementPreview = ({ data }: { data: StaffMember }) => {
    const isDonateur = data.fonction === "Donateur";

    if (isDonateur) {
        return (
            <div className="relative w-full aspect-[297/210] bg-white text-center shadow-xl overflow-hidden border">
                {/* BG Image Donateur */}
                <div className="absolute inset-0">
                    <img src={certBgDonateur.src} className="w-full h-full object-cover" alt="" />
                </div>

                {/* Content */}
                <div className="absolute inset-0 flex flex-col items-center px-10 py-10 pr-24">
                     {/* Logos */}
                    <div className="w-full flex justify-between items-start">
                        <img src={AEEMCI.src} className="h-14 w-14 object-contain" alt="AEEMCI" />
                        <img src={logoAnnour.src} className="h-14 w-auto object-contain" alt="An-Nour" />
                    </div>

                    <div className="mt-2 text-[12px] font-bold">AEEMCI</div>
                    <div className="text-[10px] font-bold leading-tight">
                        Association des Elèves et Etudiants Musulmans de Côte d&apos;Ivoire
                    </div>
                    <div className="text-[9px] text-gray-700 mt-1">
                        Secrétariat Régional Abidjan-Est <br />
                        Sous-comités de Bingerville et de Cocody 1
                    </div>

                    {/* Seminaire logo - SUPPRIMÉ */}
                    {/* <div className="w-full mt-4 mb-2 flex justify-center items-center">
                         <div className="w-48">
                              <img src={seminaireLogo.src} className="w-full h-auto" alt="Seminaire An Nour" />
                         </div>
                    </div> */}

                    <div className="mt-20">
                        <h1 className="text-5xl font-extrabold text-[#143264] tracking-wide">ATTESTATION</h1>
                        <h2 className="text-xl font-bold text-[#143264] uppercase tracking-widest mt-1">
                            DE REMERCIEMENT
                        </h2>
                    </div>

                    <p className="text-sm mt-3 italic">Décernée à</p>
                    
                    <div className="text-3xl font-extrabold text-[#143264] mt-2 uppercase">
                        {data.prenom} {data.nom}
                    </div>

                    <p className="text-[12.5px] mt-4 leading-relaxed max-w-[92%] text-gray-900">
                    <div className="text-[12.5px] mt-4 leading-relaxed max-w-[92%] text-gray-900">
                        {getRemerciementRichText(data.fonction).map((part, i) => (
                          <span key={i} className={part.bold ? "font-bold" : ""}>
                            {part.text}
                          </span>
                        ))}
                    </div>
                    </p>

                    <div className="absolute bottom-6 right-16 flex flex-col items-center">
                        <div className="text-[10px] font-bold uppercase mb-1">PRÉSIDENT DU SOUS COMITÉ DE COCODY</div>
                        <div className="w-48 h-[0.5px] bg-black mb-1"></div>
                        <div className="text-sm">M. Ouattara El Hadj Bachirou</div>
                    </div>
                </div>
            </div>
        );
    }

    // Default Design (Comité / Formateur)
    return (
     <div className="relative w-full aspect-[297/210] bg-white text-center shadow-xl overflow-hidden border">
        {/* Accent bar top */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-[#A6C33C]" />
        {/* ... (Existing Default Design) ... */}

        <div className="mt-2 text-[12px] font-bold">AEEMCI</div>
        <div className="text-[10px] font-bold leading-tight">
          Association des Elèves et Etudiants Musulmans de Côte d&apos;Ivoire
        </div>
        <div className="text-[9px] text-gray-700 mt-1">
          Secrétariat Régional Abidjan-Est <br />
          Sous-comités de Bingerville et de Cocody 1
        </div>

        {/* Seminaire logo (for default design) - SUPPRIMÉ */}
        {/* <div className="w-full mt-4 mb-2 flex justify-center items-center">
          <div className="w-48">
             <img src={seminaireLogo.src} className="w-full h-auto" alt="Seminaire An Nour" />
          </div>
        </div> */}

        <div className="mt-24">
          <h1 className="text-5xl font-extrabold text-[#143264] tracking-wide">ATTESTATION</h1>
          <h2 className="text-xl font-bold text-[#143264] uppercase tracking-widest mt-1">
            DE REMERCIEMENT
          </h2>
        </div>

        <p className="text-sm mt-5 italic">Décernée à</p>

        <div className="text-4xl font-extrabold text-[#143264] mt-2 uppercase">
          {data.prenom} {data.nom}
        </div>

        <div className="text-[12.5px] mt-6 leading-relaxed max-w-[92%] text-gray-900">
            {getRemerciementRichText(data.fonction).map((part, i) => (
                <span key={i} className={part.bold ? "font-bold" : ""}>
                {part.text}
                </span>
            ))}
        </div>

        <div className="absolute bottom-4 left-2 text-[11px] text-gray-600">
          Fait à {EDITION.ville}, le {EDITION.dateCloture}
        </div>

        <div className="absolute bottom-6 right-32">
          <div className="text-sm border-b border-black pb-1">Manager Général</div>
        </div>
      </div>

  );
};

  // =================================================================================================
  // ✅ GENERATE FUNCTIONS
  // =================================================================================================
  const generateCertificates = async () => {
    if (selectedSeminaristes.length === 0) return toast.warning("Sélectionnez au moins un séminariste");
    try {
      setGenerating(true);
      toast.info("Génération Attestations de Participation...");
      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const w = 297;
      const h = 210;
      let isFirst = true;

      for (const matricule of selectedSeminaristes) {
        const sem = seminaristes.find((s) => s.matricule === matricule);
        if (!sem) continue;
        if (!isFirst) pdf.addPage();
        isFirst = false;
        await drawCertificateParticipation(pdf, sem, 0, 0, w, h);
      }

      pdf.save(`attestations-participation-${new Date().toISOString().split("T")[0]}.pdf`);
      toast.success("Succès !");
    } catch (e) {
      console.error(e);
      toast.error("Erreur génération");
    } finally {
      setGenerating(false);
    }
  };

  const generateStaffCertificates = async () => {
    const selectedStaff = staffList.filter((s) => s.selected);
    if (selectedStaff.length === 0) return toast.warning("Sélectionnez au moins un membre");
    try {
      setGenerating(true);
      toast.info("Génération Attestations de Remerciement...");
      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const w = 297;
      const h = 210;
      let isFirst = true;

      for (const staff of selectedStaff) {
        if (!isFirst) pdf.addPage();
        isFirst = false;
        await drawCertificateRemerciement(pdf, staff, 0, 0, w, h);
      }

      pdf.save(`attestations-remerciement-${new Date().toISOString().split("T")[0]}.pdf`);
      toast.success("Succès !");
    } catch (e) {
      console.error(e);
      toast.error("Erreur génération");
    } finally {
      setGenerating(false);
    }
  };

  const filteredOut = selectedNiveau !== "tous" || !!query.trim();
  const resetFilters = () => {
    setSearchTerm("");
    setSelectedNiveau("tous");
  };
  const firstSelected = seminaristes.find((s) => s.matricule === selectedSeminaristes[0]);
  const count = selectedSeminaristes.length;
  const selectedStaff = staffList.filter((s) => s.selected);
  const plural = (n: number) => (n > 1 ? "s" : "");

  const staffColumns: Column<StaffMember>[] = [
    { id: "nom", header: "Nom et prénom", cell: (s) => <span className="font-medium">{s.nom} {s.prenom}</span>, sortValue: (s) => `${s.nom} ${s.prenom}` },
    { id: "fonction", header: "Type d'attestation", cell: (s) => <StatusBadge icon={null}>{s.fonction}</StatusBadge>, sortValue: (s) => s.fonction },
    { id: "telephone", header: "Téléphone", cell: (s) => s.telephone || "—", hideBelow: "md" },
    {
      id: "actions", header: <span className="sr-only">Actions</span>, align: "right",
      cell: (s) => (
        <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive-soft hover:text-destructive"
          aria-label={`Retirer ${s.nom} ${s.prenom} de la liste`} onClick={() => removeStaff(s.id)}>
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </Button>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <PageHeader
        title="Attestations"
        description="Attestations de participation des séminaristes et de remerciement du comité, des formateurs et des donateurs."
      />

      <Tabs defaultValue="seminaristes" className="gap-4">
        <TabsList className="w-full sm:w-fit">
          <TabsTrigger value="seminaristes">Séminaristes</TabsTrigger>
          <TabsTrigger value="staff">Comité, formateurs et donateurs</TabsTrigger>
        </TabsList>

        <TabsContent value="seminaristes">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="min-w-0 lg:col-span-2">
              <ListPanel title="Séminaristes" description="Cochez les séminaristes qui recevront une attestation de participation.">
                <FilterBar
                  search={searchTerm}
                  onSearchChange={setSearchTerm}
                  searchLabel="Rechercher un séminariste"
                  searchPlaceholder="Nom, prénom ou matricule…"
                  filters={<NiveauFilter value={selectedNiveau} onChange={setSelectedNiveau} niveaux={niveaux} />}
                  activeFilters={selectedNiveau !== "tous" ? [{ label: `Niveau : ${selectedNiveau}`, onRemove: () => setSelectedNiveau("tous") }] : []}
                  onReset={resetFilters}
                  count={seminaristes.length > 0 ? countLabel(filteredSeminaristes.length, seminaristes.length, "séminariste", "séminaristes") : undefined}
                  actions={
                    <SelectionActions
                      filteredCount={filteredKeys.length}
                      allFilteredSelected={isAllSelected(selectedSeminaristes, filteredKeys)}
                      selectedCount={count}
                      onSelectFiltered={() => setSelectedSeminaristes((prev) => addToSelection(prev, filteredKeys))}
                      onClear={() => setSelectedSeminaristes([])}
                    />
                  }
                />
                <DataTable
                  caption="Séminaristes à sélectionner pour les attestations"
                  columns={seminaristeColumns<Seminariste>()}
                  rows={filteredSeminaristes}
                  getRowKey={(s) => s.matricule}
                  loading={loading}
                  error={loadError}
                  onRetry={fetchSeminaristes}
                  pageSize={25}
                  selection={{
                    selected: new Set(selectedSeminaristes),
                    onChange: (next) => setSelectedSeminaristes((prev) => applySelection(prev, next)),
                    label: (s) => `${s.nom} ${s.prenom ?? ""}`.trim(),
                  }}
                  empty={
                    <EmptyState
                      icon={Users}
                      title={filteredOut ? "Aucun résultat" : "Aucun séminariste"}
                      message={filteredOut ? "Aucun séminariste ne correspond à ces filtres." : "Aucun séminariste n'est encore inscrit."}
                      action={filteredOut ? <Button variant="outline" onClick={resetFilters}>Réinitialiser les filtres</Button> : undefined}
                    />
                  }
                />
              </ListPanel>
            </div>

            <div className="space-y-6">
              <PreviewPanel title="Aperçu de l'attestation" emptyIcon={Award} emptyMessage="Sélectionnez un séminariste pour afficher l'aperçu.">
                {firstSelected ? (
                  <div className="scale-75 origin-top border shadow">
                    <CertificateParticipationPreview data={firstSelected} />
                  </div>
                ) : null}
              </PreviewPanel>
              <GeneratePanel
                label={`Télécharger ${count} attestation${plural(count)} (PDF)`}
                icon={Download}
                count={count}
                generating={generating}
                onGenerate={generateCertificates}
                notes={["Attestation de participation", "A4 paysage, une attestation par page"]}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="staff">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="min-w-0 space-y-6 lg:col-span-2">
              <ListPanel title="Ajouter un bénéficiaire" description="La liste reste dans cette page : elle n'est pas enregistrée.">
                <form
                  className="space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleAddStaff();
                  }}
                >
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field id="cert-nom" label="Nom *">
                      {(f) => <Input {...f} value={newStaff.nom} onChange={(e) => setNewStaff({ ...newStaff, nom: e.target.value })} />}
                    </Field>
                    <Field id="cert-prenom" label="Prénom *">
                      {(f) => <Input {...f} value={newStaff.prenom} onChange={(e) => setNewStaff({ ...newStaff, prenom: e.target.value })} />}
                    </Field>
                    <Field id="cert-fonction" label="Type d'attestation">
                      {(f) => (
                        <Select value={newStaff.fonction} onValueChange={(v) => setNewStaff({ ...newStaff, fonction: v })}>
                          <SelectTrigger {...f} className="w-full"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Comité d'Organisation">Comité d&apos;organisation (remerciement)</SelectItem>
                            <SelectItem value="Formateur">Formateur (contribution pédagogique)</SelectItem>
                            <SelectItem value="Donateur">Donateur (soutien)</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </Field>
                    <Field id="cert-telephone" label="Téléphone (facultatif)">
                      {(f) => <Input {...f} type="tel" value={newStaff.telephone} onChange={(e) => setNewStaff({ ...newStaff, telephone: e.target.value })} />}
                    </Field>
                  </div>
                  <Button type="submit" variant="outline">
                    <UserPlus aria-hidden="true" /> Ajouter à la liste
                  </Button>
                </form>
              </ListPanel>

              <ListPanel title="Bénéficiaires" description={staffList.length > 0 ? `${staffList.length} dans la liste, ${selectedStaff.length} sélectionné${plural(selectedStaff.length)}` : undefined}>
                <DataTable
                  caption="Bénéficiaires des attestations de remerciement"
                  columns={staffColumns}
                  rows={staffList}
                  getRowKey={(s) => s.id}
                  selection={{
                    selected: new Set(selectedStaff.map((s) => s.id)),
                    onChange: (next) => setStaffList(staffList.map((s) => ({ ...s, selected: next.has(s.id) }))),
                    label: (s) => `${s.nom} ${s.prenom}`,
                  }}
                  empty={<EmptyState icon={UserPlus} title="Liste vide" message="Ajoutez un bénéficiaire avec le formulaire ci-dessus." />}
                />
              </ListPanel>
            </div>

            <div className="space-y-6">
              <PreviewPanel title="Aperçu de l'attestation" emptyIcon={Award} emptyMessage="Sélectionnez un bénéficiaire pour afficher l'aperçu.">
                {selectedStaff.length > 0 ? (
                  <div className="scale-75 origin-top border shadow">
                    <CertificateRemerciementPreview data={selectedStaff[0]} />
                  </div>
                ) : null}
              </PreviewPanel>
              <GeneratePanel
                label={`Générer ${selectedStaff.length} attestation${plural(selectedStaff.length)} (PDF)`}
                icon={Printer}
                count={selectedStaff.length}
                generating={generating}
                onGenerate={generateStaffCertificates}
                notes={["Attestation de remerciement selon le type choisi", "A4 paysage, une attestation par page"]}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
