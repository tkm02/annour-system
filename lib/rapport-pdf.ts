// Export PDF d'un rapport financier (jsPDF), à partir du détail renvoyé par GET /finances/rapports/{numero}.
import jsPDF from "jspdf"
import type { RapportDetail, TransactionResponse } from "./api"
import { formatDate, formatMontant } from "./format"

const ASCII_MONTANT = (n: number) => formatMontant(n) // espaces normales, compatibles avec la police helvetica

export function exportRapportPdf(detail: RapportDetail) {
  const { rapport } = detail
  const doc = new jsPDF()
  const margin = 15
  const width = doc.internal.pageSize.width
  const height = doc.internal.pageSize.height
  let y = 20

  const ensureSpace = (needed: number) => {
    if (y + needed > height - 15) {
      doc.addPage()
      y = 20
    }
  }

  doc.setFont("helvetica", "bold")
  doc.setFontSize(16)
  doc.text("SEMINAIRE AN-NOUR - Rapport financier", margin, y)
  y += 8
  doc.setFontSize(12)
  doc.text(`${rapport.numero} - ${rapport.titre}`, margin, y)
  y += 7
  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  doc.text(`Periode : ${formatDate(rapport.periode_debut)} au ${formatDate(rapport.periode_fin)} (${rapport.type_rapport})`, margin, y)
  y += 5
  doc.text(`Genere le ${formatDate(rapport.generated_at, true)} par ${rapport.generated_by}`, margin, y)
  y += 10

  doc.setFont("helvetica", "bold")
  doc.text(`Total des entrees : ${ASCII_MONTANT(rapport.total_entrees)}`, margin, y)
  y += 6
  doc.text(`Total des sorties : ${ASCII_MONTANT(rapport.total_sorties)}`, margin, y)
  y += 6
  doc.text(`Solde : ${ASCII_MONTANT(rapport.solde)}   (${rapport.nb_transactions} operations)`, margin, y)
  y += 10
  doc.setFont("helvetica", "normal")

  if (rapport.commentaires) {
    const lines = doc.splitTextToSize(`Commentaires : ${rapport.commentaires}`, width - 2 * margin)
    ensureSpace(lines.length * 5)
    doc.text(lines, margin, y)
    y += lines.length * 5 + 5
  }

  const section = (title: string, rows: TransactionResponse[]) => {
    ensureSpace(14)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(11)
    doc.text(`${title} (${rows.length})`, margin, y)
    y += 6
    doc.setFontSize(9)
    doc.text("Date", margin, y)
    doc.text("Categorie", margin + 25, y)
    doc.text("Libelle", margin + 65, y)
    doc.text("Montant", width - margin, y, { align: "right" })
    y += 2
    doc.line(margin, y, width - margin, y)
    y += 4
    doc.setFont("helvetica", "normal")
    for (const t of rows) {
      ensureSpace(6)
      doc.text(formatDate(t.date_transaction), margin, y)
      doc.text(doc.splitTextToSize(t.categorie, 38)[0] ?? "", margin + 25, y)
      doc.text(doc.splitTextToSize(t.libelle, width - margin * 2 - 100)[0] ?? "", margin + 65, y)
      doc.text(ASCII_MONTANT(t.montant), width - margin, y, { align: "right" })
      y += 5
    }
    y += 6
  }

  section("Entrees", detail.transactions_entrees)
  section("Sorties", detail.transactions_sorties)

  doc.save(`Rapport-${rapport.numero}.pdf`)
}
