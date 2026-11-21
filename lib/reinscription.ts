// Réinscription des séminaristes de l'édition précédente (TAF lot 2) : repère par inscription, filtre de la liste,
// validation du matricule précédent saisi par l'administration et messages d'erreur. Le serveur revalide tout.
import type { Seminariste } from "./api"

export type ReinscriptionStatut = "ancien" | "a_verifier"

export const REINSCRIPTION_LABELS: Record<ReinscriptionStatut, string> = {
  ancien: "Ancien (confirmé)",
  a_verifier: "Ancien déclaré — à vérifier",
}

type Champs = Pick<Seminariste, "matricule_precedent" | "reinscription_a_verifier">

/**
 * Repère d'une inscription : « ancien » si elle est liée à l'édition précédente, « a_verifier » si la personne a
 * déclaré avoir participé sans correspondance complète, sinon null (nouvelle inscription ou champs absents de l'API).
 */
export function reinscriptionStatut(s: Champs): ReinscriptionStatut | null {
  if (typeof s.matricule_precedent === "string" && s.matricule_precedent.trim()) return "ancien"
  if (s.reinscription_a_verifier === true) return "a_verifier"
  return null
}

/** Filtre de la liste : « tous », « a_verifier » (réinscriptions à vérifier) ou « ancien ». */
export const REINSCRIPTION_FILTRES: Array<[string, string]> = [
  ["a_verifier", "Réinscriptions à vérifier"],
  ["ancien", "Anciens confirmés"],
]

export function matchesReinscriptionFilter(s: Champs, filtre: string): boolean {
  if (filtre !== "a_verifier" && filtre !== "ancien") return true
  return reinscriptionStatut(s) === filtre
}

export const MATRICULE_MAX = 40

/** Matricule saisi → forme canonique (espaces supprimés, majuscules), comme la comparaison du serveur. */
export function normaliserMatricule(raw: string): string {
  return raw.replace(/\s+/g, "").toUpperCase()
}

/** Matricule précédent : obligatoire, lettres/chiffres/tirets, différent du matricule de l'inscription elle-même. */
export function validateMatriculePrecedent(raw: string, matriculeActuel: string): string | null {
  const value = normaliserMatricule(raw)
  if (!value) return "Le matricule de l'an dernier est obligatoire."
  if (value.length > MATRICULE_MAX) return `${MATRICULE_MAX} caractères maximum.`
  if (!/^[A-Z0-9][A-Z0-9_-]*$/.test(value)) return "Format invalide : lettres, chiffres et tirets uniquement."
  if (value === normaliserMatricule(matriculeActuel)) return "Indiquez le matricule de l'édition précédente, pas celui de cette inscription."
  return null
}

/** Message d'erreur du PATCH : texte du serveur, ou repli explicite pour 404 / 409. */
export function reinscriptionErrorMessage(error: { status?: number; message?: string; detail?: unknown }): string {
  const serverText = typeof error.detail === "string" && error.detail.trim() ? error.detail : null
  if (serverText) return serverText
  if (error.status === 404) return "Inscription introuvable : vérifiez le matricule de l'an dernier."
  if (error.status === 409) return "Cette inscription de l'an dernier est déjà liée à une autre inscription de cette édition."
  return error.message || "Opération impossible."
}
