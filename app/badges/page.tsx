"use client";

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
import { coApi, MembreCO, scientificApi, Seminariste } from "@/lib/api";
import logoAnnour from "@/public/ANNOUR.png";
import AEEMCI from "@/public/Logo_AEEMCI.jpeg";
import jsPDF, { GState } from "jspdf";
import {
  CreditCard,
  FileText,
  Loader2,
  RefreshCw,
  Trash2,
  UserPlus,
  Users
} from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

// ✅ INTERFACE STAFF (Comité & Formateurs) - Aligné avec MembreCO
interface StaffMember {
  id: string;
  nom: string;
  prenoms: string;
  contact: string;
  commission: string; // "Formateur", "Sécurité", "Cuisine", "Santé", "Logistique", "Accueil", etc.
  statut: string; // Optionnel: "Membre", "Responsable", "Responsable Adjoint"
  allergies: string;
  antecedent_medical: string;
  selected: boolean;
}

// ✅ INTERFACE BADGE PERSONNALISÉ
interface CustomBadgeMember {
  id: string;
  nom: string;
  prenom: string;
  contact: string;
  fonction: string; // Optionnel
  statut: string;
  photo_url: string; // Optionnel - URL ou base64 de la photo
  selected: boolean;
}

export default function BadgeGenerationPage() {
  const [seminaristes, setSeminaristes] = useState<Seminariste[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const query = useDebouncedValue(searchTerm);
  const [selectedNiveau, setSelectedNiveau] = useState("tous");
  const [selectedSeminaristes, setSelectedSeminaristes] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [qrCodes, setQrCodes] = useState<{ [key: string]: string }>({});
  const [showVerso, setShowVerso] = useState(false);

  // ✅ STATE STAFF (Comité & Formateurs)
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [newStaff, setNewStaff] = useState({
    nom: "",
    prenoms: "",
    contact: "",
    commission: "Sécurité",
    statut: "",
    allergies: "",
    antecedent_medical: "",
  });

  // ✅ STATE MEMBRES CO
  const [membresCO, setMembresCO] = useState<MembreCO[]>([]);
  const [loadingCO, setLoadingCO] = useState(false);
  const [loadErrorCO, setLoadErrorCO] = useState<string | null>(null);
  const [selectedMembresCO, setSelectedMembresCO] = useState<string[]>([]);
  const [searchTermCO, setSearchTermCO] = useState("");
  const queryCO = useDebouncedValue(searchTermCO);
  const [selectedCommission, setSelectedCommission] = useState("tous");
  const [showVersoCO, setShowVersoCO] = useState(false);

  // ✅ STATE BADGES PERSONNALISÉS
  const [customBadgeList, setCustomBadgeList] = useState<CustomBadgeMember[]>([]);
  const [newCustomBadge, setNewCustomBadge] = useState({
    nom: "",
    prenom: "",
    contact: "",
    fonction: "",
    statut: "Visiteur",
    photo_url: "",
  });
  const [showVersoCustom, setShowVersoCustom] = useState(false);
  const [qrCodesCO, setQrCodesCO] = useState<{ [key: string]: string }>({});

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

  // ✅ FETCH MEMBRES CO
  const fetchMembresCO = async () => {
    try {
      setLoadingCO(true);
      setLoadErrorCO(null);
      const response = await coApi.getMembresCO();
      setMembresCO(response.data);
    } catch (error) {
      setLoadErrorCO(errorText(error, "Chargement des membres CO impossible"));
    } finally {
      setLoadingCO(false);
    }
  };

  useEffect(() => {
    fetchSeminaristes();
    fetchMembresCO();
  }, []);

  // ✅ Génération QR Code pour preview CO
  useEffect(() => {
    const generateQRCodesCO = async () => {
      const codes: { [key: string]: string } = {};
      for (const id of selectedMembresCO.slice(0, 1)) {
        try {
          const qrDataUrl = await QRCode.toDataURL(`CO-${id}`, {
            width: 200,
            margin: 1,
          });
          codes[id] = qrDataUrl;
        } catch (err) {
          console.error("QR Code error:", err);
        }
      }
      setQrCodesCO(codes);
    };

    if (selectedMembresCO.length > 0) {
      generateQRCodesCO();
    }
  }, [selectedMembresCO]);

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

  const niveaux = useMemo(() => niveauxOf(seminaristes), [seminaristes]);
  const filteredSeminaristes = useMemo(() => seminaristes.filter((sem) =>
    (selectedNiveau === "tous" || sem.niveau === selectedNiveau) &&
    matchesSearch(query, [sem.nom, sem.prenom, sem.matricule])
  ), [seminaristes, query, selectedNiveau]);
  const filteredKeys = filteredSeminaristes.map((s) => s.matricule);

  // Membres CO : recherche sur le nom, les prénoms et la commission
  const commissions = useMemo(
    () => Array.from(new Set(membresCO.map((m) => m.commission).filter(Boolean))).sort((a, b) => a.localeCompare(b, "fr")),
    [membresCO]
  );
  const filteredMembresCO = useMemo(() => membresCO.filter((membre) =>
    (selectedCommission === "tous" || membre.commission === selectedCommission) &&
    matchesSearch(queryCO, [membre.nom, membre.prenoms, membre.commission])
  ), [membresCO, queryCO, selectedCommission]);
  const filteredKeysCO = filteredMembresCO.map((m) => m.id);

  // ✅ HELPER: Charger une image, corriger l'orientation et créer un cercle
  const loadImageAsCircularBase64 = async (url: string, size: number = 200): Promise<string | null> => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        
        img.onload = () => {
          // Créer un canvas carré pour l'image circulaire
          const canvas = document.createElement("canvas");
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext("2d");
          
          if (!ctx) {
            resolve(null);
            return;
          }
          
          // Dessiner un cercle de masque
          ctx.beginPath();
          ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
          ctx.closePath();
          ctx.clip();
          
          // Calculer les dimensions pour centrer et remplir le cercle (cover)
          const imgRatio = img.width / img.height;
          let drawWidth = size;
          let drawHeight = size;
          let offsetX = 0;
          let offsetY = 0;
          
          if (imgRatio > 1) {
            // Image plus large que haute
            drawWidth = size * imgRatio;
            offsetX = -(drawWidth - size) / 2;
          } else {
            // Image plus haute que large
            drawHeight = size / imgRatio;
            offsetY = -(drawHeight - size) / 2;
          }
          
          // Dessiner l'image centrée dans le cercle
          ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
          
          // Convertir en base64
          const base64 = canvas.toDataURL("image/png", 0.9);
          resolve(base64);
        };
        
        img.onerror = () => {
          console.error("Erreur chargement image");
          resolve(null);
        };
        
        // Créer URL depuis le blob
        img.src = URL.createObjectURL(blob);
      });
    } catch (error) {
      console.error("Erreur chargement image:", error);
      return null;
    }
  };

  // ✅ GÉNÉRATION PDF MEMBRES CO
  const generateCOPDF = async () => {
    if (selectedMembresCO.length === 0) {
      toast.warning("Sélectionnez au moins un membre CO");
      return;
    }

    try {
      setGenerating(true);
      toast.info("Génération badges Membres CO...");

      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const badgeWidth = 100;
      const badgeHeight = 145;
      const marginX = (297 - badgeWidth * 2) / 3;
      const marginY = (210 - badgeHeight) / 2;

      let isFirstPage = true;

      for (const id of selectedMembresCO) {
        const membre = membresCO.find((m) => m.id === id);
        if (!membre) continue;

        if (!isFirstPage) pdf.addPage();
        isFirstPage = false;

        const xRecto = marginX;
        const y = marginY;
        const xVerso = marginX + badgeWidth + marginX;

        await drawCOBadgeRecto(pdf, membre, xRecto, y, badgeWidth, badgeHeight);
        await drawCOBadgeVerso(pdf, membre, xVerso, y, badgeWidth, badgeHeight);
      }

      pdf.save(`badges-co-${new Date().toISOString().split("T")[0]}.pdf`);
      toast.success(`${selectedMembresCO.length} badges CO générés`);
    } catch (error: any) {
      console.error("❌ Erreur PDF CO:", error);
      toast.error("Erreur génération PDF");
    } finally {
      setGenerating(false);
    }
  };

  // ✅ DRAW CO BADGE RECTO
  const drawCOBadgeRecto = async (
    pdf: jsPDF,
    membre: MembreCO,
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

    // Watermark logo
    addWatermarkLogo(pdf, logoAnnour.src, x, y, w, h, 0.08);

    // Logo gauche AEEMCI
    const logoSize = 12;
    const logoX = x + 5;
    const logoY = y + 4;
    try {
      pdf.addImage(AEEMCI.src, "JPEG", logoX, logoY, logoSize, logoSize);
    } catch (error) {}

    // Logo droit Annour
    const logoMaxSize = 12;
    const aspectRatioNour = 2517 / 1467;
    const logoHeight = logoMaxSize / aspectRatioNour;
    const offsetYNour = (logoMaxSize - logoHeight) / 2;
    try {
      pdf.addImage(logoAnnour.src, "PNG", x + w - 17, y + 4 + offsetYNour, logoMaxSize, logoHeight);
    } catch (error) {}

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
    pdf.text("Sous-comité Cocody I & Sous-comité Bingerville", x + w / 2, y + 17, { align: "center" });

    // Titre
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(166, 195, 60);
    pdf.text("SEMINAIRE AN-NOUR 25", x + w / 2, y + 27, { align: "center" });

    // Photo circulaire
    const photoSize = 30;
    const photoX = x + w / 2;
    const photoY = y + 45;
    pdf.setDrawColor(166, 195, 60);
    pdf.setLineWidth(1.2);
    pdf.circle(photoX, photoY, photoSize / 2);
    pdf.setFillColor(240, 240, 240);
    pdf.circle(photoX, photoY, photoSize / 2 - 1, "F");

    // Ajouter la photo si disponible
    if (membre.photo_url) {
      try {
        const photoBase64 = await loadImageAsCircularBase64(membre.photo_url, 300);
        if (photoBase64) {
          // L'image est déjà circulaire, on l'ajoute directement
          pdf.addImage(
            photoBase64,
            "PNG",
            photoX - photoSize / 2,
            photoY - photoSize / 2,
            photoSize,
            photoSize
          );
        }
      } catch (error) {
        console.error("Erreur photo:", error);
      }
    }

    // Badge COMMISSION
    pdf.setFillColor(166, 195, 60);
    pdf.roundedRect(x + w / 2 - 25, y + 58, 50, 6, 3, 3, "F");
    pdf.setFontSize(7);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(255, 255, 255);
    pdf.text(membre.commission.toUpperCase(), x + w / 2, y + 62, { align: "center" });

    // Nom
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(166, 195, 60);
    pdf.text(membre.nom.toUpperCase(), x + w / 2, y + 70, { align: "center" });

    // Prénoms
    pdf.setFontSize(13);
    pdf.setTextColor(0, 0, 0);
    pdf.text(membre.prenoms.toUpperCase(), x + w / 2, y + 75, { align: "center" });

    // Statut
    pdf.setDrawColor(166, 195, 60);
    pdf.setLineWidth(0.8);
    pdf.roundedRect(x + 8, y + 80, w - 16, 7, 3, 3);
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0, 0, 0);
    pdf.text(membre.statut || "Membre", x + w / 2, y + 85, { align: "center" });

    // QR CODE
    try {
      const qrDataUrl = await QRCode.toDataURL(`CO-${membre.id}`, { width: 300, margin: 1 });
      const qrSize = 30;
      pdf.addImage(qrDataUrl, "PNG", x + w / 2 - qrSize / 2, y + 95, qrSize, qrSize);
    } catch (e) {}

    // Footer URL
    pdf.setFontSize(6);
    pdf.setTextColor(166, 195, 60);
    pdf.setFont("helvetica", "bold");
    pdf.text("https://an-nour25.vercel.app", x + w / 2, y + h - 3, { align: "center" });
  };

  // ✅ DRAW CO BADGE VERSO
  const drawCOBadgeVerso = async (
    pdf: jsPDF,
    membre: MembreCO,
    x: number,
    y: number,
    w: number,
    h: number
  ) => {
    pdf.setDrawColor(166, 195, 60);
    pdf.setLineWidth(1);
    pdf.rect(x, y, w, h);
    pdf.setFillColor(255, 255, 255);
    pdf.rect(x, y, w, h, "F");
    addWatermarkLogo(pdf, logoAnnour.src, x, y, w, h, 0.08);

    // Header simple
    pdf.setFontSize(6);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(100, 100, 100);
    pdf.text("Sous-comité Cocody I & Sous-comité Bingerville", x + w / 2, y + 15, { align: "center" });

    let currentY = y + 30;

    // Commission en gros
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(166, 195, 60);
    pdf.text(membre.commission.toUpperCase(), x + w / 2, currentY, { align: "center" });

    currentY += 15;

    // Section Contact
    pdf.setDrawColor(166, 195, 60);
    pdf.setLineWidth(0.8);
    pdf.roundedRect(x + 5, currentY, w - 10, 18, 3, 3);

    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0, 0, 0);
    pdf.text("Contact", x + w / 2, currentY + 5, { align: "center" });

    pdf.setFontSize(12);
    pdf.setFont("helvetica", "normal");
    pdf.text(membre.contact || "Non renseigné", x + w / 2, currentY + 13, { align: "center" });

    currentY += 25;

    // Section Informations Médicales
    pdf.setDrawColor(166, 195, 60);
    pdf.roundedRect(x + 5, currentY, w - 10, 35, 3, 3);

    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0, 0, 0);
    pdf.text("INFORMATIONS MÉDICALES", x + w / 2, currentY + 5, { align: "center" });

    currentY += 10;

    pdf.setFontSize(9);
    pdf.setFont("helvetica", "bold");
    pdf.text("Allergies :", x + 8, currentY);
    currentY += 4;

    pdf.setFont("helvetica", "normal");
    const allergieLines = pdf.splitTextToSize(membre.allergies || "RAS", w - 20);
    pdf.text(allergieLines, x + 8, currentY);
    currentY += allergieLines.length * 4 + 2;

    pdf.setFont("helvetica", "bold");
    pdf.text("Antécédents :", x + 8, currentY);
    currentY += 4;

    pdf.setFont("helvetica", "normal");
    const antecedentLines = pdf.splitTextToSize(membre.antecedent_medical || "Néant", w - 20);
    pdf.text(antecedentLines, x + 8, currentY);

    // QR CODE
    try {
      const qrDataUrl = await QRCode.toDataURL(`CO-${membre.id}`, { width: 300, margin: 1 });
      const qrSize = 25;
      pdf.addImage(qrDataUrl, "PNG", x + w / 2 - qrSize / 2, y + h - 32, qrSize, qrSize);
    } catch (err) {
      pdf.setDrawColor(200, 200, 200);
      pdf.rect(x + w / 2 - 12, y + h - 32, 24, 24);
    }

    // Footer
    pdf.setFontSize(8);
    pdf.setTextColor(166, 195, 60);
    pdf.setFont("helvetica", "bold");
    pdf.text("https://an-nour25.vercel.app", x + w / 2, y + h - 3, { align: "center" });
  };
  const generatePDF = async () => {
    if (selectedSeminaristes.length === 0) {
      toast.warning("Sélectionnez au moins un séminariste");
      return;
    }

    try {
      setGenerating(true);
      toast.info("Génération PDF avec recto-verso côte à côte...");

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
        `${selectedSeminaristes.length} badge(s) générés (recto-verso côte à côte)`
      );
    } catch (error: any) {
      console.error("❌ Erreur PDF:", error);
      toast.error(error.message || "Erreur génération PDF");
    } finally {
      setGenerating(false);
    }
  };

  // ✅ GESTION STAFF (Comité & Formateurs)
  const handleAddStaff = () => {
    if (!newStaff.nom || !newStaff.prenoms) {
      toast.warning("Nom et Prénoms requis");
      return;
    }
    const staff: StaffMember = {
      id: Date.now().toString(),
      nom: newStaff.nom.toUpperCase(),
      prenoms: newStaff.prenoms.toUpperCase(),
      contact: newStaff.contact,
      commission: newStaff.commission,
      statut: newStaff.statut === "aucun" ? "" : newStaff.statut,
      allergies: newStaff.allergies,
      antecedent_medical: newStaff.antecedent_medical,
      selected: true,
    };
    setStaffList([...staffList, staff]);
    setNewStaff({ nom: "", prenoms: "", contact: "", commission: "Sécurité", statut: "", allergies: "", antecedent_medical: "" });
    toast.success("Membre ajouté");
  };

  const removeStaff = (id: string) => {
    setStaffList(staffList.filter((s) => s.id !== id));
  };

  // ✅ GÉNÉRATION PDF STAFF
  const generateStaffPDF = async () => {
    const selectedStaff = staffList.filter((s) => s.selected);
    if (selectedStaff.length === 0) {
      toast.warning("Sélectionnez au moins un membre");
      return;
    }

    try {
      setGenerating(true);
      toast.info("Génération badges Staff...");

      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const badgeWidth = 100;
      const badgeHeight = 145;
      const marginX = (297 - badgeWidth * 2) / 3;
      const marginY = (210 - badgeHeight) / 2;

      let isFirstPage = true;

      for (const staff of selectedStaff) {
        if (!isFirstPage) pdf.addPage();
        isFirstPage = false;

        // Position RECTO (gauche)
        const xRecto = marginX;
        const y = marginY;
        // Position VERSO (droite)
        const xVerso = marginX + badgeWidth + marginX;

        // Dessiner RECTO
        await drawStaffBadgeRecto(pdf, staff, xRecto, y, badgeWidth, badgeHeight);
        // Dessiner VERSO
        await drawStaffBadgeVerso(pdf, staff, xVerso, y, badgeWidth, badgeHeight);
      }

      pdf.save(`badges-staff-${new Date().toISOString().split("T")[0]}.pdf`);
      toast.success(`${selectedStaff.length} badges staff générés`);
    } catch (error: any) {
      console.error("❌ Erreur PDF Staff:", error);
      toast.error("Erreur génération PDF");
    } finally {
      setGenerating(false);
    }
  };

  // ✅ DRAW STAFF RECTO (Identique au style CO)
  const drawStaffBadgeRecto = async (
    pdf: jsPDF,
    staff: StaffMember,
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

    // Watermark logo
    addWatermarkLogo(pdf, logoAnnour.src, x, y, w, h, 0.08);

    // Logo gauche AEEMCI
    const logoSize = 12;
    const logoX = x + 5;
    const logoY = y + 4;
    try {
      pdf.addImage(AEEMCI.src, "JPEG", logoX, logoY, logoSize, logoSize);
    } catch (error) {}

    // Logo droit Annour
    const logoMaxSize = 12;
    const aspectRatioNour = 2517 / 1467;
    const logoHeight = logoMaxSize / aspectRatioNour;
    const offsetYNour = (logoMaxSize - logoHeight) / 2;
    try {
      pdf.addImage(logoAnnour.src, "PNG", x + w - 17, y + 4 + offsetYNour, logoMaxSize, logoHeight);
    } catch (error) {}

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
    pdf.text("Sous-comité Cocody I & Sous-comité Bingerville", x + w / 2, y + 17, { align: "center" });

    // Titre
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(166, 195, 60);
    pdf.text("SEMINAIRE AN-NOUR 25", x + w / 2, y + 27, { align: "center" });

    // Photo circulaire (placeholder)
    const photoSize = 30;
    const photoX = x + w / 2;
    const photoY = y + 45;
    pdf.setDrawColor(166, 195, 60);
    pdf.setLineWidth(1.2);
    pdf.circle(photoX, photoY, photoSize / 2);
    pdf.setFillColor(240, 240, 240);
    pdf.circle(photoX, photoY, photoSize / 2 - 1, "F");

    // Badge COMMISSION
    pdf.setFillColor(166, 195, 60);
    pdf.roundedRect(x + w / 2 - 25, y + 58, 50, 6, 3, 3, "F");
    pdf.setFontSize(7);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(255, 255, 255);
    pdf.text(staff.commission.toUpperCase(), x + w / 2, y + 62, { align: "center" });

    // Nom
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(166, 195, 60);
    pdf.text(staff.nom.toUpperCase(), x + w / 2, y + 70, { align: "center" });

    // Prénoms
    pdf.setFontSize(13);
    pdf.setTextColor(0, 0, 0);
    pdf.text(staff.prenoms.toUpperCase(), x + w / 2, y + 75, { align: "center" });

    // Statut
    pdf.setDrawColor(166, 195, 60);
    pdf.setLineWidth(0.8);
    pdf.roundedRect(x + 8, y + 80, w - 16, 7, 3, 3);
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0, 0, 0);
    pdf.text(staff.statut || "Membre", x + w / 2, y + 85, { align: "center" });

    // QR CODE
    try {
      const qrDataUrl = await QRCode.toDataURL(`STAFF-${staff.id}`, { width: 300, margin: 1 });
      const qrSize = 30;
      pdf.addImage(qrDataUrl, "PNG", x + w / 2 - qrSize / 2, y + 95, qrSize, qrSize);
    } catch (e) {}

    // Footer URL
    pdf.setFontSize(6);
    pdf.setTextColor(166, 195, 60);
    pdf.setFont("helvetica", "bold");
    pdf.text("https://an-nour25.vercel.app", x + w / 2, y + h - 3, { align: "center" });
  };

  // ✅ DRAW STAFF VERSO (Identique au style CO)
  const drawStaffBadgeVerso = async (
    pdf: jsPDF,
    staff: StaffMember,
    x: number,
    y: number,
    w: number,
    h: number
  ) => {
    pdf.setDrawColor(166, 195, 60);
    pdf.setLineWidth(1);
    pdf.rect(x, y, w, h);
    pdf.setFillColor(255, 255, 255);
    pdf.rect(x, y, w, h, "F");
    addWatermarkLogo(pdf, logoAnnour.src, x, y, w, h, 0.08);

    // Header simple
    pdf.setFontSize(6);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(100, 100, 100);
    pdf.text("Sous-comité Cocody I & Sous-comité Bingerville", x + w / 2, y + 15, { align: "center" });

    let currentY = y + 30;

    // Commission en gros
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(166, 195, 60);
    pdf.text(staff.commission.toUpperCase(), x + w / 2, currentY, { align: "center" });

    currentY += 15;

    // Section Contact
    pdf.setDrawColor(166, 195, 60);
    pdf.setLineWidth(0.8);
    pdf.roundedRect(x + 5, currentY, w - 10, 18, 3, 3);

    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0, 0, 0);
    pdf.text("Contact", x + w / 2, currentY + 5, { align: "center" });

    pdf.setFontSize(12);
    pdf.setFont("helvetica", "normal");
    pdf.text(staff.contact || "Non renseigné", x + w / 2, currentY + 13, { align: "center" });

    currentY += 25;

    // Section Informations Médicales
    pdf.setDrawColor(166, 195, 60);
    pdf.roundedRect(x + 5, currentY, w - 10, 35, 3, 3);

    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0, 0, 0);
    pdf.text("INFORMATIONS MÉDICALES", x + w / 2, currentY + 5, { align: "center" });

    currentY += 10;

    pdf.setFontSize(9);
    pdf.setFont("helvetica", "bold");
    pdf.text("Allergies :", x + 8, currentY);
    currentY += 4;

    pdf.setFont("helvetica", "normal");
    const allergieLines = pdf.splitTextToSize(staff.allergies || "RAS", w - 20);
    pdf.text(allergieLines, x + 8, currentY);
    currentY += allergieLines.length * 4 + 2;

    pdf.setFont("helvetica", "bold");
    pdf.text("Antécédents :", x + 8, currentY);
    currentY += 4;

    pdf.setFont("helvetica", "normal");
    const antecedentLines = pdf.splitTextToSize(staff.antecedent_medical || "Néant", w - 20);
    pdf.text(antecedentLines, x + 8, currentY);

    // QR CODE
    try {
      const qrDataUrl = await QRCode.toDataURL(`STAFF-${staff.id}`, { width: 300, margin: 1 });
      const qrSize = 25;
      pdf.addImage(qrDataUrl, "PNG", x + w / 2 - qrSize / 2, y + h - 32, qrSize, qrSize);
    } catch (err) {
      pdf.setDrawColor(200, 200, 200);
      pdf.rect(x + w / 2 - 12, y + h - 32, 24, 24);
    }

    // Footer
    pdf.setFontSize(8);
    pdf.setTextColor(166, 195, 60);
    pdf.setFont("helvetica", "bold");
    pdf.text("https://an-nour25.vercel.app", x + w / 2, y + h - 3, { align: "center" });
  };

  // ✅ GESTION BADGES PERSONNALISÉS
  const handleAddCustomBadge = () => {
    // Visiteur ne requiert pas obligatoirement nom/prénom
    const isVisiteur = newCustomBadge.statut === "Visiteur";
    if (!isVisiteur && (!newCustomBadge.nom || !newCustomBadge.prenom)) {
      toast.warning("Nom et Prénom requis pour ce statut");
      return;
    }
    const badge: CustomBadgeMember = {
      id: Date.now().toString(),
      nom: newCustomBadge.nom ? newCustomBadge.nom.toUpperCase() : "VISITEUR",
      prenom: newCustomBadge.prenom ? newCustomBadge.prenom.toUpperCase() : "",
      contact: newCustomBadge.contact,
      fonction: newCustomBadge.fonction,
      statut: newCustomBadge.statut,
      photo_url: newCustomBadge.photo_url,
      selected: true,
    };
    setCustomBadgeList([...customBadgeList, badge]);
    setNewCustomBadge({ nom: "", prenom: "", contact: "", fonction: "", statut: "Visiteur", photo_url: "" });
    toast.success("Badge personnalisé ajouté");
  };

  const removeCustomBadge = (id: string) => {
    setCustomBadgeList(customBadgeList.filter((b) => b.id !== id));
  };

  // ✅ GÉNÉRATION PDF BADGES PERSONNALISÉS
  const generateCustomBadgePDF = async () => {
    const selectedBadges = customBadgeList.filter((b) => b.selected);
    if (selectedBadges.length === 0) {
      toast.warning("Sélectionnez au moins un badge");
      return;
    }

    try {
      setGenerating(true);
      toast.info("Génération badges personnalisés...");

      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const badgeWidth = 100;
      const badgeHeight = 145;
      const marginX = (297 - badgeWidth * 2) / 3;
      const marginY = (210 - badgeHeight) / 2;

      let isFirstPage = true;

      for (const badge of selectedBadges) {
        if (!isFirstPage) pdf.addPage();
        isFirstPage = false;

        const xRecto = marginX;
        const y = marginY;
        const xVerso = marginX + badgeWidth + marginX;

        await drawCustomBadgeRecto(pdf, badge, xRecto, y, badgeWidth, badgeHeight);
        await drawCustomBadgeVerso(pdf, badge, xVerso, y, badgeWidth, badgeHeight);
      }

      pdf.save(`badges-personnalises-${new Date().toISOString().split("T")[0]}.pdf`);
      toast.success(`${selectedBadges.length} badges personnalisés générés`);
    } catch (error: any) {
      console.error("❌ Erreur PDF Custom:", error);
      toast.error("Erreur génération PDF");
    } finally {
      setGenerating(false);
    }
  };

  // ✅ DRAW CUSTOM BADGE RECTO
  const drawCustomBadgeRecto = async (
    pdf: jsPDF,
    badge: CustomBadgeMember,
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

    // Logo en arrière-plan
    addWatermarkLogo(pdf, logoAnnour.src, x, y, w, h, 0.08);

    // Logo gauche AEEMCI
    const logoSize = 12;
    const logoX = x + 5;
    const logoY = y + 4;
    try {
      pdf.addImage(AEEMCI.src, "JPEG", logoX, logoY, logoSize, logoSize);
    } catch (error) {}

    // Logo droit Annour
    const logoMaxSize = 12;
    const aspectRatioNour = 2517 / 1467;
    const logoHeight = logoMaxSize / aspectRatioNour;
    const offsetYNour = (logoMaxSize - logoHeight) / 2;
    try {
      pdf.addImage(logoAnnour.src, "PNG", x + w - 17, y + 4 + offsetYNour, logoMaxSize, logoHeight);
    } catch (error) {}

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
    pdf.text("Sous-comité Cocody I & Sous-comité Bingerville", x + w / 2, y + 17, { align: "center" });

    // Titre
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(166, 195, 60);
    pdf.text("SEMINAIRE AN-NOUR 25", x + w / 2, y + 27, { align: "center" });

    // Photo placeholder circulaire
    const photoSize = 30;
    const photoX = x + w / 2;
    const photoY = y + 45;
    pdf.setDrawColor(166, 195, 60);
    pdf.setLineWidth(1.2);
    pdf.circle(photoX, photoY, photoSize / 2);
    pdf.setFillColor(240, 240, 240);
    pdf.circle(photoX, photoY, photoSize / 2 - 1, "F");

    // Ajouter la photo si disponible
    if (badge.photo_url) {
      try {
        const photoBase64 = await loadImageAsCircularBase64(badge.photo_url, 300);
        if (photoBase64) {
          pdf.addImage(
            photoBase64,
            "PNG",
            photoX - photoSize / 2,
            photoY - photoSize / 2,
            photoSize,
            photoSize
          );
        }
      } catch (error) {
        console.error("Erreur photo:", error);
      }
    }

    // Badge STATUT
    pdf.setFillColor(166, 195, 60);
    pdf.roundedRect(x + w / 2 - 25, y + 58, 50, 6, 3, 3, "F");
    pdf.setFontSize(7);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(255, 255, 255);
    pdf.text(badge.statut.toUpperCase(), x + w / 2, y + 62, { align: "center" });

    // Nom
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(166, 195, 60);
    pdf.text(badge.nom, x + w / 2, y + 70, { align: "center" });

    // Prénom
    pdf.setFontSize(13);
    pdf.setTextColor(0, 0, 0);
    pdf.text(badge.prenom, x + w / 2, y + 75, { align: "center" });

    // Fonction (si renseignée)
    if (badge.fonction) {
      pdf.setDrawColor(166, 195, 60);
      pdf.setLineWidth(0.8);
      pdf.roundedRect(x + 8, y + 80, w - 16, 7, 3, 3);
      pdf.setFontSize(11);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(0, 0, 0);
      pdf.text(badge.fonction, x + w / 2, y + 85, { align: "center" });
    }

    // QR CODE
    try {
      const qrDataUrl = await QRCode.toDataURL(`CUSTOM-${badge.id}-${badge.nom}`, { width: 300, margin: 1 });
      const qrSize = 30;
      pdf.addImage(qrDataUrl, "PNG", x + w / 2 - qrSize / 2, y + 95, qrSize, qrSize);
    } catch (e) {}

    // Footer URL
    pdf.setFontSize(6);
    pdf.setTextColor(166, 195, 60);
    pdf.setFont("helvetica", "bold");
    pdf.text("https://an-nour25.vercel.app", x + w / 2, y + h - 3, { align: "center" });
  };

  // ✅ DRAW CUSTOM BADGE VERSO
  const drawCustomBadgeVerso = async (
    pdf: jsPDF,
    badge: CustomBadgeMember,
    x: number,
    y: number,
    w: number,
    h: number
  ) => {
    pdf.setDrawColor(166, 195, 60);
    pdf.setLineWidth(1);
    pdf.rect(x, y, w, h);
    pdf.setFillColor(255, 255, 255);
    pdf.rect(x, y, w, h, "F");
    addWatermarkLogo(pdf, logoAnnour.src, x, y, w, h, 0.08);

    // Header simple
    pdf.setFontSize(6);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(100, 100, 100);
    pdf.text("Sous-comité Cocody I & Sous-comité Bingerville", x + w / 2, y + 15, { align: "center" });

    let currentY = y + 35;

    // Statut en gros
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(166, 195, 60);
    pdf.text(badge.statut.toUpperCase(), x + w / 2, currentY, { align: "center" });

    currentY += 15;

    // Section Contact
    pdf.setDrawColor(166, 195, 60);
    pdf.setLineWidth(0.8);
    pdf.roundedRect(x + 5, currentY, w - 10, 18, 3, 3);

    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0, 0, 0);
    pdf.text("Contact", x + w / 2, currentY + 5, { align: "center" });

    pdf.setFontSize(12);
    pdf.setFont("helvetica", "normal");
    pdf.text(badge.contact || "Non renseigné", x + w / 2, currentY + 13, { align: "center" });

    currentY += 25;

    // Fonction si renseignée
    if (badge.fonction) {
      pdf.setDrawColor(166, 195, 60);
      pdf.roundedRect(x + 5, currentY, w - 10, 15, 3, 3);

      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(0, 0, 0);
      pdf.text("Fonction", x + w / 2, currentY + 5, { align: "center" });

      pdf.setFontSize(11);
      pdf.setFont("helvetica", "normal");
      pdf.text(badge.fonction, x + w / 2, currentY + 12, { align: "center" });
    }

    // QR CODE
    try {
      const qrDataUrl = await QRCode.toDataURL(`CUSTOM-${badge.id}-${badge.nom}`, { width: 300, margin: 1 });
      const qrSize = 25;
      pdf.addImage(qrDataUrl, "PNG", x + w / 2 - qrSize / 2, y + h - 32, qrSize, qrSize);
    } catch (err) {
      pdf.setDrawColor(200, 200, 200);
      pdf.rect(x + w / 2 - 12, y + h - 32, 24, 24);
    }

    // Footer
    pdf.setFontSize(8);
    pdf.setTextColor(166, 195, 60);
    pdf.setFont("helvetica", "bold");
    pdf.text("https://an-nour25.vercel.app", x + w / 2, y + h - 3, { align: "center" });
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
    pdf.setGState(new GState({ opacity: opacity }));

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
        const photoBase64 = await loadImageAsCircularBase64(sem.photo_url, 300);
        if (photoBase64) {
          // L'image est déjà circulaire, on l'ajoute directement
          pdf.addImage(
            photoBase64,
            "PNG",
            photoX - photoSize / 2,
            photoY - photoSize / 2,
            photoSize,
            photoSize
          );
        }
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
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(166, 195, 60);
    pdf.text(sem.nom.toUpperCase(), x + w / 2, y + 70, { align: "center" });

    // Prénom
    pdf.setFontSize(13);
    pdf.setTextColor(0, 0, 0);
    pdf.text(sem.prenom.toUpperCase(), x + w / 2, y + 75, { align: "center" });

    // Matricule
    pdf.setDrawColor(166, 195, 60);
    pdf.setLineWidth(0.8);
    pdf.roundedRect(x + 8, y + 80, w - 16, 7, 3, 3);

    pdf.setFontSize(12);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(100, 100, 100);
    pdf.text("Matricule :", x + 12, y + 85);

    pdf.setFontSize(13);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0, 0, 0);
    pdf.text(sem.matricule, x + w - 12, y + 85, { align: "right" });

    // Cadre dortoir
    pdf.setDrawColor(166, 195, 60);
    pdf.setLineWidth(0.8);
    pdf.setFillColor(255, 255, 255);
    pdf.roundedRect(x + 10, y + 95, w - 20, 20, 4, 4, "FD");

    // Niveau
    pdf.setDrawColor(166, 200, 60);
    pdf.setLineWidth(1);
    pdf.roundedRect(x + w / 2 - 25, y + 91, 50, 8, 4, 4);

    pdf.setFillColor(255, 255, 255);
    pdf.roundedRect(x + w / 2 - 25, y + 91, 50, 8, 4, 4, "F");

    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0, 0, 0);
    pdf.text(sem.niveau || "Universitaire", x + w / 2, y + 96, {
      align: "center",
    });

    // Dortoir
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(0, 0, 0);
    pdf.text("Dortoir :", x + 15, y + 108, { align: "left" });

    pdf.setFont("helvetica", "bold");
    pdf.text(sem.dortoir || "Salwa - Réconfort", x + w - 15, y + 108, {
      align: "right",
    });

    // Footer URL
    pdf.setFontSize(8);
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

    pdf.setFontSize(8);
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

    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0, 0, 0);
    pdf.text("Contacts", x + w / 2, currentY + 5, { align: "center" });

    currentY += 10;

    pdf.setFontSize(10);
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

    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0, 0, 0);
    pdf.text("INFORMATIONS MÉDICALES", x + w / 2, currentY + 5, {
      align: "center",
    });

    currentY += 10;

    pdf.setFontSize(10);
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
    pdf.setFontSize(8);
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

// ✅ BADGE CO RECTO React (Preview)
const BadgeCORecto = ({ membre }: { membre: MembreCO }) => (
  <div className="relative w-[400px] h-[630px] bg-white rounded-lg shadow-2xl border-4 border-[#A6C33C] overflow-hidden">
    {/* Watermark logo */}
    <div className="absolute inset-0 flex items-center justify-center opacity-[0.08] pointer-events-none">
      <img src={logoAnnour.src} alt="Watermark" className="w-[80%] h-auto object-contain" />
    </div>

    <div className="relative z-10 p-6 flex flex-col items-center">
      {/* Logos */}
      <div className="absolute top-4 left-4 right-4 flex justify-between">
        <div className="w-12 h-12 border border-gray-300 flex items-center justify-center overflow-hidden">
          <img src={AEEMCI.src} alt="AEEMCI" className="w-full h-full object-cover" />
        </div>
        <div className="w-12 h-12 border border-gray-300 flex items-center justify-center overflow-hidden">
          <img src={logoAnnour.src} alt="ANNOUR" className="w-full h-auto object-contain" />
        </div>
      </div>

      {/* Header */}
      <div className="text-center mt-12 space-y-0.5">
        <div className="text-sm font-bold text-[#A6C33C]">AEEMCI</div>
        <div className="text-base font-bold text-black">SERA-EST</div>
        <div className="text-[10px] text-gray-500">Sous-comité Cocody I & Sous-comité Bingerville</div>
      </div>

      {/* Titre */}
      <div className="text-center mt-3">
        <div className="text-2xl font-bold text-[#A6C33C]">SEMINAIRE AN-NOUR 25</div>
      </div>

      {/* Photo circulaire */}
      <div className="mt-5 relative">
        <div className="w-[120px] h-[120px] rounded-full border-[3px] border-[#A6C33C] bg-gray-100 flex items-center justify-center overflow-hidden">
          {membre.photo_url ? (
            <img src={membre.photo_url} alt={membre.nom} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <Users className="h-12 w-12 text-gray-400" />
            </div>
          )}
        </div>
      </div>

      {/* Badge COMMISSION */}
      <div className="mt-3 bg-[#A6C33C] text-white px-7 py-1.2 mt-[-10px] z-10 rounded-full">
        <span className="text-xs font-bold">{membre.commission.toUpperCase()}</span>
      </div>

      {/* Nom et Prénoms */}
      <div className="text-center mt-4 space-y-0.5">
        <div className="text-[22px] font-bold text-[#A6C33C] uppercase leading-tight">{membre.nom}</div>
        <div className="text-lg font-bold text-black uppercase leading-tight">{membre.prenoms}</div>
      </div>

      {/* Statut */}
      <div className="mt-3 w-[90%] border-2 border-[#A6C33C] rounded-lg px-3 py-1.5 flex justify-center items-center">
        <span className="text-sm font-bold text-black">{membre.statut || "Membre"}</span>
      </div>

      {/* Footer */}
      <div className="absolute bottom-3 left-0 right-0 text-center">
        <span className="text-xs font-bold text-[#A6C33C]">https://an-nour25.vercel.app</span>
      </div>
    </div>
  </div>
);

// ✅ BADGE CO VERSO React (Preview)
const BadgeCOVerso = ({ membre, qrCode }: { membre: MembreCO; qrCode?: string }) => (
  <div className="relative w-[400px] h-[630px] bg-white rounded-lg shadow-2xl border-4 border-[#A6C33C] overflow-hidden">
    {/* Watermark logo */}
    <div className="absolute inset-0 flex items-center justify-center opacity-[0.08] pointer-events-none">
      <img src={logoAnnour.src} alt="Watermark" className="w-[80%] h-auto object-contain" />
    </div>

    <div className="relative z-10 p-5 flex flex-col">
      {/* Header */}
      <div className="text-center space-y-0.5 mb-3">
        <div className="text-sm font-bold text-[#A6C33C]">AEEMCI</div>
        <div className="text-base font-bold text-black">SERA-EST</div>
        <div className="text-[10px] text-gray-500">Sous-comité Cocody I & Sous-comité Bingerville</div>
      </div>

      {/* Commission */}
      <div className="text-center text-xl font-bold text-[#A6C33C] mt-2">
        {membre.commission.toUpperCase()}
      </div>

      {/* Section Contact */}
      <div className="border-2 border-[#A6C33C] rounded-xl p-4 mt-4 space-y-2.5">
        <div className="text-center font-bold text-sm text-black">Contact</div>
        <div className="text-center text-lg text-black">{membre.contact || "Non renseigné"}</div>
      </div>

      {/* Section Informations Médicales */}
      <div className="border-2 border-[#A6C33C] rounded-xl p-4 mt-4 space-y-2.5">
        <div className="text-center font-bold text-sm text-black">INFORMATIONS MÉDICALES</div>
        <div className="space-y-2">
          <div>
            <div className="font-bold text-xs text-black">Allergies :</div>
            <div className="text-xs text-black mt-0.5">{membre.allergies || "RAS"}</div>
          </div>
          <div>
            <div className="font-bold text-xs text-black">Antécédents :</div>
            <div className="text-xs text-black mt-0.5">{membre.antecedent_medical || "Néant"}</div>
          </div>
        </div>
      </div>

      {/* QR Code */}
      <div className="flex-1 flex items-center justify-center mt-4 mb-8">
        {qrCode ? (
          <img src={qrCode} alt="QR Code" className="w-[180px] h-[180px]" />
        ) : (
          <div className="w-[100px] h-[100px] border-2 border-gray-300 flex items-center justify-center">
            <span className="text-[10px] text-gray-400">QR CODE</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="absolute bottom-3 left-0 right-0 text-center">
        <span className="text-xs font-bold text-[#A6C33C]">https://an-nour25.vercel.app</span>
      </div>
    </div>
  </div>
);


  const filteredOut = selectedNiveau !== "tous" || !!query.trim();
  const resetFilters = () => {
    setSearchTerm("");
    setSelectedNiveau("tous");
  };
  const filteredOutCO = selectedCommission !== "tous" || !!queryCO.trim();
  const resetFiltersCO = () => {
    setSearchTermCO("");
    setSelectedCommission("tous");
  };
  const firstSeminariste = seminaristes.find((s) => s.matricule === selectedSeminaristes[0]);
  const firstMembreCO = membresCO.find((m) => m.id === selectedMembresCO[0]);
  const selectedStaff = staffList.filter((s) => s.selected);
  const selectedCustom = customBadgeList.filter((b) => b.selected);
  const count = selectedSeminaristes.length;
  const plural = (n: number) => (n > 1 ? "s" : "");
  const badgesLabel = (n: number) => `Télécharger ${n} badge${plural(n)} (PDF)`;

  const removeButton = (label: string, onClick: () => void) => (
    <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive-soft hover:text-destructive"
      aria-label={label} onClick={onClick}>
      <Trash2 className="h-4 w-4" aria-hidden="true" />
    </Button>
  );

  const coColumns: Column<MembreCO>[] = [
    {
      id: "nom", header: "Nom et prénoms", sortValue: (m) => `${m.nom} ${m.prenoms}`,
      cell: (m) => (
        <div className="flex items-center gap-2">
          {m.photo_url ? (
            <img src={m.photo_url} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />
          ) : (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted" aria-hidden="true">
              <Users className="h-4 w-4 text-muted-foreground" />
            </span>
          )}
          <div className="min-w-0">
            <div className="font-medium">{m.nom}</div>
            <div className="text-sm text-muted-foreground">{m.prenoms}</div>
          </div>
        </div>
      ),
    },
    { id: "commission", header: "Commission", cell: (m) => m.commission, sortValue: (m) => m.commission },
    { id: "statut", header: "Statut", cell: (m) => m.statut || "Membre", sortValue: (m) => m.statut || "Membre", hideBelow: "md" },
    { id: "contact", header: "Contact", cell: (m) => m.contact, hideBelow: "lg" },
  ];

  const staffColumns: Column<StaffMember>[] = [
    { id: "nom", header: "Nom et prénoms", cell: (s) => <span className="font-medium">{s.nom} {s.prenoms}</span>, sortValue: (s) => `${s.nom} ${s.prenoms}` },
    { id: "commission", header: "Commission", cell: (s) => <StatusBadge icon={null}>{s.commission}</StatusBadge>, sortValue: (s) => s.commission },
    { id: "statut", header: "Statut", cell: (s) => s.statut || "—", hideBelow: "md" },
    { id: "contact", header: "Contact", cell: (s) => s.contact || "—", hideBelow: "lg" },
    { id: "actions", header: <span className="sr-only">Actions</span>, align: "right", cell: (s) => removeButton(`Retirer ${s.nom} ${s.prenoms} de la liste`, () => removeStaff(s.id)) },
  ];

  const customColumns: Column<CustomBadgeMember>[] = [
    { id: "nom", header: "Nom et prénom", cell: (b) => <span className="font-medium">{b.nom} {b.prenom}</span>, sortValue: (b) => `${b.nom} ${b.prenom}` },
    { id: "statut", header: "Statut", cell: (b) => <StatusBadge icon={null}>{b.statut}</StatusBadge>, sortValue: (b) => b.statut },
    { id: "fonction", header: "Fonction", cell: (b) => b.fonction || "—", hideBelow: "md" },
    { id: "contact", header: "Contact", cell: (b) => b.contact || "—", hideBelow: "lg" },
    { id: "actions", header: <span className="sr-only">Actions</span>, align: "right", cell: (b) => removeButton(`Retirer le badge de ${b.nom} ${b.prenom}`.trim(), () => removeCustomBadge(b.id)) },
  ];

  return (
    <DashboardLayout>
      <PageHeader
        title="Badges"
        description="Badges recto verso avec QR code, au format A4 paysage."
      />

      <Tabs defaultValue="seminaristes" className="gap-4">
        <TabsList className="h-auto w-full flex-wrap sm:w-fit">
          <TabsTrigger value="seminaristes">Séminaristes</TabsTrigger>
          <TabsTrigger value="staff">Comité et formateurs</TabsTrigger>
          <TabsTrigger value="membres-co">
            Membres CO 2025
            {loadingCO && <Loader2 className="animate-spin" aria-hidden="true" />}
          </TabsTrigger>
          <TabsTrigger value="personnalise">Personnalisés</TabsTrigger>
        </TabsList>

        {/* Séminaristes */}
        <TabsContent value="seminaristes">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="min-w-0 lg:col-span-2">
              <ListPanel title="Séminaristes" description="Cochez les séminaristes dont vous voulez imprimer le badge.">
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
                      <Button variant="outline" size="icon" onClick={fetchSeminaristes} disabled={loading} aria-label="Actualiser la liste des séminaristes">
                        <RefreshCw className={loading ? "animate-spin" : undefined} aria-hidden="true" />
                      </Button>
                    </>
                  }
                />
                <DataTable
                  caption="Séminaristes à sélectionner pour les badges"
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
              <PreviewPanel title="Aperçu du badge" verso={showVerso} onToggleVerso={() => setShowVerso(!showVerso)}
                emptyIcon={CreditCard} emptyMessage="Sélectionnez un séminariste pour afficher l'aperçu de son badge.">
                {firstSeminariste ? (
                  <div className="scale-[0.65] origin-top">
                    {showVerso ? <BadgeVerso seminariste={firstSeminariste} /> : <BadgeRecto seminariste={firstSeminariste} />}
                  </div>
                ) : null}
              </PreviewPanel>
              <GeneratePanel
                label={badgesLabel(count)}
                icon={FileText}
                count={count}
                generating={generating}
                onGenerate={generatePDF}
                notes={["Recto et verso côte à côte, un badge par page", "QR code avec le matricule", "A4 paysage, prêt à imprimer"]}
              />
            </div>
          </div>
        </TabsContent>

        {/* Comité et formateurs */}
        <TabsContent value="staff">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="min-w-0 space-y-6 lg:col-span-2">
              <ListPanel title="Ajouter un membre" description="Comité ou formateur. La liste reste dans cette page : elle n'est pas enregistrée.">
                <form
                  className="space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleAddStaff();
                  }}
                >
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field id="staff-nom" label="Nom *">
                      {(f) => <Input {...f} value={newStaff.nom} onChange={(e) => setNewStaff({ ...newStaff, nom: e.target.value })} />}
                    </Field>
                    <Field id="staff-prenoms" label="Prénoms *">
                      {(f) => <Input {...f} value={newStaff.prenoms} onChange={(e) => setNewStaff({ ...newStaff, prenoms: e.target.value })} />}
                    </Field>
                    <Field id="staff-contact" label="Contact (téléphone)">
                      {(f) => <Input {...f} type="tel" value={newStaff.contact} onChange={(e) => setNewStaff({ ...newStaff, contact: e.target.value })} />}
                    </Field>
                    <Field id="staff-commission" label="Commission">
                      {(f) => (
                        <Select value={newStaff.commission} onValueChange={(v) => setNewStaff({ ...newStaff, commission: v })}>
                          <SelectTrigger {...f} className="w-full"><SelectValue placeholder="Commission" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Formateur">Formateur</SelectItem>
                            <SelectItem value="Sécurité">Sécurité</SelectItem>
                            <SelectItem value="Restauration">Restauration</SelectItem>
                            <SelectItem value="Santé">Santé</SelectItem>
                            <SelectItem value="Logistique">Logistique</SelectItem>
                            <SelectItem value="Protocole">Protocole</SelectItem>
                            <SelectItem value="Communication">Communication</SelectItem>
                            <SelectItem value="Scientifique">Scientifique</SelectItem>
                            <SelectItem value="Hygiène">Hygiène</SelectItem>
                            <SelectItem value="Pepinière">Pepinière</SelectItem>
                            <SelectItem value="Manager Général">Manager Général</SelectItem>
                            <SelectItem value="Manager Général Adjoint">Manager Général Adjoint</SelectItem>
                            <SelectItem value="Superviseur Général">Superviseur Général</SelectItem>
                            <SelectItem value="Président de Sous-comités">Président de Sous-comités</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </Field>
                    <Field id="staff-statut" label="Statut (facultatif)">
                      {(f) => (
                        <Select value={newStaff.statut} onValueChange={(v) => setNewStaff({ ...newStaff, statut: v })}>
                          <SelectTrigger {...f} className="w-full"><SelectValue placeholder="Aucun" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="aucun">Aucun</SelectItem>
                            <SelectItem value="Membre">Membre</SelectItem>
                            <SelectItem value="Responsable">Responsable</SelectItem>
                            <SelectItem value="Responsable Adjoint">Responsable Adjoint</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </Field>
                    <Field id="staff-allergies" label="Allergies (facultatif)">
                      {(f) => <Input {...f} value={newStaff.allergies} onChange={(e) => setNewStaff({ ...newStaff, allergies: e.target.value })} />}
                    </Field>
                    <div className="sm:col-span-2">
                      <Field id="staff-antecedents" label="Antécédents médicaux (facultatif)">
                        {(f) => <Input {...f} value={newStaff.antecedent_medical} onChange={(e) => setNewStaff({ ...newStaff, antecedent_medical: e.target.value })} />}
                      </Field>
                    </div>
                  </div>
                  <Button type="submit" variant="outline">
                    <UserPlus aria-hidden="true" /> Ajouter à la liste
                  </Button>
                </form>
              </ListPanel>

              <ListPanel title="Comité et formateurs" description={staffList.length > 0 ? `${staffList.length} dans la liste, ${selectedStaff.length} sélectionné${plural(selectedStaff.length)}` : undefined}>
                <DataTable
                  caption="Membres du comité et formateurs à badger"
                  columns={staffColumns}
                  rows={staffList}
                  getRowKey={(s) => s.id}
                  selection={{
                    selected: new Set(selectedStaff.map((s) => s.id)),
                    onChange: (next) => setStaffList(staffList.map((s) => ({ ...s, selected: next.has(s.id) }))),
                    label: (s) => `${s.nom} ${s.prenoms}`,
                  }}
                  empty={<EmptyState icon={UserPlus} title="Liste vide" message="Ajoutez un membre avec le formulaire ci-dessus." />}
                />
              </ListPanel>
            </div>

            <div className="space-y-6">
              <GeneratePanel
                label={badgesLabel(selectedStaff.length)}
                icon={FileText}
                count={selectedStaff.length}
                generating={generating}
                onGenerate={generateStaffPDF}
                notes={["Recto et verso côte à côte", "A4 paysage, prêt à imprimer"]}
              />
            </div>
          </div>
        </TabsContent>

        {/* Membres CO */}
        <TabsContent value="membres-co">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="min-w-0 lg:col-span-2">
              <ListPanel title="Membres du comité d'organisation 2025" description="Fiches de l'édition précédente (page Membres CO 2025).">
                <FilterBar
                  search={searchTermCO}
                  onSearchChange={setSearchTermCO}
                  searchLabel="Rechercher un membre"
                  searchPlaceholder="Nom, prénoms ou commission…"
                  filters={
                    <Select value={selectedCommission} onValueChange={setSelectedCommission}>
                      <SelectTrigger className="w-full bg-card sm:w-56" aria-label="Filtrer par commission"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tous">Toutes les commissions</SelectItem>
                        {commissions.map((commission) => <SelectItem key={commission} value={commission}>{commission}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  }
                  activeFilters={selectedCommission !== "tous" ? [{ label: `Commission : ${selectedCommission}`, onRemove: () => setSelectedCommission("tous") }] : []}
                  onReset={resetFiltersCO}
                  count={membresCO.length > 0 ? countLabel(filteredMembresCO.length, membresCO.length, "membre", "membres") : undefined}
                  actions={
                    <>
                      <SelectionActions
                        filteredCount={filteredKeysCO.length}
                        allFilteredSelected={isAllSelected(selectedMembresCO, filteredKeysCO)}
                        selectedCount={selectedMembresCO.length}
                        onSelectFiltered={() => setSelectedMembresCO((prev) => addToSelection(prev, filteredKeysCO))}
                        onClear={() => setSelectedMembresCO([])}
                      />
                      <Button variant="outline" size="icon" onClick={fetchMembresCO} disabled={loadingCO} aria-label="Actualiser la liste des membres CO">
                        <RefreshCw className={loadingCO ? "animate-spin" : undefined} aria-hidden="true" />
                      </Button>
                    </>
                  }
                />
                <DataTable
                  caption="Membres du comité d'organisation à sélectionner pour les badges"
                  columns={coColumns}
                  rows={filteredMembresCO}
                  getRowKey={(m) => m.id}
                  loading={loadingCO}
                  error={loadErrorCO}
                  onRetry={fetchMembresCO}
                  pageSize={25}
                  selection={{
                    selected: new Set(selectedMembresCO),
                    onChange: (next) => setSelectedMembresCO((prev) => applySelection(prev, next)),
                    label: (m) => `${m.nom} ${m.prenoms}`,
                  }}
                  empty={
                    <EmptyState
                      icon={Users}
                      title={filteredOutCO ? "Aucun résultat" : "Aucun membre"}
                      message={filteredOutCO ? "Aucun membre ne correspond à ces filtres." : "Aucun membre CO n'est enregistré."}
                      action={filteredOutCO ? <Button variant="outline" onClick={resetFiltersCO}>Réinitialiser les filtres</Button> : undefined}
                    />
                  }
                />
              </ListPanel>
            </div>

            <div className="space-y-6">
              <PreviewPanel title="Aperçu du badge" verso={showVersoCO} onToggleVerso={() => setShowVersoCO(!showVersoCO)}
                emptyIcon={CreditCard} emptyMessage="Sélectionnez un membre pour afficher l'aperçu de son badge.">
                {firstMembreCO ? (
                  <div className="scale-[0.65] origin-top">
                    {showVersoCO ? (
                      <BadgeCOVerso membre={firstMembreCO} qrCode={qrCodesCO[selectedMembresCO[0]]} />
                    ) : (
                      <BadgeCORecto membre={firstMembreCO} />
                    )}
                  </div>
                ) : null}
              </PreviewPanel>
              <GeneratePanel
                label={badgesLabel(selectedMembresCO.length)}
                icon={FileText}
                count={selectedMembresCO.length}
                generating={generating}
                onGenerate={generateCOPDF}
                notes={["Recto et verso côte à côte", "Photo, nom, commission et statut", "Contact et informations médicales au verso", "QR code avec l'identifiant"]}
              />
            </div>
          </div>
        </TabsContent>

        {/* Badges personnalisés */}
        <TabsContent value="personnalise">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="min-w-0 space-y-6 lg:col-span-2">
              <ListPanel title="Créer un badge personnalisé" description="Nom et prénom obligatoires, sauf pour un visiteur. La liste n'est pas enregistrée.">
                <form
                  className="space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleAddCustomBadge();
                  }}
                >
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field id="custom-nom" label="Nom">
                      {(f) => <Input {...f} value={newCustomBadge.nom} onChange={(e) => setNewCustomBadge({ ...newCustomBadge, nom: e.target.value })} />}
                    </Field>
                    <Field id="custom-prenom" label="Prénom">
                      {(f) => <Input {...f} value={newCustomBadge.prenom} onChange={(e) => setNewCustomBadge({ ...newCustomBadge, prenom: e.target.value })} />}
                    </Field>
                    <Field id="custom-contact" label="Contact (téléphone)">
                      {(f) => <Input {...f} type="tel" value={newCustomBadge.contact} onChange={(e) => setNewCustomBadge({ ...newCustomBadge, contact: e.target.value })} />}
                    </Field>
                    <Field id="custom-fonction" label="Fonction (facultatif)">
                      {(f) => <Input {...f} value={newCustomBadge.fonction} onChange={(e) => setNewCustomBadge({ ...newCustomBadge, fonction: e.target.value })} />}
                    </Field>
                    <Field id="custom-statut" label="Statut">
                      {(f) => (
                        <Select value={newCustomBadge.statut} onValueChange={(v) => setNewCustomBadge({ ...newCustomBadge, statut: v })}>
                          <SelectTrigger {...f} className="w-full"><SelectValue placeholder="Statut" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Visiteur">Visiteur (champs facultatifs)</SelectItem>
                            <SelectItem value="Manager Général">Manager Général</SelectItem>
                            <SelectItem value="Manager Général Adjoint">Manager Général Adjoint</SelectItem>
                            <SelectItem value="Superviseur Général">Superviseur Général</SelectItem>
                            <SelectItem value="Président de Sous-comités">Président de Sous-comités</SelectItem>
                            <SelectItem value="Invité">Invité</SelectItem>
                            <SelectItem value="VIP">VIP</SelectItem>
                            <SelectItem value="Partenaire">Partenaire</SelectItem>
                            <SelectItem value="Sponsor">Sponsor</SelectItem>
                            <SelectItem value="Intervenant">Intervenant</SelectItem>
                            <SelectItem value="Presse">Presse</SelectItem>
                            <SelectItem value="Observateur">Observateur</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </Field>
                    <Field id="custom-photo" label="URL de la photo (facultatif)">
                      {(f) => <Input {...f} type="url" value={newCustomBadge.photo_url} onChange={(e) => setNewCustomBadge({ ...newCustomBadge, photo_url: e.target.value })} />}
                    </Field>
                  </div>
                  <Button type="submit" variant="outline">
                    <UserPlus aria-hidden="true" /> Ajouter le badge
                  </Button>
                </form>
              </ListPanel>

              <ListPanel title="Badges personnalisés" description={customBadgeList.length > 0 ? `${customBadgeList.length} dans la liste, ${selectedCustom.length} sélectionné${plural(selectedCustom.length)}` : undefined}>
                <DataTable
                  caption="Badges personnalisés à imprimer"
                  columns={customColumns}
                  rows={customBadgeList}
                  getRowKey={(b) => b.id}
                  selection={{
                    selected: new Set(selectedCustom.map((b) => b.id)),
                    onChange: (next) => setCustomBadgeList(customBadgeList.map((b) => ({ ...b, selected: next.has(b.id) }))),
                    label: (b) => `${b.nom} ${b.prenom}`.trim(),
                  }}
                  empty={<EmptyState icon={CreditCard} title="Aucun badge" message="Créez un badge avec le formulaire ci-dessus." />}
                />
              </ListPanel>
            </div>

            <div className="space-y-6">
              <PreviewPanel title="Aperçu du badge" verso={showVersoCustom} onToggleVerso={() => setShowVersoCustom(!showVersoCustom)}
                emptyIcon={CreditCard} emptyMessage="Sélectionnez un badge pour afficher son aperçu.">
                {selectedCustom.length > 0 ? (
                    <div className="w-[280px] h-[390px] bg-white rounded-lg shadow-xl border-4 border-[#A6C33C] p-4 flex flex-col items-center relative overflow-hidden">
                      {/* Watermark */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-[0.08] pointer-events-none">
                        <img src={logoAnnour.src} alt="Watermark" className="w-[80%] h-auto object-contain" />
                      </div>
                      
                      <div className="relative z-10 flex flex-col items-center w-full">
                        {!showVersoCustom ? (
                          <>
                            {/* RECTO Preview */}
                            <div className="text-center mb-2">
                              <div className="text-xs font-bold text-[#A6C33C]">AEEMCI</div>
                              <div className="text-xs font-bold">SERA-EST</div>
                              <div className="text-[8px] text-gray-500">Sous-comité Cocody I & Bingerville</div>
                            </div>
                            <div className="text-sm font-bold text-[#A6C33C] mb-3">SEMINAIRE AN-NOUR 25</div>
                            <div className="w-16 h-16 rounded-full border-2 border-[#A6C33C] bg-gray-100 mb-2" />
                            <div className="bg-[#A6C33C] text-white text-xs px-4 py-1 rounded-full mb-2">
                              {customBadgeList.find((b) => b.selected)?.statut.toUpperCase()}
                            </div>
                            <div className="text-lg font-bold text-[#A6C33C]">
                              {customBadgeList.find((b) => b.selected)?.nom}
                            </div>
                            <div className="text-base font-semibold">
                              {customBadgeList.find((b) => b.selected)?.prenom}
                            </div>
                            {customBadgeList.find((b) => b.selected)?.fonction && (
                              <div className="border border-[#A6C33C] rounded px-3 py-1 mt-2 text-sm">
                                {customBadgeList.find((b) => b.selected)?.fonction}
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            {/* VERSO Preview */}
                            <div className="text-[8px] text-gray-500 mb-4">Sous-comité Cocody I & Bingerville</div>
                            <div className="text-lg font-bold text-[#A6C33C] mb-4">
                              {customBadgeList.find((b) => b.selected)?.statut.toUpperCase()}
                            </div>
                            <div className="border border-[#A6C33C] rounded-lg p-3 w-full text-center mb-3">
                              <div className="text-xs font-bold">Contact</div>
                              <div className="text-sm">
                                {customBadgeList.find((b) => b.selected)?.contact || "Non renseigné"}
                              </div>
                            </div>
                            {customBadgeList.find((b) => b.selected)?.fonction && (
                              <div className="border border-[#A6C33C] rounded-lg p-3 w-full text-center">
                                <div className="text-xs font-bold">Fonction</div>
                                <div className="text-sm">
                                  {customBadgeList.find((b) => b.selected)?.fonction}
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                ) : null}
              </PreviewPanel>
              <GeneratePanel
                label={badgesLabel(selectedCustom.length)}
                icon={FileText}
                count={selectedCustom.length}
                generating={generating}
                onGenerate={generateCustomBadgePDF}
                notes={["Nom, prénom et contact", "Fonction facultative, statut au choix", "Recto et verso côte à côte, QR code unique", "A4 paysage"]}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
