/**
 * Sélection ordonnée de lignes (badges, attestations, bulletins).
 * L'ordre compte : la première clé sélectionnée alimente l'aperçu et l'ordre de génération du PDF.
 */

/** Ajoute les clés absentes à la fin, sans doublon ni réordonnancement. */
export function addToSelection(current: readonly string[], keys: readonly string[]): string[] {
  const present = new Set(current)
  const next = [...current]
  for (const key of keys) {
    if (!present.has(key)) {
      present.add(key)
      next.push(key)
    }
  }
  return next
}

/** Retire les clés données en conservant l'ordre des autres. */
export function removeFromSelection(current: readonly string[], keys: readonly string[]): string[] {
  const removed = new Set(keys)
  return current.filter((key) => !removed.has(key))
}

/**
 * Applique le nouvel ensemble renvoyé par le tableau (case cochée ou décochée) :
 * les clés déjà sélectionnées gardent leur rang, les nouvelles s'ajoutent à la fin.
 */
export function applySelection(current: readonly string[], next: ReadonlySet<string>): string[] {
  return addToSelection(current.filter((key) => next.has(key)), [...next])
}

/** Vrai si toutes les clés données sont sélectionnées (faux pour une liste vide). */
export function isAllSelected(current: readonly string[], keys: readonly string[]): boolean {
  if (keys.length === 0) return false
  const selected = new Set(current)
  return keys.every((key) => selected.has(key))
}
