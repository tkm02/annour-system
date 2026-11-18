// F-S6 : PDF de la fiche de consultation, construit UNIQUEMENT à partir de GET /sante/consultations/{id}/export
// (l'appel est tracé côté serveur). Sections de la maquette : informations générales, consultation,
// informations médicales complémentaires.
import jsPDF from "jspdf"
import type { Consultation, FicheMedicale } from "./api"
import { formatDate } from "./format"

/** Helvetica (jsPDF) ne couvre pas tous les caractères : on retire seulement ce qu'elle ne sait pas afficher. */
const safe = (value: string | number | null | undefined) =>
  String(value ?? "—").replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, "-")

export function exportConsultationPdf(data: { fiche: FicheMedicale; consultation: Consultation }) {
  const { fiche, consultation } = data
  const doc = new jsPDF()
  const margin = 15
  const width = doc.internal.pageSize.width
  const height = doc.internal.pageSize.height
  const usable = width - 2 * margin
  let y = 18

  const ensure = (needed: number) => {
    if (y + needed > height - 15) {
      doc.addPage()
      y = 18
    }
  }

  const title = (text: string) => {
    ensure(14)
    doc.setFillColor(0, 69, 118) // bleu An-Nour
    doc.rect(margin, y, usable, 8, "F")
    doc.setTextColor(255, 255, 255)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(11)
    doc.text(text, margin + 3, y + 5.5)
    doc.setTextColor(0, 0, 0)
    y += 13
  }

  const pair = (label: string, value: string | number | null | undefined, x: number) => {
    doc.setFont("helvetica", "bold")
    doc.setFontSize(9)
    doc.text(label, x, y)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(10)
    doc.text(doc.splitTextToSize(safe(value), usable / 2 - 4)[0] ?? "", x, y + 5)
  }

  const block = (label: string, value: string | null | undefined) => {
    doc.setFont("helvetica", "bold")
    doc.setFontSize(9)
    ensure(10)
    doc.text(label, margin, y)
    y += 5
    doc.setFont("helvetica", "normal")
    doc.setFontSize(10)
    const lines = doc.splitTextToSize(safe(value), usable)
    for (const line of lines) {
      ensure(5)
      doc.text(line, margin, y)
      y += 5
    }
    y += 3
  }

  // En-tête
  doc.setFont("helvetica", "bold")
  doc.setFontSize(15)
  doc.text("SEMINAIRE AN-NOUR", width / 2, y, { align: "center" })
  y += 7
  doc.setFontSize(12)
  doc.text("Fiche de consultation medicale", width / 2, y, { align: "center" })
  y += 5
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.text("Document medical confidentiel", width / 2, y, { align: "center" })
  y += 8

  const p = fiche.patient
  title("1. Informations generales")
  pair("Matricule", p.matricule, margin)
  pair("Nom et prenoms", p.nom_prenoms, margin + usable / 2)
  y += 12
  pair("Sexe", p.sexe, margin)
  pair(p.date_naissance ? "Date de naissance" : "Age", p.date_naissance ? formatDate(p.date_naissance) : `${p.age} ans`, margin + usable / 2)
  y += 12
  pair("Niveau (seminaire)", p.niveau || "Non attribue", margin)
  pair("Niveau scolaire", p.niveau_scolaire, margin + usable / 2)
  y += 12
  pair("Dortoir", p.dortoir ?? p.dortoir_code, margin)
  y += 14

  title("2. Consultation")
  pair("Date", formatDate(consultation.date_consultation, true), margin)
  pair("Medecin responsable", consultation.medecin_responsable ?? consultation.medecin_responsable_id, margin + usable / 2)
  y += 14
  block("Motif de la consultation", consultation.motif_consultation)
  block("Observations / diagnostic", consultation.observations_diagnostic)
  block("Traitement prescrit", consultation.traitement_prescrit)
  block("Notes medicales supplementaires", consultation.notes_medicales_supplementaires)

  const infos = fiche.informations_medicales
  title("3. Informations medicales complementaires")
  block("Contact du parent", infos.contact_parent)
  block("Allergies", infos.allergies)
  block("Antecedents medicaux", infos.antecedents_medicaux)

  ensure(10)
  doc.setFontSize(8)
  doc.setTextColor(110, 110, 110)
  doc.text(`Edite le ${formatDate(new Date().toISOString(), true)} - consultation ${consultation.id}`, margin, height - 10)

  doc.save(`Consultation-${p.matricule}-${consultation.date_consultation.slice(0, 10)}.pdf`)
}
