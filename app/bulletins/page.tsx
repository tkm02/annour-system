"use client";

import DashboardLayout from "@/components/layout/dashboard-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Bulletin, Note, scientificApi, Seminariste } from "@/lib/api";
import logoAnnour from "@/public/ANNOUR.png";
import AEEMCI from "@/public/Logo_AEEMCI.jpeg";
import jsPDF from "jspdf";
import {
  Download,
  Eye,
  FileText,
  Loader2,
  Printer,
  RefreshCw,
  Search,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface SeminaristeWithNotes extends Seminariste {
  notes?: { [key: string]: number };
}

export default function BulletinGenerationPage() {
  const [seminaristes, setSeminaristes] = useState<SeminaristeWithNotes[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedNiveau, setSelectedNiveau] = useState("tous");
  const [selectedSeminaristes, setSelectedSeminaristes] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [numberOfNotes, setNumberOfNotes] = useState(4);

  const [previewBulletin, setPreviewBulletin] = useState<Bulletin | null>(null);

  // ✅ FETCH SEMINARISTES WITH NOTES
  const fetchSeminaristes = async () => {
    try {
      setLoading(true);
      const [semResponse, notesResponse] = await Promise.all([
        scientificApi.getSeminaristes(1, 10000),
        scientificApi.getNotes(),
      ]);

      // Grouper les notes par matricule
      const notesByMatricule: Record<string, Record<string, number>> = {};
      notesResponse.forEach((note: Note) => {
        if (!notesByMatricule[note.matricule]) {
          notesByMatricule[note.matricule] = {};
        }
        notesByMatricule[note.matricule][note.libelle] = note.note;
      });

      // Associer les notes aux séminaristes
      const semWithNotes = semResponse.data.map((sem: Seminariste) => ({
        ...sem,
        notes: notesByMatricule[sem.matricule] || {},
      }));

      setSeminaristes(semWithNotes);
    } catch (error: any) {
      toast.error(error.message || "Erreur chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeminaristes();
  }, []);

  // ✅ Generate preview for first selected
  useEffect(() => {
    const generatePreview = async () => {
      if (selectedSeminaristes.length > 0) {
        const matricule = selectedSeminaristes[0];
        const sem = seminaristes.find((s) => s.matricule === matricule);
        if (sem) {
          try {
            const bulletin = await scientificApi.generateBulletin({
              matricule,
              annee_scolaire: "AnNour25",
            });
            setPreviewBulletin(bulletin);
          } catch (err) {
            // Ignore preview errors
          }
        }
      } else {
        setPreviewBulletin(null);
      }
    };
    generatePreview();
  }, [selectedSeminaristes, seminaristes]);

  // ✅ FILTRES
  const niveaux = Array.from(
    new Set(seminaristes.map((s) => s.niveau).filter(Boolean))
  );

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

  // ✅ GÉNÉRER PDF - FORMAT PAYSAGE
  const generatePDF = async () => {
    if (selectedSeminaristes.length === 0) {
      toast.warning("⚠️ Sélectionnez au moins un séminariste");
      return;
    }

    try {
      setGenerating(true);
      toast.info(`📄 Génération de ${selectedSeminaristes.length} bulletin(s)...`);

      const pdf = new jsPDF({
        orientation: "landscape",  // ✅ FORMAT PAYSAGE
        unit: "mm",
        format: "a4",
      });

      let isFirstPage = true;

      for (const matricule of selectedSeminaristes) {
        const sem = seminaristes.find((s) => s.matricule === matricule);
        if (!sem) continue;

        try {
          const bulletin = await scientificApi.generateBulletin({
            matricule,
            annee_scolaire: "AnNour25",
          });

          if (!isFirstPage) {
            pdf.addPage();
          }
          isFirstPage = false;

          await drawBulletinLandscape(pdf, bulletin, sem);
        } catch (err: any) {
          if (!isFirstPage) {
            pdf.addPage();
          }
          isFirstPage = false;
          await drawBulletinLandscapeLocal(pdf, sem);
        }
      }

      pdf.save(`bulletins-annour-${new Date().toISOString().split("T")[0]}.pdf`);
      toast.success(`✅ ${selectedSeminaristes.length} bulletin(s) générés`);
    } catch (error: any) {
      toast.error(error.message || "Erreur génération");
    } finally {
      setGenerating(false);
    }
  };

  // ✅ DESSINER BULLETIN FORMAT PAYSAGE A4 (297 x 210 mm)
  const drawBulletinLandscape = async (
    pdf: jsPDF,
    bulletin: Bulletin,
    sem: SeminaristeWithNotes
  ) => {
    const pageWidth = 297;
    const pageHeight = 210;
    const margin = 8;

    // ✅ Background lime green pale
    pdf.setFillColor(230, 240, 200);
    pdf.rect(0, 0, pageWidth, pageHeight, "F");

    // ═══════════════════════════════════════════════════════════════
    // HEADER - Logos + Titre
    // ═══════════════════════════════════════════════════════════════
    const logoSize = 22;
    
    // Logo AEEMCI (gauche)
    try {
      pdf.addImage(AEEMCI.src, "JPEG", margin, margin, logoSize, logoSize);
    } catch (e) {}

    // Logo An-Nour (droite)
    try {
      const annourWidth = 22;
      const annourHeight = 13;
      pdf.addImage(logoAnnour.src, "PNG", pageWidth - margin - annourWidth, margin, annourWidth, annourHeight);
    } catch (e) {}

    // Texte header central
    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0, 128, 128);
    pdf.text("AEEMCI", pageWidth / 2, 14, { align: "center" });

    pdf.setFontSize(8);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(0, 0, 0);
    pdf.text("Association des Elèves et Etudiants Musulmans de Côte d'Ivoire", pageWidth / 2, 20, { align: "center" });
    pdf.text("Secrétariat Régional Abidjan Est • Sous-comité de Bingerville et de Cocody 1", pageWidth / 2, 25, { align: "center" });

    // Titre principal
    pdf.setFontSize(20);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0, 128, 128);
    pdf.text("BULLETIN DE SEMINARISTE", pageWidth / 2, 38, { align: "center" });

    let currentY = 48;

    // ═══════════════════════════════════════════════════════════════
    // SECTION PRINCIPALE - 3 colonnes
    // ═══════════════════════════════════════════════════════════════
    const sectionHeight = 50;
    const col1Width = 100;  // Photo + Nom
    const col2Width = 65;   // Niveau/Année
    const col3Width = 110;  // Moyenne/Rang + Signature

    // ───────────────────────────────────────────────────────────────
    // COLONNE 1: Photo + Nom & Prénom + Matricule
    // ───────────────────────────────────────────────────────────────
    pdf.setDrawColor(0, 128, 128);
    pdf.setLineWidth(0.8);
    pdf.roundedRect(margin, currentY, col1Width, sectionHeight, 3, 3);

    // Photo (avec image si disponible)
    const photoW = 35;
    const photoH = 42;
    const photoX = margin + 5;
    const photoY = currentY + 4;
    
    pdf.setFillColor(220, 220, 220);
    pdf.rect(photoX, photoY, photoW, photoH, "F");
    pdf.setDrawColor(0, 128, 128);
    pdf.rect(photoX, photoY, photoW, photoH);
    
    // Essayer de charger la photo du séminariste
    if (sem.photo_url) {
      try {
        pdf.addImage(sem.photo_url, "JPEG", photoX, photoY, photoW, photoH);
      } catch (e) {
        // Photo placeholder text
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.text("Photo", photoX + photoW / 2, photoY + photoH / 2, { align: "center" });
      }
    } else {
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text("Photo", photoX + photoW / 2, photoY + photoH / 2, { align: "center" });
    }

    // Nom et Prénom
    const textX = margin + 42;
    const fullName = `${bulletin.nom_seminariste || sem.nom} ${bulletin.prenom_seminariste || sem.prenom}`.toUpperCase();
    
    pdf.setFontSize(13);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0, 128, 128);
    
    // Séparer si trop long
    const nameParts = fullName.split(" ");
    if (nameParts.length > 2 && fullName.length > 20) {
      pdf.text(nameParts.slice(0, 2).join(" "), textX, currentY + 15);
      pdf.text(nameParts.slice(2).join(" "), textX, currentY + 22);
    } else {
      pdf.text(fullName, textX, currentY + 18);
    }

    // Matricule
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(60, 60, 60);
    pdf.text(bulletin.matricule || sem.matricule, textX, currentY + 35);

    // ───────────────────────────────────────────────────────────────
    // COLONNE 2: Niveau + Année
    // ───────────────────────────────────────────────────────────────
    const col2X = margin + col1Width + 5;
    pdf.setDrawColor(0, 128, 128);
    pdf.roundedRect(col2X, currentY, col2Width, sectionHeight, 3, 3);

    // Niveau label
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(100, 100, 100);
    pdf.text("Niveau :", col2X + 5, currentY + 10);
    
    // Niveau value (avec cadre)
    pdf.setDrawColor(0, 128, 128);
    // pdf.roundedRect(col2X + 5, currentY + 13, col2Width - 10, 12, 2, 2);
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0, 128, 128);
    const niveauText = bulletin.niveau || sem.niveau || "N/A";
    pdf.text(niveauText, col2X + 35, currentY + 15, { align: "center" });

    // Année label + value
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(100, 100, 100);
    pdf.text("Année :", col2X + 5, currentY + 34);
    
    pdf.setDrawColor(0, 128, 128);
    // pdf.roundedRect(col2X + 25, currentY + 28, 30, 12, 2, 2);
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0, 128, 128);
    pdf.text("Annour2025", col2X + 32, currentY + 34, { align: "center" });

    // ───────────────────────────────────────────────────────────────
    // COLONNE 3: Moyenne + Rang + Signature
    // ───────────────────────────────────────────────────────────────
    const col3X = col2X + col2Width + 5;
    pdf.setDrawColor(0, 128, 128);
    pdf.roundedRect(col3X, currentY, col3Width, sectionHeight, 3, 3);

    // Moyenne
    pdf.setFontSize(9);
    pdf.setTextColor(100, 100, 100);
    pdf.text("Moyenne :", col3X + 8, currentY + 12);
    
    pdf.setDrawColor(0, 128, 128);
    // pdf.roundedRect(col3X + 30, currentY + 5, 25, 15, 3, 3);
    pdf.setFontSize(18);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0, 128, 128);
    pdf.text(bulletin.moyenne_generale?.toFixed(2) || "—", col3X + 32, currentY + 12, { align: "center" });

    // Rang
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(100, 100, 100);
    pdf.text("Rang :", col3X + 8, currentY + 35);
    
    pdf.setDrawColor(0, 128, 128);
    // pdf.roundedRect(col3X + 25, currentY + 25, 22, 12, 2, 2);
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0, 128, 128);
    pdf.text(bulletin.rang ? `${bulletin.rang}e` : "—", col3X + 22, currentY + 35, { align: "center" });

    // Cachet/Signature zone
    pdf.setFontSize(7);
    pdf.setFont("helvetica", "italic");
    pdf.setTextColor(100, 100, 100);
    pdf.text("OUATTARA EL HADJI BACHIROU", col3X + 60   , currentY + 28);
    pdf.text("Président du sous-comité de Cocody 1", col3X + 60, currentY + 33);

    currentY += sectionHeight + 8;

    // ═══════════════════════════════════════════════════════════════
    // SECTION NOTES + OBSERVATIONS (2 colonnes)
    // ═══════════════════════════════════════════════════════════════
    const notesWidth = 130;
    const obsWidth = pageWidth - margin * 2 - notesWidth - 5;
    const notesHeight = 85;

    // ───────────────────────────────────────────────────────────────
    // NOTES
    // ───────────────────────────────────────────────────────────────
    pdf.setDrawColor(0, 128, 128);
    pdf.setLineWidth(0.8);
    pdf.roundedRect(margin, currentY, notesWidth, notesHeight, 4, 4);

    // Titre NOTES
    pdf.setFillColor(230, 240, 200);
    pdf.roundedRect(margin + 45, currentY - 4, 40, 8, 2, 2, "F");
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0, 0, 0);
    pdf.text("NOTES", margin + 65, currentY + 2, { align: "center" });

    // Liste des notes
    const notes = sem.notes || {};
    let noteY = currentY + 18;
    const noteColWidth = 60; // Approximate width for columns if we have many

    // Dynamic grid for notes: 2 columns if straightforward
    for (let i = 1; i <= numberOfNotes; i++) {
        const noteKey = `note${i}`;
        const noteValue = notes[noteKey]; // number | undefined
        // If undefined, we display "0,00"
        const displayValue = (noteValue !== undefined) 
           ? noteValue.toFixed(2).replace(".", ",") 
           : "0,00";

        // Layout logic: 2 columns
        // 1, 3, 5... -> Left column
        // 2, 4, 6... -> Right column
        const isRightCol = (i % 2 === 0);
        
        // Calculate Row Index (0-based) = floor((i-1)/2)
        const rowIndex = Math.floor((i - 1) / 2);

        const colOffset = isRightCol ? noteColWidth + 10 : 0;
        const rowOffset = rowIndex * 10; // slightly tighter spacing to fit more
        const baseY = noteY;

        pdf.setFontSize(12); // Slightly smaller to fit potentially more notes
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(0, 0, 0);
        pdf.text(`Note ${i} :`, margin + 10 + colOffset, baseY + rowOffset);

        pdf.setFontSize(12);
        pdf.setTextColor(0, 128, 128);
        pdf.text(displayValue, margin + 30 + colOffset, baseY + rowOffset);
    }

    // ───────────────────────────────────────────────────────────────
    // OBSERVATIONS
    // ───────────────────────────────────────────────────────────────
    const obsX = margin + notesWidth + 5;
    pdf.setDrawColor(0, 128, 128);
    pdf.roundedRect(obsX, currentY, obsWidth, notesHeight, 4, 4);

    // Titre OBSERVATIONS
    pdf.setFillColor(230, 240, 200);
    pdf.roundedRect(obsX + 40, currentY - 4, 60, 8, 2, 2, "F");
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0, 0, 0);
    pdf.text("OBSERVATIONS", obsX + 70, currentY + 2, { align: "center" });

    // Logo watermark
    try {
      pdf.saveGraphicsState();
      pdf.setGState(new (pdf as any).GState({ opacity: 0.12 }));
      pdf.addImage(logoAnnour.src, "PNG", obsX + 25, currentY + 15, 90, 55);
      pdf.restoreGraphicsState();
    } catch (e) {}

    // Mention
    if (bulletin.mention) {
      pdf.setFontSize(18);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(0, 128, 128);
      pdf.text(bulletin.mention, obsX + obsWidth / 2, currentY + 50, { align: "center" });
    }

    currentY += notesHeight + 10;

    // ═══════════════════════════════════════════════════════════════
    // FOOTER
    // ═══════════════════════════════════════════════════════════════
    pdf.setDrawColor(0, 128, 128);
    pdf.setLineWidth(1);
    pdf.line(margin + 60, pageHeight - 15, pageWidth - margin - 60, pageHeight - 15);

    pdf.setFontSize(12);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0, 128, 128);
    pdf.text("AEEMCI, pour une identité islamique !", pageWidth / 2, pageHeight - 8, { align: "center" });
  };

  // ✅ Fallback sans API
  const drawBulletinLandscapeLocal = async (pdf: jsPDF, sem: SeminaristeWithNotes) => {
    const pageWidth = 297;
    const pageHeight = 210;
    const margin = 8;

    pdf.setFillColor(230, 240, 200);
    pdf.rect(0, 0, pageWidth, pageHeight, "F");

    try {
      pdf.addImage(AEEMCI.src, "JPEG", margin, margin, 22, 22);
    } catch (e) {}

    try {
      pdf.addImage(logoAnnour.src, "PNG", pageWidth - margin - 22, margin, 22, 13);
    } catch (e) {}

    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0, 128, 128);
    pdf.text("AEEMCI", pageWidth / 2, 14, { align: "center" });

    pdf.setFontSize(20);
    pdf.text("BULLETIN DE SEMINARISTE", pageWidth / 2, 38, { align: "center" });

    // Nom + Prénom
    pdf.setFontSize(16);
    pdf.setTextColor(0, 0, 0);
    pdf.text(`${sem.nom} ${sem.prenom}`.toUpperCase(), pageWidth / 2, 70, { align: "center" });
    
    pdf.setFontSize(12);
    pdf.text(sem.matricule, pageWidth / 2, 82, { align: "center" });

    // Notes locales si disponibles
    const notes = sem.notes || {};
    let noteY = 100;
    for (let i = 1; i <= numberOfNotes; i++) {
      const noteKey = `note${i}`;
      const noteValue = notes[noteKey];
      const displayValue = (noteValue !== undefined) ? noteValue.toFixed(2) : "0.00";
      
      pdf.setFontSize(14);
      pdf.text(`Note ${i}: ${displayValue}`, pageWidth / 2, noteY, { align: "center" });
      noteY += 15;
    }

    // Footer
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0, 128, 128);
    pdf.text("AEEMCI, pour une identité islamique !", pageWidth / 2, pageHeight - 10, { align: "center" });
  };

  // ✅ BULLETIN PREVIEW COMPONENT
  const BulletinPreview = ({ seminariste, bulletin, numberOfNotes }: { seminariste: SeminaristeWithNotes; bulletin: Bulletin | null; numberOfNotes: number }) => {
     // Dimensions mimicking A4 Landscape
     // We'll use a fixed width scale for the preview, e.g. 800px width, and calculate height based on A4 ratio (297/210 = ~1.414)
     // Height = 800 / 1.414 = ~565px
     
     return (
    <div className="w-[840px] h-[594px] bg-[#E6F0C8] text-[#008080] font-sans relative shadow-2xl overflow-hidden p-[20px] mx-auto text-xs">
      
      {/* HEADER */}
      <div className="flex justify-between items-start mb-2">
        {/* Left Logo */}
        <img src={AEEMCI.src} alt="AEEMCI" className="w-16 h-16 object-contain" />
        
        {/* Center Text */}
        <div className="text-center">
            <h1 className="text-xl font-bold">AEEMCI</h1>
            <p className="text-[10px] text-black">Association des Elèves et Etudiants Musulmans de Côte d'Ivoire</p>
            <p className="text-[10px] text-black">Secrétariat Régional Abidjan Est • Sous-comité de Bingerville et de Cocody 1</p>
            <h2 className="text-2xl font-bold mt-3">BULLETIN DE SEMINARISTE</h2>
        </div>

        {/* Right Logo */}
        <img src={logoAnnour.src} alt="ANNOUR" className="w-16 h-10 object-contain" />
      </div>

      {/* MAIN CONTENT GRID (3 Columns) */}
      <div className="grid grid-cols-[300px_180px_300px] gap-4 mb-4 justify-center">
        
        {/* COL 1: Photo + Identité */}
        <div className="border border-[#008080] rounded pt-2 pb-2 px-2 flex gap-3 items-center">
             {/* Photo Placeholder/Image */}
             <div className="w-[100px] h-[120px] bg-gray-200 border border-[#008080] flex items-center justify-center shrink-0">
                 {seminariste.photo_url ? (
                     <img src={seminariste.photo_url} alt="Photo" className="w-full h-full object-cover" />
                 ) : (
                    <Users className="text-gray-400 w-8 h-8" />
                 )}
             </div>
             
             {/* Text Info */}
             <div className="flex flex-col justify-center w-full">
                 <div className="font-bold text-lg leading-tight uppercase">
                    {bulletin?.nom_seminariste || seminariste.nom} {bulletin?.prenom_seminariste || seminariste.prenom}
                 </div>
                 <div className="text-gray-600 mt-2 text-sm">{bulletin?.matricule || seminariste.matricule}</div>
             </div>
        </div>

        {/* COL 2: Niveau + Année */}
        <div className="border border-[#008080] rounded p-2 flex flex-col justify-between text-center">
            <div>
                <span className="text-gray-500 block text-[10px]">Niveau :</span>
                {/* <div className="border border-[#008080] rounded px-2 py-1 inline-block mt-1 font-bold"> */}
                   <span className="text-lg font-bold">{bulletin?.niveau || seminariste.niveau || "N/A"}</span>
                {/* </div> */}
            </div>
            <div>
                <span className="text-gray-500 block text-[10px]">Année :</span>
                {/* <div className="border border-[#008080] rounded px-2 py-1 inline-block mt-1 font-bold"> */}
                    <span className="text-xl font-bold">Annour2025</span>
                {/* </div> */}
            </div>
        </div>

        {/* COL 3: Moyenne + Rang + Signature */}
        <div className="border border-[#008080] rounded p-2 flex flex-col justify-between text-center relative">
             <div className="flex justify-around items-start">
                 <div>
                    <span className="text-gray-500 block text-[10px]">Moyenne :</span>
                    {/* <div className="border border-[#008080] rounded p-1 font-bold text-xl mt-1 min-w-[60px]"> */}
                       <span className="text-3xl font-bold">{bulletin?.moyenne_generale?.toFixed(2) || "—"}</span>
                    {/* </div> */}
                 </div>
                 <div>
                    <span className="text-gray-500 block text-[10px]">Rang :</span>
                    {/* <div className="border border-[#008080] rounded p-1 font-bold text-lg mt-1 min-w-[50px]"> */}
                        <span className="text-2xl font-bold">{bulletin?.rang ? `${bulletin.rang}e` : "—"}</span>
                    {/* </div> */}
                 </div>
             </div>
             
             <div className="text-right text-[10px] text-gray-500 italic mt-auto">
                 <p>OUATTARA EL HADJI BACHIROU</p>
                 <p>Président du sous-comité de Cocody 1</p>
             </div>
        </div>
      </div>

      {/* NOTES & OBSERVATIONS GRID */}
      <div className="grid grid-cols-[380px_1fr] gap-4 h-[240px]">
          
          {/* NOTES */}
          <div className="border border-[#008080] rounded p-2 relative pt-6">
              <div className="absolute -top-3 left-16 bg-[#E6F0C8] px-4 font-bold text-black border border-[#E6F0C8]">NOTES</div>
              
              <div className="grid grid-cols-2 gap-x-8 gap-y-3 px-4">
                  {Array.from({ length: numberOfNotes }, (_, i) => i + 1).map((i) => (
                    <div key={i} className="flex justify-between items-center text-sm">
                      <span className="font-bold text-black">Note {i} :</span>
                      <span className="font-bold text-[#008080]">
                        {seminariste.notes?.[`note${i}`] !== undefined 
                          ? seminariste.notes[`note${i}`].toFixed(2).replace(".", ",") 
                          : "0,00"}
                      </span>
                    </div>
                  ))}
              </div>
          </div>

          {/* OBSERVATIONS */}
          <div className="border border-[#008080] rounded p-2 relative pt-6 flex flex-col items-center justify-center text-center">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#E6F0C8] px-4 font-bold text-black">OBSERVATIONS</div>
              
               {/* Watermark in background */}
               <div className="absolute inset-0 flex items-center justify-center opacity-[0.12] pointer-events-none">
                    <img src={logoAnnour.src} alt="" className="w-40 h-auto" />
               </div>

               {bulletin?.mention && (
                 <div className="text-3xl font-bold relative z-10">
                     {bulletin.mention}
                 </div>
               )}
          </div>
      </div>

      {/* FOOTER */}
      <div className="absolute bottom-4 left-0 right-0 text-center">
          <div className="w-[80%] h-px bg-[#008080] mx-auto mb-2"></div>
          <p className="font-bold text-sm">AEEMCI, pour une identité islamique !</p>
      </div>

    </div>
  )};

  // ✅ LOADING
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
              <FileText className="h-7 w-7 text-[#008080]" />
              GÉNÉRATION DE BULLETINS AN-NOUR
            </h1>
            <p className="text-muted-foreground">
              Bulletins de fin de séminaire avec notes et moyennes
            </p>
          </div>
        </div>

        {/* Main Grid - Same as Badge Page */}
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
                      {niveaux.map((niveau) => (
                        <SelectItem key={niveau} value={niveau || ""}>
                          {niveau}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" onClick={fetchSeminaristes}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">Nombre de notes:</span>
                    <Input
                        type="number"
                        min={1}
                        max={10}
                        value={numberOfNotes}
                        onChange={(e) => setNumberOfNotes(parseInt(e.target.value) || 4)}
                        className="w-20"
                    />
                </div>

                <div className="border rounded-lg max-h-[500px] overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background">
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            className="border-[#008080]"
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
                        <TableHead className="text-center">NOTES</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSeminaristes.map((sem) => {
                        const notesCount = Object.keys(sem.notes || {}).length;
                        return (
                          <TableRow key={sem.id}>
                            <TableCell>
                              <Checkbox
                                className="border-[#008080]"
                                checked={selectedSeminaristes.includes(sem.matricule)}
                                onCheckedChange={() => handleSelectOne(sem.matricule)}
                              />
                            </TableCell>
                            <TableCell className="font-mono font-semibold">
                              {sem.matricule}
                            </TableCell>
                            <TableCell>
                              <div className="font-semibold">{sem.nom}</div>
                              <div className="text-sm text-muted-foreground">{sem.prenom}</div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{sem.niveau || "Non classé"}</Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              {notesCount > 0 ? (
                                <Badge className="bg-green-500">{notesCount}</Badge>
                              ) : (
                                <Badge variant="secondary">0</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
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
                <CardTitle className="text-lg flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Aperçu Bulletin
                </CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center">
                {selectedSeminaristes.length > 0 ? (
                  <div className="scale-[0.40] origin-top">
                    <BulletinPreview
                      seminariste={seminaristes.find((s) => s.matricule === selectedSeminaristes[0])!}
                      bulletin={previewBulletin}
                      numberOfNotes={numberOfNotes}
                    />
                  </div>
                ) : (
                  <div className="w-64 h-96 border-2 border-dashed rounded-xl flex items-center justify-center">
                    <div className="text-center space-y-2">
                      <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
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
                    className="w-full gap-2 bg-[#008080] hover:bg-[#006666]"
                    size="lg"
                    onClick={generatePDF}
                    disabled={selectedSeminaristes.length === 0 || generating}
                  >
                    {generating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Génération en cours...
                      </>
                    ) : (
                      <>
                        <Printer className="h-4 w-4" />
                        Générer {selectedSeminaristes.length} Bulletin(s)
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
