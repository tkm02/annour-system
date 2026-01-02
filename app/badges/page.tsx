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
import { coApi, MembreCO, scientificApi, Seminariste } from "@/lib/api";
import logoAnnour from "@/public/ANNOUR.png";
import AEEMCI from "@/public/Logo_AEEMCI.jpeg";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@radix-ui/react-tabs";
import jsPDF from "jspdf";
import {
  CreditCard,
  Eye,
  FileText,
  Loader2,
  Printer,
  RefreshCw,
  Search,
  Trash2,
  UserPlus,
  Users
} from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
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
  const [searchTerm, setSearchTerm] = useState("");
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
  const [selectedMembresCO, setSelectedMembresCO] = useState<string[]>([]);
  const [searchTermCO, setSearchTermCO] = useState("");
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
      const response = await scientificApi.getSeminaristes(1, 10000);
      setSeminaristes(response.data);
    } catch (error: any) {
      toast.error(error.message || "Erreur chargement");
    } finally {
      setLoading(false);
    }
  };

  // ✅ FETCH MEMBRES CO
  const fetchMembresCO = async () => {
    try {
      setLoadingCO(true);
      const response = await coApi.getMembresCO();
      setMembresCO(response.data);
    } catch (error: any) {
      toast.error(error.message || "Erreur chargement membres CO");
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

  // ✅ FILTRAGE MEMBRES CO
  const filteredMembresCO = membresCO.filter((membre) => {
    const fullName = `${membre.nom} ${membre.prenoms || ""}`.toLowerCase();
    const matchesSearch =
      !searchTermCO ||
      fullName.includes(searchTermCO.toLowerCase()) ||
      membre.commission.toLowerCase().includes(searchTermCO.toLowerCase());
    const matchesCommission =
      selectedCommission === "tous" || membre.commission === selectedCommission;
    return matchesSearch && matchesCommission;
  });

  const handleSelectAllCO = () => {
    if (selectedMembresCO.length === filteredMembresCO.length) {
      setSelectedMembresCO([]);
    } else {
      setSelectedMembresCO(filteredMembresCO.map((m) => m.id));
    }
  };

  const handleSelectOneCO = (id: string) => {
    setSelectedMembresCO((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

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
      toast.warning("⚠️ Sélectionnez au moins un membre CO");
      return;
    }

    try {
      setGenerating(true);
      toast.info("📄 Génération badges Membres CO...");

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
      toast.success(`✅ ${selectedMembresCO.length} badges CO générés`);
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

  const toggleStaffSelection = (id: string) => {
    setStaffList(
      staffList.map((s) => (s.id === id ? { ...s, selected: !s.selected } : s))
    );
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
      toast.info("📄 Génération badges Staff...");

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
      toast.success(`✅ ${selectedStaff.length} badges staff générés`);
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

  const toggleCustomBadgeSelection = (id: string) => {
    setCustomBadgeList(
      customBadgeList.map((b) => (b.id === id ? { ...b, selected: !b.selected } : b))
    );
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
      toast.info("📄 Génération badges personnalisés...");

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
      toast.success(`✅ ${selectedBadges.length} badges personnalisés générés`);
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

        <Tabs defaultValue="seminaristes" className="w-full">
            <TabsList className="mb-4">
                <TabsTrigger 
                  value="seminaristes" 
                  className="mr-2 border border-[#A6C33C] p-2 rounded data-[state=active]:bg-[#A6C33C] data-[state=active]:text-white data-[state=inactive]:bg-transparent data-[state=inactive]:text-[#A6C33C]"
                >
                  Séminaristes
                </TabsTrigger>
                <TabsTrigger 
                  value="staff" 
                  className="mr-2 border border-[#A6C33C] p-2 rounded data-[state=active]:bg-[#A6C33C] data-[state=active]:text-white data-[state=inactive]:bg-transparent data-[state=inactive]:text-[#A6C33C]"
                >
                  Comité & Formateurs
                </TabsTrigger>
                <TabsTrigger 
                  value="membres-co" 
                  className="mr-2 border border-[#A6C33C] p-2 rounded data-[state=active]:bg-[#A6C33C] data-[state=active]:text-white data-[state=inactive]:bg-transparent data-[state=inactive]:text-[#A6C33C]"
                >
                  Membres CO {loadingCO && <Loader2 className="h-3 w-3 ml-1 animate-spin" />}
                </TabsTrigger>
                <TabsTrigger 
                  value="personnalise" 
                  className="mr-2 border border-[#A6C33C] p-2 rounded data-[state=active]:bg-[#A6C33C] data-[state=active]:text-white data-[state=inactive]:bg-transparent data-[state=inactive]:text-[#A6C33C]"
                >
                  🎨 Personnalisé
                </TabsTrigger>
            </TabsList>

            {/* 🟢 TAB SÉMINARISTES */}
            <TabsContent value="seminaristes">
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
        </TabsContent>

        {/* 🔵 TAB COMITÉ & FORMATEURS */}
            <TabsContent value="staff">
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                     {/* INPUT STAFF */}
                     <div className="space-y-4 col-span-2">
                         <Card>
                            <CardHeader>
                                <CardTitle>Ajouter un membre (Comité / Formateur)</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <Input 
                                        placeholder="Nom *" 
                                        value={newStaff.nom}
                                        onChange={(e) => setNewStaff({...newStaff, nom: e.target.value})}
                                    />
                                    <Input 
                                        placeholder="Prénoms *"
                                        value={newStaff.prenoms}
                                        onChange={(e) => setNewStaff({...newStaff, prenoms: e.target.value})}
                                    />
                                    <Input 
                                        placeholder="Contact (téléphone)"
                                        value={newStaff.contact}
                                        onChange={(e) => setNewStaff({...newStaff, contact: e.target.value})}
                                    />
                                    <Select 
                                        value={newStaff.commission} 
                                        onValueChange={(v) => setNewStaff({...newStaff, commission: v})}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Commission" />
                                        </SelectTrigger>
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
                                    <Select 
                                        value={newStaff.statut} 
                                        onValueChange={(v) => setNewStaff({...newStaff, statut: v})}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Statut (optionnel)" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="aucun">Aucun</SelectItem>
                                            <SelectItem value="Membre">Membre</SelectItem>
                                            <SelectItem value="Responsable">Responsable</SelectItem>
                                            <SelectItem value="Responsable Adjoint">Responsable Adjoint</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Input 
                                        placeholder="Allergies (optionnel)"
                                        value={newStaff.allergies}
                                        onChange={(e) => setNewStaff({...newStaff, allergies: e.target.value})}
                                    />
                                    <Input 
                                        placeholder="Antécédents médicaux (optionnel)"
                                        value={newStaff.antecedent_medical}
                                        onChange={(e) => setNewStaff({...newStaff, antecedent_medical: e.target.value})}
                                        className="col-span-2"
                                    />
                                </div>
                                <Button onClick={handleAddStaff} className="w-full bg-[#AC3] hover:bg-[#9B2]">
                                    <UserPlus className="mr-2 h-4 w-4" /> Ajouter
                                </Button>
                            </CardContent>
                         </Card>

                         <Card>
                             <CardHeader>
                                 <CardTitle className="flex justify-between">
                                    <span>Liste du Staff ({staffList.length})</span>
                                    {staffList.length > 0 && (
                                        <Badge>{staffList.filter(s=>s.selected).length} sélectionnés</Badge>
                                    )}
                                 </CardTitle>
                             </CardHeader>
                             <CardContent>
                                <div className="border rounded-lg max-h-[400px] overflow-y-auto">
                                <Table>
                                    <TableHeader className="sticky top-0 bg-background">
                                        <TableRow>
                                            <TableHead className="w-10">Select</TableHead>
                                            <TableHead>Nom & Prénoms</TableHead>
                                            <TableHead>Commission</TableHead>
                                            <TableHead>Statut</TableHead>
                                            <TableHead>Contact</TableHead>
                                            <TableHead className="w-10">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {staffList.map((staff) => (
                                            <TableRow key={staff.id}>
                                                <TableCell>
                                                    <Checkbox 
                                                        className="border-[#A6C33C]"
                                                        checked={staff.selected}
                                                        onCheckedChange={() => toggleStaffSelection(staff.id)}
                                                    />
                                                </TableCell>
                                                <TableCell className="font-bold">
                                                    {staff.nom} {staff.prenoms}
                                                </TableCell>
                                                <TableCell><Badge variant="outline">{staff.commission}</Badge></TableCell>
                                                <TableCell>{staff.statut || "-"}</TableCell>
                                                <TableCell>{staff.contact || "-"}</TableCell>
                                                <TableCell>
                                                    <Button variant="ghost" size="sm" onClick={() => removeStaff(staff.id)}>
                                                        <Trash2 className="h-4 w-4 text-red-500" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {staffList.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                                    Aucun membre ajouté.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                                </div>
                             </CardContent>
                         </Card>
                     </div>

                     {/* ACTIONS */}
                     <div className="space-y-4">
                        <Card>
                            <CardHeader><CardTitle>Génération</CardTitle></CardHeader>
                            <CardContent>
                                <Button 
                                    className="w-full bg-[#AC3]" 
                                    size="lg"
                                    onClick={generateStaffPDF}
                                    disabled={staffList.filter(s=>s.selected).length === 0 || generating}
                                >
                                    {generating ? <Loader2 className="animate-spin" /> : <Printer className="mr-2" />}
                                    Générer Badges Staff
                                </Button>
                            </CardContent>
                        </Card>
                     </div>
                 </div>
            </TabsContent>

        {/* 🟣 TAB MEMBRES CO */}
        <TabsContent value="membres-co">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* SÉLECTION MEMBRES CO */}
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Membres du Comité d'Organisation</span>
                    <Badge variant="outline" className="text-base">
                      {selectedMembresCO.length} sélectionné(s)
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Rechercher par nom ou commission..."
                        value={searchTermCO}
                        onChange={(e) => setSearchTermCO(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select
                      value={selectedCommission}
                      onValueChange={setSelectedCommission}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tous">Toutes commissions</SelectItem>
                        {Array.from(
                          new Set(membresCO.map((m) => m.commission).filter(Boolean))
                        ).map((commission) => (
                          <SelectItem key={commission} value={commission}>
                            {commission}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchMembresCO}
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
                                selectedMembresCO.length === filteredMembresCO.length &&
                                filteredMembresCO.length > 0
                              }
                              onCheckedChange={handleSelectAllCO}
                            />
                          </TableHead>
                          <TableHead>NOM & PRÉNOMS</TableHead>
                          <TableHead>COMMISSION</TableHead>
                          <TableHead>STATUT</TableHead>
                          <TableHead>CONTACT</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredMembresCO.map((membre) => (
                          <TableRow key={membre.id}>
                            <TableCell>
                              <Checkbox
                                className="border-[#A6C33C]"
                                checked={selectedMembresCO.includes(membre.id)}
                                onCheckedChange={() => handleSelectOneCO(membre.id)}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {membre.photo_url ? (
                                  <img
                                    src={membre.photo_url}
                                    alt={membre.nom}
                                    className="w-8 h-8 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                                    <Users className="h-4 w-4 text-gray-400" />
                                  </div>
                                )}
                                <div>
                                  <div className="font-semibold">{membre.nom}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {membre.prenoms}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{membre.commission}</Badge>
                            </TableCell>
                            <TableCell>{membre.statut || "Membre"}</TableCell>
                            <TableCell className="text-sm">{membre.contact}</TableCell>
                          </TableRow>
                        ))}
                        {filteredMembresCO.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                              {loadingCO ? "Chargement..." : "Aucun membre CO trouvé."}
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* PREVIEW CO */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Eye className="h-5 w-5" />
                      Aperçu Badge CO
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowVersoCO(!showVersoCO)}
                      className="text-xs"
                    >
                      {showVersoCO ? "Voir Recto" : "Voir Verso"}
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center">
                  {selectedMembresCO.length > 0 ? (
                    <div className="scale-[0.65] origin-top">
                      {showVersoCO ? (
                        <BadgeCOVerso
                          membre={membresCO.find((m) => m.id === selectedMembresCO[0])!}
                          qrCode={qrCodesCO[selectedMembresCO[0]]}
                        />
                      ) : (
                        <BadgeCORecto
                          membre={membresCO.find((m) => m.id === selectedMembresCO[0])!}
                        />
                      )}
                    </div>
                  ) : (
                    <div className="w-64 h-96 border-2 border-dashed rounded-xl flex items-center justify-center">
                      <div className="text-center space-y-2">
                        <CreditCard className="h-12 w-12 mx-auto text-muted-foreground" />
                        <div className="text-sm text-muted-foreground">
                          Sélectionnez un membre CO
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
                      onClick={generateCOPDF}
                      disabled={selectedMembresCO.length === 0 || generating}
                    >
                      {generating ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Génération PDF...
                        </>
                      ) : (
                        <>
                          <FileText className="h-5 w-5" />
                          Télécharger PDF ({selectedMembresCO.length})
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="text-xs text-muted-foreground p-3 bg-muted/50 rounded-lg space-y-1">
                    <div className="font-semibold mb-1">✅ Badges Membres CO :</div>
                    <div>• Recto-verso côte à côte</div>
                    <div>• Photo, nom, commission, statut</div>
                    <div>• Contact et infos médicales au verso</div>
                    <div>• QR Code avec ID</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* 🎨 TAB BADGES PERSONNALISÉS */}
        <TabsContent value="personnalise">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* FORMULAIRE D'AJOUT */}
            <div className="space-y-4 col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5" />
                    Créer un Badge Personnalisé
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      placeholder="Nom *"
                      value={newCustomBadge.nom}
                      onChange={(e) => setNewCustomBadge({ ...newCustomBadge, nom: e.target.value })}
                    />
                    <Input
                      placeholder="Prénom *"
                      value={newCustomBadge.prenom}
                      onChange={(e) => setNewCustomBadge({ ...newCustomBadge, prenom: e.target.value })}
                    />
                    <Input
                      placeholder="Contact (téléphone)"
                      value={newCustomBadge.contact}
                      onChange={(e) => setNewCustomBadge({ ...newCustomBadge, contact: e.target.value })}
                    />
                    <Input
                      placeholder="Fonction (optionnel)"
                      value={newCustomBadge.fonction}
                      onChange={(e) => setNewCustomBadge({ ...newCustomBadge, fonction: e.target.value })}
                    />
                    <Select
                      value={newCustomBadge.statut}
                      onValueChange={(v) => setNewCustomBadge({ ...newCustomBadge, statut: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Statut" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Visiteur">Visiteur (champs optionnels)</SelectItem>
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
                    <Input
                      placeholder="URL de la photo (optionnel)"
                      value={newCustomBadge.photo_url}
                      onChange={(e) => setNewCustomBadge({ ...newCustomBadge, photo_url: e.target.value })}
                      className="col-span-2"
                    />
                  </div>
                  <Button onClick={handleAddCustomBadge} className="w-full bg-[#A6C33C] hover:bg-[#95B035]">
                    <UserPlus className="mr-2 h-4 w-4" /> Ajouter le Badge
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span>Liste des Badges Personnalisés ({customBadgeList.length})</span>
                    {customBadgeList.length > 0 && (
                      <Badge className="bg-[#A6C33C]">
                        {customBadgeList.filter((b) => b.selected).length} sélectionné(s)
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg max-h-[400px] overflow-y-auto">
                    <Table>
                      <TableHeader className="sticky top-0 bg-background">
                        <TableRow>
                          <TableHead className="w-10">Select</TableHead>
                          <TableHead>Nom & Prénom</TableHead>
                          <TableHead>Contact</TableHead>
                          <TableHead>Fonction</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead className="w-10">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {customBadgeList.map((badge) => (
                          <TableRow key={badge.id}>
                            <TableCell>
                              <Checkbox
                                className="border-[#A6C33C]"
                                checked={badge.selected}
                                onCheckedChange={() => toggleCustomBadgeSelection(badge.id)}
                              />
                            </TableCell>
                            <TableCell className="font-bold">
                              {badge.nom} {badge.prenom}
                            </TableCell>
                            <TableCell>{badge.contact || "-"}</TableCell>
                            <TableCell>{badge.fonction || "-"}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="border-[#A6C33C] text-[#A6C33C]">
                                {badge.statut}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeCustomBadge(badge.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {customBadgeList.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                              Aucun badge personnalisé créé. Utilisez le formulaire ci-dessus.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* PREVIEW & ACTIONS */}
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
                      onClick={() => setShowVersoCustom(!showVersoCustom)}
                      className="text-xs"
                    >
                      {showVersoCustom ? "Voir Recto" : "Voir Verso"}
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center">
                  {customBadgeList.filter((b) => b.selected).length > 0 ? (
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
                  ) : (
                    <div className="w-64 h-96 border-2 border-dashed rounded-xl flex items-center justify-center">
                      <div className="text-center space-y-2">
                        <CreditCard className="h-12 w-12 mx-auto text-muted-foreground" />
                        <div className="text-sm text-muted-foreground">
                          Sélectionnez un badge à prévisualiser
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Génération</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    className="w-full gap-2 bg-[#A6C33C] hover:bg-[#95B035]"
                    size="lg"
                    onClick={generateCustomBadgePDF}
                    disabled={customBadgeList.filter((b) => b.selected).length === 0 || generating}
                  >
                    {generating ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Génération PDF...
                      </>
                    ) : (
                      <>
                        <FileText className="h-5 w-5" />
                        Télécharger PDF ({customBadgeList.filter((b) => b.selected).length})
                      </>
                    )}
                  </Button>

                  <div className="text-xs text-muted-foreground p-3 bg-muted/50 rounded-lg space-y-1">
                    <div className="font-semibold mb-1">🎨 Badges Personnalisés :</div>
                    <div>• Nom, Prénom, Contact</div>
                    <div>• Fonction optionnelle</div>
                    <div>• Statut personnalisable</div>
                    <div>• Recto-verso côte à côte</div>
                    <div>• QR Code unique</div>
                    <div>• Format A4 paysage</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
