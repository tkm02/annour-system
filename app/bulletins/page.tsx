"use client";
import { EDITION } from "@/lib/edition";
import { ApiError, bulletinsApi } from "@/lib/api";

import { DataTable, type Column } from "@/components/common/data-table";
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
import { Label } from "@/components/ui/label";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { addToSelection, applySelection, isAllSelected } from "@/lib/selection";
import { countLabel, matchesSearch } from "@/lib/table";
import { Bulletin, Note, scientificApi, Seminariste } from "@/lib/api";
import logoAnnour from "@/public/ANNOUR.png";
import AEEMCI from "@/public/Logo_AEEMCI.jpeg";
import jsPDF from "jspdf";
import {
  FileText,
  Printer,
  RefreshCw,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

interface SeminaristeWithNotes extends Seminariste {
  notes?: { [key: string]: number };
}

export default function BulletinGenerationPage() {
  const [seminaristes, setSeminaristes] = useState<SeminaristeWithNotes[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const query = useDebouncedValue(searchTerm);
  const [selectedNiveau, setSelectedNiveau] = useState("tous");
  const [selectedSeminaristes, setSelectedSeminaristes] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [numberOfNotes, setNumberOfNotes] = useState(4);

  const [previewBulletin, setPreviewBulletin] = useState<Bulletin | null>(null);
  const [generationErrors, setGenerationErrors] = useState<string[]>([]);
  const [recalculating, setRecalculating] = useState(false);

  // F-A4 : après correction de notes, recalcul des moyennes et rangs de toute l'année
  const recalculerAnnee = async () => {
    try {
      setRecalculating(true);
      const r = await bulletinsApi.recalculer(EDITION.anneeScolaire);
      toast.success(
        `${r.bulletins} bulletin(s) : ${r.moyennes_modifiees} moyenne(s) et ${r.rangs_modifies} rang(s) mis à jour`
      );
      if (r.incomplets.length > 0) {
        setGenerationErrors(r.incomplets.map((m) => `${m} : notes devenues incomplètes, rang retiré`));
      }
    } catch (error: any) {
      toast.error(error.message || "Recalcul impossible");
    } finally {
      setRecalculating(false);
    }
  };

  // ✅ FETCH SEMINARISTES WITH NOTES
  const fetchSeminaristes = async () => {
    try {
      setLoading(true);
      setLoadError(null);
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
        if (note.libelle) notesByMatricule[note.matricule][note.libelle] = note.note;
      });

      // Associer les notes aux séminaristes
      const semWithNotes = semResponse.data.map((sem: Seminariste) => ({
        ...sem,
        notes: notesByMatricule[sem.matricule] || {},
      }));

      setSeminaristes(semWithNotes);
    } catch (error) {
      setLoadError(errorText(error, "Chargement des séminaristes impossible"));
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
            // Lecture seule : l'aperçu montre le bulletin déjà généré (aucune écriture à la sélection)
            const { data } = await bulletinsApi.list({ matricule, annee_scolaire: EDITION.anneeScolaire, limit: 1 });
            setPreviewBulletin(data[0] ?? null);
          } catch {
            setPreviewBulletin(null);
          }
        }
      } else {
        setPreviewBulletin(null);
      }
    };
    generatePreview();
  }, [selectedSeminaristes, seminaristes]);

  // ✅ FILTRES
  const niveaux = useMemo(() => niveauxOf(seminaristes), [seminaristes]);

  const filteredSeminaristes = useMemo(() => seminaristes.filter((sem) =>
    (selectedNiveau === "tous" || sem.niveau === selectedNiveau) &&
    matchesSearch(query, [sem.nom, sem.prenom, sem.matricule])
  ), [seminaristes, query, selectedNiveau]);
  const filteredKeys = filteredSeminaristes.map((s) => s.matricule);

  // ✅ GÉNÉRER PDF - FORMAT PAYSAGE
  const generatePDF = async () => {
    if (selectedSeminaristes.length === 0) {
      toast.warning("Sélectionnez au moins un séminariste");
      return;
    }

    try {
      setGenerating(true);
      toast.info(`Génération de ${selectedSeminaristes.length} bulletin(s)...`);

      const pdf = new jsPDF({
        orientation: "landscape",  // ✅ FORMAT PAYSAGE
        unit: "mm",
        format: "a4",
      });

      let isFirstPage = true;
      const echecs: string[] = [];
      let generes = 0;

      for (const matricule of selectedSeminaristes) {
        const sem = seminaristes.find((s) => s.matricule === matricule);
        if (!sem) continue;

        try {
          const bulletin = await scientificApi.generateBulletin({
            matricule,
            annee_scolaire: EDITION.anneeScolaire,
          });

          if (!isFirstPage) {
            pdf.addPage();
          }
          isFirstPage = false;

          // Rang calculé par le serveur (ex æquo possibles : 1, 1, 3) : jamais renuméroté ici
          await drawBulletinLandscape(pdf, bulletin, sem);
          generes += 1;
        } catch (err: any) {
          // 422 : notes incomplètes (detail = notes manquantes) ; 404 : aucune note
          const raison = err instanceof ApiError && err.status === 404 ? "aucune note enregistrée" : err?.message || "erreur";
          echecs.push(`${sem.nom} ${sem.prenom ?? ""} (${matricule}) : ${raison}`);
        }
      }

      if (generes > 0) {
        pdf.save(`bulletins-annour-${new Date().toISOString().split("T")[0]}.pdf`);
        toast.success(`${generes} bulletin(s) généré(s)`);
      }
      if (echecs.length > 0) {
        setGenerationErrors(echecs);
        toast.error(`${echecs.length} bulletin(s) non généré(s) : notes à compléter`);
      } else {
        setGenerationErrors([]);
      }
      if (previewBulletin === null && selectedSeminaristes.length > 0) {
        bulletinsApi.list({ matricule: selectedSeminaristes[0], annee_scolaire: EDITION.anneeScolaire, limit: 1 })
          .then(({ data }) => setPreviewBulletin(data[0] ?? null)).catch(() => {});
      }
    } catch (error: any) {
      toast.error(error.message || "Erreur génération");
    } finally {
      setGenerating(false);
    }
  };

  // ✅ DESSINER BULLETIN FORMAT PAYSAGE A4 (297 x 210 mm) - NOUVEAU DESIGN 3 BLOCS
  const drawBulletinLandscape = async (
    pdf: jsPDF,
    bulletin: Bulletin,
    sem: SeminaristeWithNotes
  ) => {
    const pageWidth = 297;
    const pageHeight = 210;
    const margin = 12;
    const contentWidth = pageWidth - margin * 2;
    const borderRadius = 5;

    // ✅ Fonction pour calculer la mention selon la note
    const getMentionForNote = (note: number): string => {
      if (note >= 18) return "Excellent";
      if (note >= 16) return "Très Bien";
      if (note >= 14) return "Bien";
      if (note >= 12) return "Assez Bien";
      if (note >= 10) return "Passable";
      return "Insuffisant";
    };

    // ✅ Background blanc
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, pageWidth, pageHeight, "F");

    // ✅ Watermark Logo An-Nour (centre, faible opacité)
    try {
      pdf.saveGraphicsState();
      pdf.setGState(new (pdf as any).GState({ opacity: 0.06 }));
      const watermarkW = 140;
      const watermarkH = 80;
      pdf.addImage(logoAnnour.src, "PNG", (pageWidth - watermarkW) / 2, (pageHeight - watermarkH) / 2, watermarkW, watermarkH);
      pdf.restoreGraphicsState();
    } catch (e) {}

    // ═══════════════════════════════════════════════════════════════
    // HEADER - Logos + Titre
    // ═══════════════════════════════════════════════════════════════
    const logoSize = 20;
    
    // Logo AEEMCI (gauche)
    try {
      pdf.addImage(AEEMCI.src, "JPEG", margin, margin - 2, logoSize, logoSize);
    } catch (e) {}

    // Logo An-Nour (droite)
    try {
      const annourWidth = 20;
      const annourHeight = 12;
      pdf.addImage(logoAnnour.src, "PNG", pageWidth - margin - annourWidth, margin, annourWidth, annourHeight);
    } catch (e) {}

    // Texte header central
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0, 128, 128);
    pdf.text("AEEMCI", pageWidth / 2, 12, { align: "center" });

    pdf.setFontSize(7);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(60, 60, 60);
    pdf.text("Association des Elèves et Etudiants Musulmans de Côte d'Ivoire", pageWidth / 2, 17, { align: "center" });
    pdf.text("Secrétariat Régional Abidjan-Est", pageWidth / 2, 21, { align: "center" });
    pdf.text("Sous-comités de Bingerville et de Cocody 1", pageWidth / 2, 25, { align: "center" });

    // Titre principal
    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0, 128, 128);
    pdf.text("BULLETIN DE SÉMINARISTE", pageWidth / 2, 32, { align: "center" });

    let currentY = 38;

    // ═══════════════════════════════════════════════════════════════
    // BLOC 1 - INFORMATIONS SÉMINARISTE (Horizontal, pleine largeur)
    // ═══════════════════════════════════════════════════════════════
    const bloc1Height = 52;
    
    pdf.setDrawColor(0, 128, 128);
    pdf.setLineWidth(0.8);
    pdf.roundedRect(margin, currentY, contentWidth, bloc1Height, borderRadius, borderRadius);

    // Photo (avec correction orientation via Canvas)
    const photoW = 34;
    const photoH = 42;
    const photoX = margin + 6;
    const photoY = currentY + 5;
    
    pdf.setFillColor(240, 240, 240);
    pdf.roundedRect(photoX, photoY, photoW, photoH, 2, 2, "F");
    pdf.setDrawColor(0, 128, 128);
    pdf.roundedRect(photoX, photoY, photoW, photoH, 2, 2);
    
    if (sem.photo_url) {
      try {
        // ✅ Correction de l'orientation avec Canvas
        const loadAndOrientImage = (): Promise<string> => {
          return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => {
              // Créer un canvas pour redessiner l'image (auto-orientation)
              const canvas = document.createElement("canvas");
              canvas.width = img.width;
              canvas.height = img.height;
              const ctx = canvas.getContext("2d");
              if (ctx) {
                ctx.drawImage(img, 0, 0);
                resolve(canvas.toDataURL("image/jpeg", 0.9));
              } else {
                reject(new Error("Canvas context null"));
              }
            };
            img.onerror = () => reject(new Error("Image load failed"));
            img.src = sem.photo_url!;
          });
        };
        
        const orientedImageData = await loadAndOrientImage();
        pdf.addImage(orientedImageData, "JPEG", photoX, photoY, photoW, photoH);
      } catch (e) {
        console.error("Photo load error:", e);
        pdf.setFontSize(7);
        pdf.setTextColor(150, 150, 150);
        pdf.text("Photo", photoX + photoW / 2, photoY + photoH / 2, { align: "center" });
      }
    } else {
      pdf.setFontSize(7);
      pdf.setTextColor(150, 150, 150);
      pdf.text("Photo", photoX + photoW / 2, photoY + photoH / 2, { align: "center" });
    }

    // Colonne 2: Matricule, Nom, Prénoms (séparés), Contact Parent - Aligné à gauche
    const col2X = margin + 48;
    const labelWidth = 24; // Largeur réduite pour les labels
    
    // Matricule
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(100, 100, 100);
    pdf.text("Matricule :", col2X, currentY + 12);
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0, 128, 128);
    pdf.text(bulletin.matricule || sem.matricule, col2X + labelWidth, currentY + 12);

    // Nom (séparé)
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(100, 100, 100);
    pdf.text("Nom :", col2X, currentY + 22);
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0, 0, 0);
    pdf.text((bulletin.nom_seminariste || sem.nom || "").toUpperCase(), col2X + labelWidth, currentY + 22);

    // Prénoms (séparé)
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(100, 100, 100);
    pdf.text("Prénoms :", col2X, currentY + 32);
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0, 0, 0);
    pdf.text((bulletin.prenom_seminariste || sem.prenom || "").toUpperCase(), col2X + labelWidth, currentY + 32);

    // Contact Parent
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(100, 100, 100);
    pdf.text("Contact :", col2X, currentY + 44);
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0, 0, 0);
    pdf.text(sem.contact_parent || "Non renseigné", col2X + labelWidth, currentY + 44);

    // Colonne 3: Niveau, Année (aligné à gauche)
    const col3X = margin + 175;
    const label3Width = 24;
    
    // Niveau
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(100, 100, 100);
    pdf.text("Niveau :", col3X, currentY + 12);
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0, 128, 128);
    pdf.text(bulletin.niveau || sem.niveau || "N/A", col3X + label3Width, currentY + 12);

    // Année séminaire
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(100, 100, 100);
    pdf.text("Année :", col3X, currentY + 24);
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0, 128, 128);
    pdf.text(`AnNour ${EDITION.annee}`, col3X + label3Width, currentY + 24);

    // Année scolaire
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(100, 100, 100);
    pdf.text("Année scolaire :", col3X, currentY + 36);
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0, 0, 0);
    pdf.text(EDITION.anneeScolaireLibelle, col3X + label3Width, currentY + 36);

    currentY += bloc1Height + 6;

    // ═══════════════════════════════════════════════════════════════
    // BLOC 2 - NOTES (Tableau avec mentions) - Gauche
    // ═══════════════════════════════════════════════════════════════
    const bloc2Width = (contentWidth - 6) * 0.55;
    const bloc2Height = 95;
    
    pdf.setDrawColor(0, 128, 128);
    pdf.setLineWidth(0.8);
    pdf.roundedRect(margin, currentY, bloc2Width, bloc2Height, borderRadius, borderRadius);

    // Titre NOTES
    pdf.setFillColor(255, 255, 255);
    pdf.roundedRect(margin + 30, currentY - 4, 50, 8, 2, 2, "F");
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0, 128, 128);
    pdf.text("ÉVALUATIONS", margin + 55, currentY + 2, { align: "center" });

    // Tableau des notes
    const tableStartY = currentY + 12;
    const tableX = margin + 4;
    const colEval = 55;
    const colNote = 25;
    const colMention = 55;
    const rowHeight = 14;

    // En-tête du tableau
    pdf.setFillColor(0, 128, 128);
    pdf.rect(tableX, tableStartY, colEval + colNote + colMention, rowHeight, "F");
    
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(255, 255, 255);
    pdf.text("Évaluation", tableX + colEval / 2, tableStartY + 9, { align: "center" });
    pdf.text("Note", tableX + colEval + colNote / 2, tableStartY + 9, { align: "center" });
    pdf.text("Mention", tableX + colEval + colNote + colMention / 2, tableStartY + 9, { align: "center" });

    // Données des notes (note_entree depuis sem, note1=Eval1, note2=Eval2, note3=Conduite)
    const notes = sem.notes || {};
    const evaluations = [
      { label: "Test d'entrée", key: "note_entree", isFromSem: true },
      { label: "Évaluation 1", key: "note1", isFromSem: false },
      { label: "Évaluation 2", key: "note2", isFromSem: false },
      { label: "Conduite", key: "note3", isFromSem: false }
    ];

    let tableY = tableStartY + rowHeight;
    evaluations.forEach((evaluation, index) => {
      // Pour note_entree, récupérer depuis sem directement, sinon depuis notes
      const noteValue = evaluation.isFromSem 
        ? (sem as any).note_entree 
        : notes[evaluation.key];
      const noteDisplay = noteValue !== undefined && noteValue !== null ? noteValue.toFixed(2) : "—";
      const mention = noteValue !== undefined && noteValue !== null ? getMentionForNote(noteValue) : "—";
      
      // Alternating row colors
      if (index % 2 === 0) {
        pdf.setFillColor(248, 248, 248);
        pdf.rect(tableX, tableY, colEval + colNote + colMention, rowHeight, "F");
      }
      
      // Borders
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.3);
      pdf.rect(tableX, tableY, colEval, rowHeight);
      pdf.rect(tableX + colEval, tableY, colNote, rowHeight);
      pdf.rect(tableX + colEval + colNote, tableY, colMention, rowHeight);
      
      // Text
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(60, 60, 60);
      pdf.text(evaluation.label, tableX + 3, tableY + 9);
      
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(0, 128, 128);
      pdf.text(noteDisplay, tableX + colEval + colNote / 2, tableY + 9, { align: "center" });
      
      // Mention avec couleur selon niveau
      let mentionColor: [number, number, number] = [100, 100, 100];
      if (noteValue !== undefined) {
        if (noteValue >= 16) mentionColor = [0, 150, 0];
        else if (noteValue >= 12) mentionColor = [0, 128, 128];
        else if (noteValue >= 10) mentionColor = [200, 150, 0];
        else mentionColor = [200, 50, 50];
      }
      pdf.setFont("helvetica", "italic");
      pdf.setTextColor(...mentionColor);
      pdf.text(mention, tableX + colEval + colNote + colMention / 2, tableY + 9, { align: "center" });
      
      tableY += rowHeight;
    });

    // ═══════════════════════════════════════════════════════════════
    // BLOC 3 - RÉSULTATS & CONSEIL (Droite)
    // ═══════════════════════════════════════════════════════════════
    const bloc3X = margin + bloc2Width + 6;
    const bloc3Width = contentWidth - bloc2Width - 6;
    
    pdf.setDrawColor(0, 128, 128);
    pdf.setLineWidth(0.8);
    pdf.roundedRect(bloc3X, currentY, bloc3Width, bloc2Height, borderRadius, borderRadius);

    // Titre
    pdf.setFillColor(255, 255, 255);
    pdf.roundedRect(bloc3X + 25, currentY - 4, 60, 8, 2, 2, "F");
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0, 128, 128);
    pdf.text("RÉSULTATS & CONSEIL", bloc3X + 55, currentY + 2, { align: "center" });

    // Moyenne et Rang côte à côte
    const statsY = currentY + 14;
    const statsBoxWidth = (bloc3Width - 16) / 2;
    
    // Box Moyenne
    pdf.setFillColor(245, 245, 245);
    pdf.roundedRect(bloc3X + 6, statsY, statsBoxWidth, 22, 3, 3, "F");
    pdf.setDrawColor(0, 128, 128);
    pdf.roundedRect(bloc3X + 6, statsY, statsBoxWidth, 22, 3, 3);
    
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(100, 100, 100);
    pdf.text("Moyenne", bloc3X + 6 + statsBoxWidth / 2, statsY + 7, { align: "center" });
    
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0, 128, 128);
    pdf.text(bulletin.moyenne_generale?.toFixed(2) || "—", bloc3X + 6 + statsBoxWidth / 2, statsY + 17, { align: "center" });

    // Box Rang
    pdf.setFillColor(245, 245, 245);
    pdf.roundedRect(bloc3X + 10 + statsBoxWidth, statsY, statsBoxWidth, 22, 3, 3, "F");
    pdf.setDrawColor(0, 128, 128);
    pdf.roundedRect(bloc3X + 10 + statsBoxWidth, statsY, statsBoxWidth, 22, 3, 3);
    
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(100, 100, 100);
    pdf.text("Rang", bloc3X + 10 + statsBoxWidth + statsBoxWidth / 2, statsY + 7, { align: "center" });
    
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0, 128, 128);
    pdf.text(bulletin.rang ? `${bulletin.rang}e` : "—", bloc3X + 10 + statsBoxWidth + statsBoxWidth / 2, statsY + 17, { align: "center" });

    // Mention globale (calculée localement avec getMentionForNote)
    const mentionY = statsY + 28;
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(100, 100, 100);
    pdf.text("Mention :", bloc3X + 8, mentionY);
    
    // ✅ Calcul local de la mention basé sur la moyenne générale
    const mentionGenerale = bulletin.moyenne_generale !== undefined && bulletin.moyenne_generale !== null
      ? getMentionForNote(bulletin.moyenne_generale)
      : "—";
    
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0, 128, 128);
    pdf.text(mentionGenerale, bloc3X + 30, mentionY);

    // Citation islamique
    const quoteY = mentionY + 8;
    pdf.setDrawColor(0, 128, 128);
    pdf.setLineWidth(1.2);
    pdf.line(bloc3X + 6, quoteY - 2, bloc3X + 6, quoteY + 18);
    
    // Première citation
    pdf.setFontSize(6);
    pdf.setFont("helvetica", "italic");
    pdf.setTextColor(60, 60, 60);
    pdf.text("« Mon Seigneur ! Accroît mon savoir ! »", bloc3X + 10, quoteY + 2);
    // Référence légère
    pdf.setFontSize(5);
    pdf.setTextColor(120, 120, 120);
    pdf.text("Sourate Ta-Ha, v.114", bloc3X + 10, quoteY + 6);
    
    // Deuxième citation
    pdf.setFontSize(6);
    pdf.setFont("helvetica", "italic");
    pdf.setTextColor(60, 60, 60);
    pdf.text("« Sont-ils égaux, ceux qui savent et ceux qui ne savent pas ? »", bloc3X + 10, quoteY + 12);
    // Référence légère
    pdf.setFontSize(5);
    pdf.setTextColor(120, 120, 120);
    pdf.text("Sourate Az-Zumar, v.9", bloc3X + 10, quoteY + 16);

    // Signature du président
    const signY = currentY + bloc2Height - 16;
    pdf.setFontSize(7);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0, 0, 0);
    pdf.text("OUATTARA EL HADJI BACHIROU", bloc3X + bloc3Width / 2, signY, { align: "center" });
    
    pdf.setFontSize(6);
    pdf.setFont("helvetica", "italic");
    pdf.setTextColor(80, 80, 80);
    pdf.text("Président du Sous-comité Cocody 1", bloc3X + bloc3Width / 2, signY + 5, { align: "center" });

    currentY += bloc2Height + 8;

    // ═══════════════════════════════════════════════════════════════
    // FOOTER
    // ═══════════════════════════════════════════════════════════════
    pdf.setDrawColor(0, 128, 128);
    pdf.setLineWidth(0.8);
    pdf.line(margin + 50, pageHeight - 12, pageWidth - margin - 50, pageHeight - 12);

    pdf.setFontSize(10);
    pdf.setFont("helvetica", "italic");
    pdf.setTextColor(0, 128, 128);
    pdf.text("AnNour, pour une spiritualité étincelante...", pageWidth / 2, pageHeight - 6, { align: "center" });
  };

  // ✅ BULLETIN PREVIEW COMPONENT - NOUVEAU DESIGN 3 BLOCS
  const BulletinPreview = ({ seminariste, bulletin, numberOfNotes }: { seminariste: SeminaristeWithNotes; bulletin: Bulletin | null; numberOfNotes: number }) => {
     // Helper function for mention
     const getMentionForNote = (note: number): string => {
       if (note >= 18) return "Excellent";
       if (note >= 16) return "Très Bien";
       if (note >= 14) return "Bien";
       if (note >= 12) return "Assez Bien";
       if (note >= 10) return "Passable";
       return "Insuffisant";
     };

     const getMentionColor = (note: number): string => {
       if (note >= 16) return "text-green-600";
       if (note >= 12) return "text-teal-600";
       if (note >= 10) return "text-yellow-600";
       return "text-red-500";
     };

     const evaluationLabels = [
       { label: "Test d'entrée", key: "note_entree", isFromSem: true },
       { label: "Évaluation 1", key: "note1", isFromSem: false },
       { label: "Évaluation 2", key: "note2", isFromSem: false },
       { label: "Conduite", key: "note3", isFromSem: false }
     ];
     
     return (
    <div className="w-[840px] h-[594px] bg-white text-[#008080] font-sans relative shadow-2xl overflow-hidden p-[28px] mx-auto text-xs">
      
      {/* WATERMARK (Logo An-Nour en arrière-plan) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.05]">
        <img src={logoAnnour.src} alt="" className="w-[350px] h-auto" />
      </div>

      {/* HEADER */}
      <div className="flex justify-between items-start mb-2 relative z-10">
        {/* Left Logo */}
        <img src={AEEMCI.src} alt="AEEMCI" className="w-14 h-14 object-contain" />
        
        {/* Center Text */}
        <div className="text-center">
            <h1 className="text-lg font-bold">AEEMCI</h1>
            <p className="text-[9px] text-gray-600">Association des Elèves et Etudiants Musulmans de Côte d&apos;Ivoire</p>
            <p className="text-[9px] text-gray-600">Secrétariat Régional Abidjan-Est</p>
            <p className="text-[9px] text-gray-600">Sous-comités de Bingerville et de Cocody 1</p>
            <h2 className="text-xl font-bold mt-2">BULLETIN DE SÉMINARISTE</h2>
        </div>

        {/* Right Logo */}
        <img src={logoAnnour.src} alt="ANNOUR" className="w-14 h-9 object-contain" />
      </div>

      {/* BLOC 1: Info Séminariste (Horizontal, pleine largeur) */}
      <div className="border-2 border-[#008080] rounded-lg p-3 mb-3 flex gap-4 relative z-10">
        {/* Photo */}
        <div className="w-[90px] h-[110px] bg-gray-100 border border-[#008080] rounded flex items-center justify-center shrink-0 overflow-hidden">
          {seminariste.photo_url ? (
            <img src={seminariste.photo_url} alt="Photo" className="w-full h-full object-cover rounded" style={{ imageOrientation: 'from-image' }} />
          ) : (
            <Users className="text-gray-400 w-8 h-8" />
          )}
        </div>
        
        {/* Info Column - Espacement réduit */}
        <div className="flex-1 flex flex-col justify-center text-sm">
          <div className="flex mb-1">
            <span className="text-gray-500 text-xs w-16">Matricule :</span>
            <span className="font-bold text-[#008080]">{bulletin?.matricule || seminariste.matricule}</span>
          </div>
          <div className="flex mb-1">
            <span className="text-gray-500 text-xs w-16">Nom :</span>
            <span className="font-bold text-black uppercase">
              {(bulletin?.nom_seminariste || seminariste.nom || "").toUpperCase()}
            </span>
          </div>
          <div className="flex mb-1">
            <span className="text-gray-500 text-xs w-16">Prénoms :</span>
            <span className="font-bold text-black uppercase">
              {(bulletin?.prenom_seminariste || seminariste.prenom || "").toUpperCase()}
            </span>
          </div>
          <div className="flex">
            <span className="text-gray-500 text-xs w-16">Contact Parent :</span>
            <span className="font-bold text-black">{seminariste.contact_parent || "Non renseigné"}</span>
          </div>
        </div>

        {/* Niveau & Année (espacement réduit) */}
        <div className="flex flex-col gap-2 justify-center text-sm">
          <div className="flex">
            <span className="text-gray-500 text-xs w-20">Niveau :</span>
            <span className="font-bold text-[#008080]">{bulletin?.niveau || seminariste.niveau || "N/A"}</span>
          </div>
          <div className="flex">
            <span className="text-gray-500 text-xs w-20">Année :</span>
            <span className="font-bold text-[#008080]">An-Nour {EDITION.annee}</span>
          </div>
          <div className="flex">
            <span className="text-gray-500 text-xs w-20">Années Scolaire :</span>
            <span className="font-bold text-black">{EDITION.anneeScolaireLibelle}</span>
          </div>
        </div>
      </div>

      {/* BLOC 2 & 3: Notes & Résultats */}
      <div className="grid grid-cols-[55%_1fr] gap-3 relative z-10" style={{ height: "260px" }}>
        
        {/* BLOC 2: Notes Table */}
        <div className="border-2 border-[#008080] rounded-lg p-2 relative pt-5">
          <div className="absolute -top-3 left-8 bg-white px-3 font-bold text-[#008080] text-sm">ÉVALUATIONS</div>
          
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#008080] text-white">
                <th className="py-2 px-2 text-left rounded-tl">Évaluation</th>
                <th className="py-2 px-2 text-center">Note</th>
                <th className="py-2 px-2 text-center rounded-tr">Mention</th>
              </tr>
            </thead>
            <tbody>
              {evaluationLabels.map((ev, idx) => {
                // Pour note_entree, récupérer depuis seminariste directement
                const noteValue = ev.isFromSem 
                  ? (seminariste as any).note_entree 
                  : seminariste.notes?.[ev.key];
                const noteDisplay = noteValue !== undefined && noteValue !== null ? noteValue.toFixed(2) : "—";
                const mention = noteValue !== undefined && noteValue !== null ? getMentionForNote(noteValue) : "—";
                const mentionColor = noteValue !== undefined && noteValue !== null ? getMentionColor(noteValue) : "text-gray-400";
                
                return (
                  <tr key={ev.key} className={idx % 2 === 0 ? "bg-gray-50" : ""}>
                    <td className="py-2 px-2 border-b border-gray-200">{ev.label}</td>
                    <td className="py-2 px-2 text-center font-bold text-[#008080] border-b border-gray-200">{noteDisplay}</td>
                    <td className={`py-2 px-2 text-center italic border-b border-gray-200 ${mentionColor}`}>{mention}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* BLOC 3: Résultats & Conseil (avec Moyenne et Rang) */}
        <div className="border-2 border-[#008080] rounded-lg p-3 relative pt-5 flex flex-col">
          <div className="absolute -top-3 left-6 bg-white px-3 font-bold text-[#008080] text-sm">RÉSULTATS & CONSEIL</div>
          
          {/* Moyenne et Rang */}
          <div className="flex gap-2 mb-3">
            <div className="flex-1 bg-gray-100 border border-[#008080] rounded-md p-2 text-center">
              <div className="text-gray-500 text-[9px]">Moyenne</div>
              <div className="text-xl font-bold text-[#008080]">{bulletin?.moyenne_generale?.toFixed(2) || "—"}</div>
            </div>
            <div className="flex-1 bg-gray-100 border border-[#008080] rounded-md p-2 text-center">
              <div className="text-gray-500 text-[9px]">Rang</div>
              <div className="text-xl font-bold text-[#008080]">{bulletin?.rang ? `${bulletin.rang}e` : "—"}</div>
            </div>
          </div>

          {/* Mention (calculée localement) */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-gray-500 text-xs">Mention :</span>
            <span className="font-bold text-[#008080]">
              {bulletin?.moyenne_generale !== undefined && bulletin?.moyenne_generale !== null
                ? getMentionForNote(bulletin.moyenne_generale)
                : "—"}
            </span>
          </div>

          {/* Citation Islamique */}
          <div className="border-l-4 border-[#008080] pl-3 py-1 bg-gray-50 rounded-r mb-auto">
            <div className="mb-2">
              <p className="text-[9px] italic text-gray-700">
                « Mon Seigneur ! Accroît mon savoir ! »
              </p>
              <p className="text-[7px] text-gray-400">Sourate Ta-Ha, v.114</p>
            </div>
            <div>
              <p className="text-[9px] italic text-gray-700">
                « Sont-ils égaux, ceux qui savent et ceux qui ne savent pas ? »
              </p>
              <p className="text-[7px] text-gray-400">Sourate Az-Zumar, v.9</p>
            </div>
          </div>

          {/* Signature */}
          <div className="text-center mt-2 pt-1 border-t border-gray-200">
            <p className="font-bold text-black text-[10px]">OUATTARA EL HADJI BACHIROU</p>
            <p className="text-[9px] italic text-gray-500">Président du Sous-comité Cocody 1</p>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="absolute bottom-3 left-0 right-0 text-center z-10">
          <div className="w-[70%] h-px bg-[#008080] mx-auto mb-1"></div>
          <p className="font-bold text-xs">AEEMCI, pour une identité islamique !</p>
      </div>

    </div>
  )};

  const filteredOut = selectedNiveau !== "tous" || !!query.trim();
  const resetFilters = () => {
    setSearchTerm("");
    setSelectedNiveau("tous");
  };
  const firstSelected = seminaristes.find((s) => s.matricule === selectedSeminaristes[0]);
  const count = selectedSeminaristes.length;

  const columns: Column<SeminaristeWithNotes>[] = [
    ...seminaristeColumns<SeminaristeWithNotes>(),
    {
      id: "notes", header: "Notes saisies", align: "center",
      sortValue: (s) => Object.keys(s.notes || {}).length,
      cell: (s) => {
        const notesCount = Object.keys(s.notes || {}).length;
        return <StatusBadge tone={notesCount > 0 ? "success" : "neutral"} icon={null}>{notesCount}</StatusBadge>;
      },
    },
  ];

  return (
    <DashboardLayout>
      <PageHeader
        title="Bulletins"
        description={`Bulletins de fin de séminaire avec notes, moyennes et rangs (${EDITION.anneeScolaire}).`}
        actions={
          <Button variant="outline" onClick={recalculerAnnee} disabled={recalculating}>
            <RefreshCw className={recalculating ? "animate-spin" : undefined} aria-hidden="true" />
            Recalculer l&apos;année
          </Button>
        }
      />

      {generationErrors.length > 0 && (
        <div role="alert" className="mb-6 space-y-2 rounded-lg border border-destructive/30 bg-destructive-soft p-4 text-sm text-destructive-strong">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold">Bulletins à compléter</p>
            <Button variant="link" size="sm" className="h-auto p-0 text-destructive-strong" onClick={() => setGenerationErrors([])}>
              Masquer
            </Button>
          </div>
          <ul className="list-disc space-y-1 pl-5">
            {generationErrors.map((e) => <li key={e} className="whitespace-pre-line">{e}</li>)}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">
          <ListPanel title="Séminaristes" description="Cochez les séminaristes dont vous voulez générer le bulletin.">
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
                <>
                  <SelectionActions
                    filteredCount={filteredKeys.length}
                    allFilteredSelected={isAllSelected(selectedSeminaristes, filteredKeys)}
                    selectedCount={count}
                    onSelectFiltered={() => setSelectedSeminaristes((prev) => addToSelection(prev, filteredKeys))}
                    onClear={() => setSelectedSeminaristes([])}
                  />
                  <Button variant="outline" size="icon" onClick={fetchSeminaristes} disabled={loading} aria-label="Actualiser la liste">
                    <RefreshCw className={loading ? "animate-spin" : undefined} aria-hidden="true" />
                  </Button>
                </>
              }
            />
            <DataTable
              caption="Séminaristes à sélectionner pour les bulletins"
              columns={columns}
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
          <PreviewPanel
            title="Aperçu du bulletin"
            emptyIcon={FileText}
            emptyMessage="Sélectionnez un séminariste pour afficher l'aperçu de son bulletin."
            footer={
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="bulletin-nb-notes">Colonnes de notes dans l&apos;aperçu</Label>
                <Input
                  id="bulletin-nb-notes"
                  type="number"
                  min={1}
                  max={10}
                  value={numberOfNotes}
                  onChange={(e) => setNumberOfNotes(parseInt(e.target.value) || 4)}
                  className="w-20"
                />
              </div>
            }
          >
            {firstSelected ? (
              <div className="scale-[0.40] origin-top">
                <BulletinPreview
                  seminariste={firstSelected}
                  bulletin={previewBulletin}
                  numberOfNotes={numberOfNotes}
                />
              </div>
            ) : null}
          </PreviewPanel>

          <GeneratePanel
            label={`Générer ${count} bulletin${count > 1 ? "s" : ""} (PDF)`}
            icon={Printer}
            count={count}
            generating={generating}
            onGenerate={generatePDF}
            notes={["A4 paysage, un bulletin par page", "Moyenne et rang calculés par le serveur"]}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
