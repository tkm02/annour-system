// Logique pure des tableaux du back-office (tri, recherche, pagination), testée par tests/table.test.mjs.
// Aucune donnée n'est envoyée ni stockée : ces fonctions opèrent sur les lignes déjà chargées.

export type SortDirection = "asc" | "desc"
export type SortValue = string | number | Date | boolean | null | undefined

const collator = new Intl.Collator("fr", { sensitivity: "base", numeric: true })

/** Normalise un texte pour la recherche : minuscules, sans accents, espaces réduits. */
export function normalizeText(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
}

/** Vrai si tous les mots de la requête apparaissent dans au moins un des champs (ordre indifférent). */
export function matchesSearch(query: string, fields: unknown[]): boolean {
  const terms = normalizeText(query).split(" ").filter(Boolean)
  if (terms.length === 0) return true
  const haystack = fields.map(normalizeText).join(" ")
  return terms.every((term) => haystack.includes(term))
}

/** Compare deux valeurs : vides toujours en dernier, nombres et dates par valeur, texte selon l'ordre français. */
export function compareValues(a: SortValue, b: SortValue, direction: SortDirection = "asc"): number {
  const emptyA = a === null || a === undefined || a === ""
  const emptyB = b === null || b === undefined || b === ""
  if (emptyA || emptyB) return emptyA === emptyB ? 0 : emptyA ? 1 : -1
  let result: number
  if (a instanceof Date && b instanceof Date) result = a.getTime() - b.getTime()
  else if (typeof a === "number" && typeof b === "number") result = a - b
  else if (typeof a === "boolean" && typeof b === "boolean") result = Number(a) - Number(b)
  else result = collator.compare(String(a), String(b))
  return direction === "asc" ? result : -result
}

/** Tri stable (copie) selon une valeur extraite de chaque ligne. */
export function sortRows<T>(rows: readonly T[], getValue: (row: T) => SortValue, direction: SortDirection): T[] {
  return rows
    .map((row, index) => ({ row, index }))
    .sort((x, y) => compareValues(getValue(x.row), getValue(y.row), direction) || x.index - y.index)
    .map((entry) => entry.row)
}

/** Nombre de pages (au moins 1). */
export function pageCount(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(Math.max(0, total) / Math.max(1, pageSize)))
}

/** Page bornée dans [1, nombre de pages]. */
export function clampPage(page: number, total: number, pageSize: number): number {
  return Math.min(Math.max(1, Math.floor(page) || 1), pageCount(total, pageSize))
}

/** Lignes de la page demandée (pagination côté client). */
export function paginate<T>(rows: readonly T[], page: number, pageSize: number): T[] {
  const safePage = clampPage(page, rows.length, pageSize)
  const start = (safePage - 1) * pageSize
  return rows.slice(start, start + pageSize)
}

/** Libellé du compteur : « 128 séminaristes » ou « 24 sur 128 séminaristes » si un filtre réduit la liste. */
export function countLabel(shown: number, total: number, singular: string, plural: string): string {
  const fmt = (n: number) => n.toLocaleString("fr-FR")
  const noun = total > 1 ? plural : singular
  return shown === total ? `${fmt(total)} ${noun}` : `${fmt(shown)} sur ${fmt(total)} ${noun}`
}
