import jsPDF from 'jspdf';

// Interface matching the structure used in the PDF generator
export interface SeminaristData {
  matricule?: string;
  personalInfo: {
    nom: string;
    prenom: string;
    sexe: string;
    age: number | string; 
    communeHabitation: string;
    niveauAcademique: string;
    contact?: string;
  };
  dormitoryInfo: {
    dortoir: string;
    matricule?: string;
  };
  healthInfo: {
    allergie: string;
    antecedentMedical: string;
  };
}

const loadImage = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = url;
        img.onload = () => resolve(img);
        img.onerror = (err) => reject(err);
    });
};

const PDFGenerator = {
  generateRegistrationPDF: async (data: SeminaristData, qrCodeUrl: string) => {
    const doc = new jsPDF();
    const logoUrl = '/ANNOUR.png'; // Path to logo in public
    
    // Configuration
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;

    // Couleurs
    const colors = {
      primary: [15, 118, 110], // #0F766E
      secondary: [20, 184, 166],
      accent: [255, 215, 0],
      dark: [10, 61, 46],
      gray: [107, 114, 128],
      success: [16, 185, 129],
      background: [240, 253, 244]
    };

    // Fonction getValue
    const getValue = (obj: any, path: string, defaultValue = 'N/A') => {
      try {
        const keys = path.split('.');
        let value = obj;
        for (const key of keys) {
          value = value?.[key];
          if (value === undefined || value === null) return defaultValue;
        }
        return value || defaultValue;
      } catch {
        return defaultValue;
      }
    };

    // ===== HEADER =====

    for (let i = 0; i < 50; i++) {
      const opacity = 1 - (i / 50);
      doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
      // @ts-ignore
      doc.setGState(new doc.GState({ opacity: opacity * 0.1 }));
      doc.rect(0, i, pageWidth, 1, 'F');
    }
    // @ts-ignore
    doc.setGState(new doc.GState({ opacity: 1 }));

    doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.rect(0, 0, pageWidth, 45, 'F');

    doc.setFillColor(colors.accent[0], colors.accent[1], colors.accent[2]);
    doc.rect(0, 43, pageWidth, 2, 'F');

    // Logo
    try {
        const logoWidth = 28;
        const logoHeight = 28; // Adjusted to be square or fit
      
        const circleSize = 30;      // Taille du cercle
        const circleX = margin - 2; // Position X
        const circleY = 5;          // Position Y
      
        // Ombre douce (dégradée)
        for (let i = 0; i < 12; i++) {
          const opacity = 0.12 - i * 0.01;
          if (opacity <= 0) break;
      
          doc.setGState(new doc.GState({ opacity }));
          doc.setFillColor(200, 200, 200);
          doc.ellipse(circleX + circleSize / 2, circleY + circleSize / 2, (circleSize / 2) + i, (circleSize / 2) + i, 'F');
        }
      
        doc.setGState(new doc.GState({ opacity: 1 }));
      
        // Cercle blanc propre
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(230, 230, 230);
        doc.setLineWidth(0.5);
        doc.circle(circleX + circleSize / 2, circleY + circleSize / 2, circleSize / 2, 'FD');
      
        // Ajout du logo
        const logoImg = await loadImage(logoUrl);
        const imgX = circleX + (circleSize - logoWidth) / 2;
        const imgY = circleY + (circleSize - logoHeight) / 2;

        doc.addImage(logoImg, 'PNG', imgX, imgY, logoWidth, logoHeight);
      
      } catch (error) {
        console.error("Error loading logo", error);
        // Continue without logo or show placeholder
      }

    // Titre
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('SEMINAIRE AN-NOUR', pageWidth / 2, 18, { align: 'center' });

    doc.setFontSize(28);
    doc.setTextColor(colors.accent[0], colors.accent[1], colors.accent[2]);
    doc.text('7.0', pageWidth / 2, 28, { align: 'center' });

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.text('Fiche d\'Inscription Officielle', pageWidth / 2, 38, { align: 'center' });

    // ===== MATRICULE + QR =====

    let yPos = 55;

    doc.setFillColor(colors.background[0], colors.background[1], colors.background[2]);
    doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 50, 5, 5, 'F');

    doc.setDrawColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
    doc.setLineWidth(1);
    doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 50, 5, 5, 'S');

    // QR Code
    if (qrCodeUrl) {
      try {
        doc.addImage(qrCodeUrl, 'PNG', pageWidth - margin - 48, yPos + 5, 40, 40);
        doc.setDrawColor(colors.primary[0], colors.primary[1], colors.primary[2]);
        doc.setLineWidth(0.5);
        doc.rect(pageWidth - margin - 48, yPos + 5, 40, 40, 'S');
      } catch (error) {
         console.warn('Erreur QR:', error);
      }
    }

    // Matricule
    doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('MATRICULE', margin + 10, yPos + 15);

    const matricule = getValue(data, 'matricule') || getValue(data, 'dormitoryInfo.matricule');
    doc.setFontSize(18);
    doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.text(matricule, margin + 10, yPos + 28);

    // Badge paiement
    doc.setFillColor(colors.success[0], colors.success[1], colors.success[2]);
    doc.roundedRect(margin + 10, yPos + 35, 60, 8, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.text('PAIEMENT VALIDE', margin + 13, yPos + 41);

    // ===== INFORMATIONS PARTICIPANT =====

    yPos = 115;

    doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.rect(margin, yPos, pageWidth - 2 * margin, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('INFORMATIONS DU PARTICIPANT', margin + 5, yPos + 7);

    yPos += 15;

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(colors.gray[0], colors.gray[1], colors.gray[2]);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 50, 3, 3, 'FD');

    yPos += 10;

    const nom = getValue(data, 'personalInfo.nom');
    const prenom = getValue(data, 'personalInfo.prenom');
    const nomComplet = `${prenom} ${nom}`.trim() || 'N/A';

    const fields = [
      { label: 'Nom complet', value: nomComplet },
      { label: 'Sexe', value: getValue(data, 'personalInfo.sexe') === 'M' ? 'Masculin' : 'Feminin' },
      { label: 'Age', value: `${getValue(data, 'personalInfo.age')} ans` },
      { label: 'Commune', value: getValue(data, 'personalInfo.communeHabitation') },
      { label: 'Niveau Scolaire', value: getValue(data, 'personalInfo.niveauAcademique') },
      { label: 'Dortoir', value: getValue(data, 'dormitoryInfo.dortoir') },
    ];

    const colWidth = (pageWidth - 2 * margin - 20) / 2;

    fields.forEach((field, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const x = margin + 10 + (col * (colWidth + 10));
      const y = yPos + (row * 15);

      doc.setTextColor(colors.gray[0], colors.gray[1], colors.gray[2]);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(field.label, x, y);

      doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      const maxWidth = colWidth - 10;
      const valueText = doc.splitTextToSize(field.value, maxWidth)[0];
      doc.text(valueText, x, y + 6);
    });

    // ===== INFORMATIONS MEDICALES =====

    yPos += 45;

    doc.setFillColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
    doc.rect(margin, yPos, pageWidth - 2 * margin, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('INFORMATIONS MEDICALES', margin + 5, yPos + 7);

    yPos += 15;

    doc.setFillColor(255, 255, 255);
    doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 35, 3, 3, 'FD');

    yPos += 10;

    // Allergie
    doc.setTextColor(colors.gray[0], colors.gray[1], colors.gray[2]);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Allergie', margin + 10, yPos);
    doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    const allergie = getValue(data, 'healthInfo.allergie');
    doc.text(allergie, margin + 10, yPos + 6);

    // Antecedent
    doc.setTextColor(colors.gray[0], colors.gray[1], colors.gray[2]);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Antecedent medical', margin + 10, yPos + 12);
    doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    const antecedent = getValue(data, 'healthInfo.antecedentMedical');
    doc.text(antecedent, margin + 10, yPos + 18);

    // ===== INFORMATIONS IMPORTANTES (NOUVEAU) =====

    yPos = 240;

    // Header avec icône
    doc.setFillColor(colors.accent[0], colors.accent[1], colors.accent[2]);
    doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');
    doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('INFORMATIONS IMPORTANTES', margin + 5, yPos + 5.5);

    yPos += 12;

    // Card avec fond clair
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(colors.gray[0], colors.gray[1], colors.gray[2]);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 33, 3, 3, 'FD');

    yPos += 5;

    // Liste des informations
    const importantInfo = [
      { label: 'Dates', value: '20 au 25 Decembre 2025' },
      { label: 'Lieu', value: 'Lycee Moderne de Cocody, Abidjan' },
      { label: 'Heure d\'arrivee', value: 'Samedi 20 Decembre a partir de 14h00' },
      { label: 'A apporter', value: 'Effets personnels, vetements, toilette, Coran, cahier' },
      { label: 'QR Code', value: 'Presentez cette fiche a l\'entree le jour J' },
      { label: 'Contacts', value: "+225 0545844135/ +225 0142080535 / +2250787944973" },

    ];

    doc.setFontSize(9);
    
    importantInfo.forEach((info, index) => {
      const y = yPos + (index * 5);
      
      // Label en gras
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(colors.gray[0], colors.gray[1], colors.gray[2]);
      doc.text(`${info.label}:`, margin + 5, y);
      
      // Value normale
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
      const maxWidth = pageWidth - 2 * margin - 40;
      const wrappedText = doc.splitTextToSize(info.value, maxWidth);
      doc.text(wrappedText[0], margin + 35, y);
    });

    // ===== FOOTER =====

    yPos = pageHeight - 7;

    doc.setDrawColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.setLineWidth(0.5);
    doc.line(margin, yPos - 3, pageWidth - margin, yPos - 3);

    doc.setFontSize(7);
    doc.setTextColor(colors.gray[0], colors.gray[1], colors.gray[2]);
    doc.setFont('helvetica', 'normal');
    doc.text(
      'AN NOUR 2025 - 7eme edition | (c) 2025 Tous droits réservés',
      pageWidth / 2,
      yPos,
      { align: 'center' }
    );

    doc.setFontSize(6.5);
    doc.text(
      'Pour une spiritualite etincelante...',
      pageWidth / 2,
      yPos + 4,
      { align: 'center' }
    );

    // Télécharger
    const filename = `Fiche-Inscription-AnNour-${matricule}.pdf`;
    doc.save(filename);
  }
};

export default PDFGenerator;
