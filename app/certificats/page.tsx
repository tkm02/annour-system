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
import { scientificApi, Seminariste } from "@/lib/api";
import logoAnnour from "@/public/ANNOUR.png";
import AEEMCI from "@/public/Logo_AEEMCI.jpeg";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@radix-ui/react-tabs";
import jsPDF from "jspdf";
import {
    Award,
    Download,
    Eye,
    Loader2,
    Printer,
    Search,
    Trash2,
    UserPlus
} from "lucide-react";
import { useEffect, useState } from "react";
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

export default function CertificatePage() {
  // STATE SEMINARISTES
  const [seminaristes, setSeminaristes] = useState<Seminariste[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
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
      const response = await scientificApi.getSeminaristes(1, 10000);
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

  const removeStaff = (id: string) => {
    setStaffList(staffList.filter((s) => s.id !== id));
  };

  const toggleStaffSelection = (id: string) => {
    setStaffList(
      staffList.map((s) => (s.id === id ? { ...s, selected: !s.selected } : s))
    );
  };

  // =================================================================================================
  // 🟢 PARTICIPATION DESIGN (SÉMINARISTES)
  // =================================================================================================

  const drawCertificateParticipation = async (
    pdf: jsPDF,
    sem: Seminariste,
    x: number,
    y: number,
    w: number,
    h: number
  ) => {
    // 1. Background
    pdf.setFillColor(255, 255, 255);
    pdf.rect(x, y, w, h, "F");

    // 2. Watermark
    addWatermarkLogo(pdf, logoAnnour.src, x, y, w, h, 0.05);

    // 3. Cadre Décoratif "Participation" (Green/Blue patterns simulation)
    // Bande haut et bas (Bleu foncé)
    const bandHeight = 6;
    pdf.setFillColor(20, 50, 100); // Dark Blue
    pdf.rect(x, y, w, bandHeight, "F"); // Top
    pdf.rect(x, y + h - bandHeight, w, bandHeight, "F"); // Bottom

    // Motifs décoratifs latéraux (Vert An-Nour)
    // On simule une colonne de motifs sur les côtés
    const sideMargin = 15;
    const patternWidth = 10;
    
    // Fonction pour dessiner un motif simple répété
    const drawSidePattern = (posX: number) => {
        pdf.setDrawColor(166, 195, 60); // Vert An-Nour
        pdf.setLineWidth(0.5);
        const steps = 30;
        const stepH = (h - 20) / steps;
        for(let i=0; i<steps; i++) {
            const py = y + 10 + i * stepH;
            // Dessin d'une forme type "coeur" ou "arabesque" simplifié
            pdf.circle(posX + patternWidth/2, py + stepH/2, stepH/3, "S");
        }
    }
    
    drawSidePattern(x + 5);
    drawSidePattern(x + w - 15);


    // 4. Logos Header
    const logoSize = 20;
    const logoY = y + 15;

    // Logo AEEMCI (gauche)
    try {
      pdf.addImage(AEEMCI.src, "JPEG", x + 30, logoY, logoSize, logoSize);
    } catch {}

    // Logo An-Nour (droite)
    const aspectRatioNour = 2517 / 1467;
    const logoHeightNour = logoSize / aspectRatioNour;
    const offsetYNour = (logoSize - logoHeightNour) / 2;
    try {
      pdf.addImage(logoAnnour.src, "PNG", x + w - 50, logoY + offsetYNour, logoSize, logoHeightNour);
    } catch {}

    // 5. Header Texts
    const centerX = x + w / 2;
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0, 0, 0);
    pdf.text("AEEMCI", centerX, y + 20, { align: "center" });
    
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "bold");
    pdf.text("Association des Elèves et Etudiants Musulmans de Côte d'Ivoire", centerX, y + 25, { align: "center" });
    
    pdf.setFont("helvetica", "normal");
    pdf.text("Secrétariat Régional Abidjan Est", centerX, y + 30, { align: "center" });
    pdf.text("Sous-comité de Bingerville et de Cocody 1", centerX, y + 35, { align: "center" });

    // Titre SEMINAIRE AN-NOUR (Gros à gauche ou centré ?) => Centré selon le design user
    pdf.setFontSize(22);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(20, 50, 100); // Bleu titre
    pdf.text("SEMINAIRE", x + 60, y + 50, { align: "center" });
    pdf.text("AN NOUR", x + 60, y + 60, { align: "center" });
    pdf.setFontSize(8);
    pdf.text("SEMINARE INTERCOMMUNAL DE FORMATION ISLAMIQUE ET MANAGERIAL 7.0", x + 60, y + 65, { align: "center" });

    // Titre CERTIFICAT
    pdf.setFontSize(35);
    pdf.setTextColor(20, 50, 100); // Bleu foncé
    pdf.text("ATTESTATION", centerX, y + 80, { align: "center" });
    
    pdf.setFontSize(25);
    pdf.text("DE PARTICIPATION", centerX, y + 92, { align: "center" });

    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);
    pdf.text("Décerné à", centerX, y + 105, { align: "center" });

    // NOM EN GROS
    pdf.setFontSize(30);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(20, 50, 100); // Bleu
    pdf.text(`${sem.prenom.toUpperCase()} ${sem.nom.toUpperCase()}`, centerX, y + 120, { align: "center" });

    // TEXTE
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(0, 0, 0);
    const text = `Pour sa participation exemplaire, assidue et empreinte d'un esprit de fraternité au Séminaire de Formation Islamique et Managériale (An-Nour), organisé du 20 au 25 décembre 2025 au Lycée scientifique de Bingerville, en reconnaissance de son engagement dans la quête du savoir et du perfectionnement personnel au service de la communauté.`;
    const splitText = pdf.splitTextToSize(text, w - 80);
    pdf.text(splitText, centerX, y + 135, { align: "center" });

    // SIGNATURES
    const sigY = y + h - 35;
    pdf.setFontSize(12);
    pdf.text("Manager Général", x + w - 50, sigY, { align: "center" });
    pdf.setLineWidth(0.5);
    pdf.line(x + w - 70, sigY + 2, x + w - 30, sigY + 2);

  };

  // React Preview Component for Participation
  const CertificateParticipationPreview = ({ data }: { data: Seminariste }) => (
    <div className="relative w-full aspect-[297/210] bg-white text-center p-8 shadow-xl overflow-hidden border border-gray-200">
        {/* Bandes decorative */}
        <div className="absolute top-0 left-0 right-0 h-4 bg-[#143264]"></div>
        <div className="absolute bottom-0 left-0 right-0 h-4 bg-[#143264]"></div>
        
        {/* Motifs latéraux (CSS imitation) */}
        <div className="absolute top-4 bottom-4 left-0 w-8 flex flex-col items-center justify-between py-2 bg-white">
             {Array.from({length:15}).map((_,i) => <div key={i} className="w-4 h-4 rounded-full border-2 border-[#A6C33C]"></div>)}
        </div>
        <div className="absolute top-4 bottom-4 right-0 w-8 flex flex-col items-center justify-between py-2 bg-white">
             {Array.from({length:15}).map((_,i) => <div key={i} className="w-4 h-4 rounded-full border-2 border-[#A6C33C]"></div>)}
        </div>

         {/* Logos */}
         <div className="flex justify-between px-12 mt-4">
             <img src={AEEMCI.src} className="h-16 w-16" />
             <img src={logoAnnour.src} className="h-16 w-auto" />
         </div>
         
         {/* Head */}
         <div className="mt-[-60px] mb-8">
             <div className="text-[10px] font-bold">AEEMCI</div>
             <div className="text-[8px] font-bold">Association des Elèves et Etudiants Musulmans de Côte d'Ivoire</div>
             <div className="text-[8px]">Secrétariat Régional Abidjan Est</div>
             <div className="text-[8px]">Sous-comité de Bingerville et de Cocody 1</div>
         </div>

         <div className="relative z-10">
             <h1 className="text-4xl font-bold text-[#143264] mt-8">ATTESTATION</h1>
             <h2 className="text-2xl font-bold text-[#143264]">DE PARTICIPATION</h2>
             
             <p className="text-sm mt-4">Décerné à</p>
             
             <div className="text-3xl font-bold text-[#143264] mt-4 uppercase">
                 {data.prenom} {data.nom}
             </div>
             
             <p className="text-[11px] mt-6 px-16 leading-relaxed">
                 Pour sa participation exemplaire, assidue et empreinte d'un esprit de fraternité au Séminaire de Formation Islamique et Managériale (An-Nour), organisé du 20 au 25 décembre 2025 au Lycée scientifique de Bingerville, en reconnaissance de son engagement dans la quête du savoir et du perfectionnement personnel au service de la communauté.
             </p>
         </div>
         
         <div className="absolute bottom-12 right-16">
             <div className="text-sm border-b border-black pb-1">Manager Général</div>
         </div>
    </div>
  );


  // =================================================================================================
  // 🟡 REMERCIEMENT DESIGN (STAFF / FORMATEUR / DONATEUR)
  // =================================================================================================

  const getRemerciementText = (fonction: string) => {
      switch(fonction) {
          case "Formateur":
              return "Pour sa remarquable contribution pédagogique et son dévouement dans l'encadrement des participants au Séminaire de Formation Islamique et Managériale (An-Nour), organisé du 20 au 25 décembre 2025 au Lycée scientifique de Bingerville, en reconnaissance de son apport scientifique et de son engagement au service de la transmission du savoir islamique et managérial.";
          case "Donateur":
              return "En reconnaissance de son généreux soutien et de sa précieuse contribution à la réussite du Séminaire de Formation Islamique et Managériale (An-Nour), organisé du 20 au 25 décembre 2025 au Lycée scientifique de Bingerville, témoignage de son engagement constant au service du savoir, du développement et du rayonnement de la communauté.";
          default: // Comité
              return "En reconnaissance de son engagement constant, de son sens de l'organisation et de son dévouement exemplaire ayant largement contribué à la réussite du Séminaire de Formation Islamique et Managériale (An-Nour), organisé du 20 au 25 décembre 2025 au Lycée scientifique de Bingerville. Témoignage de son esprit d'équipe, de sa rigueur et de son service désintéressé au profit de la communauté.";
      }
  }

  const drawCertificateRemerciement = async (
    pdf: jsPDF,
    staff: StaffMember,
    x: number,
    y: number,
    w: number,
    h: number
  ) => {
    // 1. Background
    pdf.setFillColor(255, 255, 255);
    pdf.rect(x, y, w, h, "F");
    
    // 2. Watermark
    addWatermarkLogo(pdf, logoAnnour.src, x, y, w, h, 0.05);

    // 3. Cadre simple
    pdf.setDrawColor(20, 50, 100); // Bleu foncé
    pdf.setLineWidth(1);
    pdf.rect(x + 5, y + 5, w - 10, h - 10);
    
    // 4. Ruban Bleu à DROITE
    pdf.setFillColor(20, 50, 100); // Bleu
    const ribbonW = 30;
    pdf.rect(x + w - 40, y, ribbonW, h, "F");
    // "Queue" du ruban en bas
    pdf.setFillColor(255, 255, 255);
    pdf.triangle(
        x + w - 40, y + h,
        x + w - 40 + ribbonW/2, y + h - 10,
        x + w - 40 + ribbonW, y + h,
        "F"
    );

    // 5. Sceau Doré sur le ruban (Gold Seal)
    const sealX = x + w - 40 + ribbonW/2;
    const sealY = y + h - 60;
    const sealR = 20;
    
    pdf.setFillColor(212, 175, 55); // Or
    pdf.circle(sealX, sealY, sealR, "F");
    pdf.setDrawColor(255, 255, 255);
    pdf.circle(sealX, sealY, sealR - 2, "S");
    
    // Texte dans le sceau
    pdf.setFontSize(6);
    pdf.setTextColor(255, 255, 255);
    // pdf.textWithLink ? non, just text rotatif c'est compliqué en jsPDF basic sans plugin context2d
    // On met juste un cercle concentrique
    pdf.circle(sealX, sealY, sealR - 5, "S");


    // 6. Header (Similaire)
    const centerX = x + w / 2 - 20; // Décalé vers gauche à cause du ruban
    
     // Logos Header
    const logoSize = 20;
    const logoY = y + 15;
    try {
      pdf.addImage(AEEMCI.src, "JPEG", x + 30, logoY, logoSize, logoSize);
    } catch {}
    const aspectRatioNour = 2517 / 1467;
    const logoHeightNour = logoSize / aspectRatioNour;
    const offsetYNour = (logoSize - logoHeightNour) / 2;
    try {
       // Logo nour un peu plus au centre droit mais pas sur le ruban
      pdf.addImage(logoAnnour.src, "PNG", x + w - 80, logoY + offsetYNour, logoSize, logoHeightNour);
    } catch {}

    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0, 0, 0);
    pdf.text("AEEMCI", centerX, y + 20, { align: "center" });
    
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "bold");
    pdf.text("Association des Elèves et Etudiants Musulmans de Côte d'Ivoire", centerX, y + 25, { align: "center" });
    pdf.text("Secrétariat Régional Abidjan Est", centerX, y + 30, { align: "center" });
    pdf.text("Sous-comité de Bingerville et de Cocody 1", centerX, y + 35, { align: "center" });

    
    // Titre
    pdf.setFontSize(35);
    pdf.setTextColor(20, 50, 100); 
    pdf.text("ATTESTATION", centerX, y + 80, { align: "center" });
    pdf.setFontSize(25);
    pdf.text("DE REMERCIEMENT", centerX, y + 92, { align: "center" });
    
    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);
    pdf.text("Décerné à", centerX, y + 105, { align: "center" });
    
     // NOM
    pdf.setFontSize(30);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(20, 50, 100);
    pdf.text(`${staff.prenom.toUpperCase()} ${staff.nom.toUpperCase()}`, centerX, y + 120, { align: "center" });

    // TEXTE VARIABLE
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(0, 0, 0);
    const textBody = getRemerciementText(staff.fonction);
    const splitBody = pdf.splitTextToSize(textBody, w - 90); // Marge pour ruban
    pdf.text(splitBody, centerX, y + 135, { align: "center" });

    // SIGNATURE
    const sigY = y + h - 35;
    pdf.setFontSize(12);
    pdf.text("Manager Général", x + w - 100, sigY, { align: "center" });
    pdf.setLineWidth(0.5);
    pdf.line(x + w - 120, sigY + 2, x + w - 80, sigY + 2);
  };


  // React Preview Component for Remerciement
  const CertificateRemerciementPreview = ({ data }: { data: StaffMember }) => (
     <div className="relative w-full aspect-[297/210] bg-white text-center p-8 shadow-xl overflow-hidden border border-gray-200">
        {/* Cadre simple */}
        <div className="absolute inset-4 border border-[#143264]"></div>
        
        {/* Ruban Droit */}
        <div className="absolute top-0 bottom-0 right-12 w-20 bg-[#143264]"></div>
        
        {/* Sceau */}
        <div className="absolute bottom-24 right-12 w-20 h-20 bg-[#D4AF37] rounded-full translate-x-1/2 border-4 border-white flex items-center justify-center shadow-lg">
             <div className="w-16 h-16 border border-white rounded-full"></div>
             <span className="absolute text-[8px] text-white font-bold rotate-[-15deg]">Certificat de Remerciement</span>
        </div>

         {/* Logos */}
         <div className="flex justify-between px-16 mt-4 pr-32">
             <img src={AEEMCI.src} className="h-16 w-16" />
             <img src={logoAnnour.src} className="h-16 w-auto" />
         </div>
         
         <div className="relative z-10 pr-24"> {/* Padding Right pour éviter ruban */}
             <div className="mt-[-60px] mb-8">
                 <div className="text-[10px] font-bold">AEEMCI</div>
                 <div className="text-[8px] font-bold">Association des Elèves et Etudiants Musulmans de Côte d'Ivoire</div>
                 <div className="text-[8px]">Secrétariat Régional Abidjan Est</div>
                 <div className="text-[8px]">Sous-comité de Bingerville et de Cocody 1</div>
             </div>

             <h1 className="text-4xl font-bold text-[#143264] mt-8">ATTESTATION</h1>
             <h2 className="text-2xl font-bold text-[#143264]">DE REMERCIEMENT</h2>
             
             <p className="text-sm mt-4">Décerné à</p>
             
             <div className="text-3xl font-bold text-[#143264] mt-4 uppercase">
                 {data.prenom} {data.nom}
             </div>
             
             <p className="text-[11px] mt-6 px-12 leading-relaxed">
                 {getRemerciementText(data.fonction)}
             </p>
             
             <div className="absolute bottom-12 right-32">
                <div className="text-sm border-b border-black pb-1">Manager Général</div>
            </div>
         </div>
     </div>
  );


  // COMMON UTILS
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
    pdf.addImage(logoSrc, "PNG", x + (w - logoWidth) / 2, y + (h - logoHeight) / 2, logoWidth, logoHeight);
    pdf.restoreGraphicsState();
  };


  // GENERATE FUNCTIONS
  const generateCertificates = async () => {
    if (selectedSeminaristes.length === 0) return toast.warning("Sélectionnez au moins un séminariste");
    try {
      setGenerating(true);
      toast.info("Génération Attestations de Participation...");
      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const w = 297; const h = 210;
      let isFirst = true;

      for (const matricule of selectedSeminaristes) {
        const sem = seminaristes.find(s => s.matricule === matricule);
        if (!sem) continue;
        if (!isFirst) pdf.addPage();
        isFirst = false;
        await drawCertificateParticipation(pdf, sem, 0, 0, w, h);
      }
      pdf.save(`attestations-participation-${new Date().toISOString().split("T")[0]}.pdf`);
      toast.success("Succès !");
    } catch (e) { console.error(e); toast.error("Erreur génération"); }
    finally { setGenerating(false); }
  };

  const generateStaffCertificates = async () => {
      const selectedStaff = staffList.filter(s => s.selected);
      if (selectedStaff.length === 0) return toast.warning("Sélectionnez au moins un membre");
      try {
        setGenerating(true);
        toast.info("Génération Attestations de Remerciement...");
        const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
        const w = 297; const h = 210;
        let isFirst = true;
  
        for (const staff of selectedStaff) {
          if (!isFirst) pdf.addPage();
          isFirst = false;
          await drawCertificateRemerciement(pdf, staff, 0, 0, w, h);
        }
        pdf.save(`attestations-remerciement-${new Date().toISOString().split("T")[0]}.pdf`);
        toast.success("Succès !");
      } catch (e) { console.error(e); toast.error("Erreur génération"); }
      finally { setGenerating(false); }
  };


  if (loading) {
    return (
      <DashboardLayout>
        <Card><CardContent className="p-12 text-center">Chargement...</CardContent></Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Award className="h-7 w-7 text-[#A6C33C]" />
              GÉNÉRATION D'ATTESTATIONS
            </h1>
            <p className="text-muted-foreground">
              Certificats de Participation & Remerciements
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
                  Comité, Formateurs & Donateurs
                </TabsTrigger>
            </TabsList>

            {/* TAB SÉMINARISTES */}
            <TabsContent value="seminaristes">
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                     <div className="lg:col-span-2 space-y-4">
                        <Card>
                             <CardHeader>
                                 <CardTitle>Sélection ({selectedSeminaristes.length})</CardTitle>
                             </CardHeader>
                             <CardContent>
                                <div className="flex gap-2 mb-4">
                                     <div className="relative flex-1">
                                         <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                         <Input placeholder="Rechercher..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
                                     </div>
                                     <Select value={selectedNiveau} onValueChange={setSelectedNiveau}>
                                        <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="tous">Tous niveaux</SelectItem>
                                            {Array.from(new Set(seminaristes.map(s => s.niveau).filter(Boolean))).map(n => <SelectItem key={n} value={n||""}>{n}</SelectItem>)}
                                        </SelectContent>
                                     </Select>
                                </div>
                                <div className="border rounded-lg max-h-[500px] overflow-y-auto">
                                     <Table>
                                         <TableHeader className="sticky top-0 bg-background">
                                             <TableRow>
                                                 <TableHead className="w-12"><Checkbox className="border-[#AC3]" checked={selectedSeminaristes.length === filteredSeminaristes.length && filteredSeminaristes.length > 0} onCheckedChange={handleSelectAll} /></TableHead>
                                                 <TableHead>Identité</TableHead>
                                                 <TableHead>Niveau</TableHead>
                                             </TableRow>
                                         </TableHeader>
                                         <TableBody>
                                             {filteredSeminaristes.map(sem => (
                                                 <TableRow key={sem.id}>
                                                     <TableCell><Checkbox className="border-[#AC3]" checked={selectedSeminaristes.includes(sem.matricule)} onCheckedChange={() => handleSelectOne(sem.matricule)} /></TableCell>
                                                     <TableCell>
                                                         <div className="font-bold">{sem.nom} {sem.prenom}</div>
                                                         <div className="text-xs text-gray-500">{sem.matricule}</div>
                                                     </TableCell>
                                                     <TableCell><Badge variant="outline">{sem.niveau}</Badge></TableCell>
                                                 </TableRow>
                                             ))}
                                         </TableBody>
                                     </Table>
                                </div>
                             </CardContent>
                        </Card>
                     </div>
                     
                     <div className="space-y-4">
                         <Card>
                             <CardHeader><CardTitle className="flex items-center gap-2"><Eye className="h-5 w-5"/> Aperçu</CardTitle></CardHeader>
                             <CardContent>
                                 {selectedSeminaristes.length > 0 ? (
                                     <div className="scale-75 origin-top border shadow">
                                         <CertificateParticipationPreview data={seminaristes.find(s => s.matricule === selectedSeminaristes[0])!} />
                                     </div>
                                 ) : <div className="h-48 border-2 border-dashed flex items-center justify-center text-muted-foreground">Sélectionnez un séminariste</div>}
                             </CardContent>
                         </Card>
                         <Button onClick={generateCertificates} disabled={selectedSeminaristes.length === 0 || generating} className="w-full bg-[#AC3] hover:bg-[#9B2] text-white" size="lg">
                            {generating ? <Loader2 className="animate-spin" /> : <Download className="mr-2" />} Télécharger PDF
                         </Button>
                     </div>
                 </div>
            </TabsContent>

            {/* TAB STAFF */}
            <TabsContent value="staff">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-4">
                        <Card>
                            <CardHeader><CardTitle>Ajouter un bénéficiaire</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <Input placeholder="Nom" value={newStaff.nom} onChange={e => setNewStaff({...newStaff, nom: e.target.value})} />
                                    <Input placeholder="Prénom" value={newStaff.prenom} onChange={e => setNewStaff({...newStaff, prenom: e.target.value})} />
                                    <div className="col-span-2">
                                        <label className="text-sm font-medium mb-1 block">Type d'attestation</label>
                                        <Select value={newStaff.fonction} onValueChange={v => setNewStaff({...newStaff, fonction: v})}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Comité d'Organisation">Comité d'Organisation (Remerciement)</SelectItem>
                                                <SelectItem value="Formateur">Formateur (Contribution Pédagogique)</SelectItem>
                                                <SelectItem value="Donateur">Donateur (Soutien généreux)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Input placeholder="Téléphone (Optionnel)" value={newStaff.telephone} onChange={e => setNewStaff({...newStaff, telephone: e.target.value})} />
                                </div>
                                <Button onClick={handleAddStaff} className="w-full bg-[#AC3] hover:bg-[#9B2]"><UserPlus className="mr-2 h-4 w-4"/> Ajouter à la liste</Button>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader><CardTitle>Liste ({staffList.length})</CardTitle></CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-10">Select</TableHead>
                                            <TableHead>Nom & Prénom</TableHead>
                                            <TableHead>Rôle / Type</TableHead>
                                            <TableHead className="w-10">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {staffList.map(s => (
                                            <TableRow key={s.id}>
                                                <TableCell><Checkbox checked={s.selected} onCheckedChange={() => toggleStaffSelection(s.id)} /></TableCell>
                                                <TableCell className="font-bold">{s.nom} {s.prenom}</TableCell>
                                                <TableCell><Badge variant="secondary">{s.fonction}</Badge></TableCell>
                                                <TableCell><Button variant="ghost" size="sm" onClick={() => removeStaff(s.id)}><Trash2 className="text-red-500 h-4 w-4"/></Button></TableCell>
                                            </TableRow>
                                        ))}
                                        {staffList.length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Aucun membre ajouté</TableCell></TableRow>}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-4">
                        <Card>
                             <CardHeader><CardTitle className="flex items-center gap-2"><Eye className="h-5 w-5"/> Aperçu</CardTitle></CardHeader>
                             <CardContent>
                                 {staffList.filter(s => s.selected).length > 0 ? (
                                     <div className="scale-75 origin-top border shadow">
                                         <CertificateRemerciementPreview data={staffList.find(s => s.selected)!} />
                                     </div>
                                 ) : <div className="h-48 border-2 border-dashed flex items-center justify-center text-muted-foreground">Sélectionnez un membre</div>}
                             </CardContent>
                         </Card>
                         <Button onClick={generateStaffCertificates} disabled={staffList.filter(s => s.selected).length === 0 || generating} className="w-full bg-[#AC3] hover:bg-[#9B2] text-white" size="lg">
                            {generating ? <Loader2 className="animate-spin" /> : <Printer className="mr-2" />} Générer Certificats
                         </Button>
                    </div>
                </div>
            </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
