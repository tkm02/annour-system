// Formats d'affichage communs (montants FCFA, dates) et téléchargement d'un Blob.

export function formatMontant(value: number | null | undefined): string {
  const n = typeof value === "number" && Number.isFinite(value) ? value : 0
  return `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(n).replace(/ | /g, " ")} F`
}

export function formatDate(value: string | null | undefined, withTime = false): string {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleString("fr-FR", withTime
    ? { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }
    : { day: "2-digit", month: "2-digit", year: "numeric" })
}

/** AAAA-MM-JJ local → ISO début de journée (UTC) pour les filtres de période. */
export function dayStartIso(day: string): string {
  return `${day}T00:00:00`
}

export function dayEndIso(day: string): string {
  return `${day}T23:59:59`
}

/** Valeur d'un <input type="datetime-local"> pour maintenant (heure locale). */
export function nowLocalInput(): string {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

/** <input type="datetime-local"> (heure locale) → ISO 8601 avec fuseau. */
export function localInputToIso(value: string): string {
  return new Date(value).toISOString()
}

/** ISO → valeur d'un <input type="datetime-local"> en heure locale. */
export function isoToLocalInput(value: string): string {
  const d = new Date(value)
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
