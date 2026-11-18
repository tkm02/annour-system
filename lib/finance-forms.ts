// Formulaires Finances : validation locale et corps envoyés (le serveur revalide tout).
import type { DonCreate, PaymentDecision, SortieCreate, SortieUpdate, TransactionResponse, VenteCreate } from "./api"

export const MODES_PAIEMENT = ["Espèces", "Wave", "Orange Money", "MTN Money", "Moov Money", "Virement", "Chèque"]
export const CATEGORIES_SORTIE = ["Achat matériel", "Nourriture", "Transport", "Location", "Communication", "Salaires", "Santé", "Autre"]
export const DELETE_REASON_MIN = 10 // règle du serveur (TransactionDelete)

export type Errors = Record<string, string>

/** Montant saisi (virgule ou point, espaces tolérés) → nombre > 0, sinon null. */
export function parseMontant(raw: string): number | null {
  const normalized = raw.replace(/[\s  ]/g, "").replace(",", ".")
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null
  const value = Number(normalized)
  return value > 0 ? value : null
}

/** Valeur datetime-local (heure locale) → ISO, ou undefined (le serveur prend « maintenant »). */
const toIso = (local: string) => (local ? new Date(local).toISOString() : undefined)

function checkFuture(local: string, errors: Errors) {
  if (local && new Date(local).getTime() > Date.now() + 60_000) errors.date_transaction = "La date ne peut pas être dans le futur"
}

export interface EntreeForm {
  kind: "don" | "vente"
  montant: string
  donateur: string
  libelle: string
  description: string
  mode_paiement: string
  date_transaction: string // datetime-local
}

export function validateEntree(form: EntreeForm): Errors {
  const errors: Errors = {}
  if (parseMontant(form.montant) === null) errors.montant = "Montant invalide (nombre supérieur à 0)"
  if (form.kind === "don" && !form.donateur.trim()) errors.donateur = "Donateur obligatoire"
  if (form.kind === "vente" && !form.libelle.trim()) errors.libelle = "Libellé obligatoire"
  checkFuture(form.date_transaction, errors)
  return errors
}

export function buildDon(form: EntreeForm): DonCreate {
  return {
    montant: parseMontant(form.montant) as number,
    donateur: form.donateur.trim(),
    ...(form.description.trim() ? { description: form.description.trim() } : {}),
    ...(form.mode_paiement ? { mode_paiement: form.mode_paiement } : {}),
    ...(form.date_transaction ? { date_transaction: toIso(form.date_transaction) } : {}),
  }
}

export function buildVente(form: EntreeForm): VenteCreate {
  return {
    montant: parseMontant(form.montant) as number,
    libelle: form.libelle.trim(),
    ...(form.description.trim() ? { description: form.description.trim() } : {}),
    ...(form.mode_paiement ? { mode_paiement: form.mode_paiement } : {}),
    ...(form.date_transaction ? { date_transaction: toIso(form.date_transaction) } : {}),
  }
}

export interface SortieForm {
  categorie: string
  montant: string
  libelle: string
  beneficiaire: string
  mode_paiement: string
  date_transaction: string // datetime-local
}

export function validateSortie(form: SortieForm): Errors {
  const errors: Errors = {}
  if (!form.categorie.trim()) errors.categorie = "Catégorie obligatoire"
  if (parseMontant(form.montant) === null) errors.montant = "Montant invalide (nombre supérieur à 0)"
  if (!form.libelle.trim()) errors.libelle = "Libellé obligatoire"
  checkFuture(form.date_transaction, errors)
  return errors
}

export function buildSortie(form: SortieForm): SortieCreate {
  return {
    categorie: form.categorie.trim(),
    montant: parseMontant(form.montant) as number,
    libelle: form.libelle.trim(),
    ...(form.beneficiaire.trim() ? { beneficiaire: form.beneficiaire.trim() } : {}),
    ...(form.mode_paiement ? { mode_paiement: form.mode_paiement } : {}),
    ...(form.date_transaction ? { date_transaction: toIso(form.date_transaction) } : {}),
  }
}

/**
 * Modification partielle : seuls les champs changés sont envoyés.
 * `null` n'est autorisé que pour le bénéficiaire (le serveur refuse null sur les autres champs).
 */
export function diffSortie(original: TransactionResponse, form: SortieForm): SortieUpdate {
  const next = buildSortie(form)
  const update: SortieUpdate = {}
  if (next.categorie !== original.categorie) update.categorie = next.categorie
  if (next.montant !== original.montant) update.montant = next.montant
  if (next.libelle !== original.libelle) update.libelle = next.libelle
  const beneficiaire = form.beneficiaire.trim() || null
  if (beneficiaire !== (original.beneficiaire ?? null)) update.beneficiaire = beneficiaire
  if (next.mode_paiement && next.mode_paiement !== original.mode_paiement) update.mode_paiement = next.mode_paiement
  if (next.date_transaction && new Date(next.date_transaction).getTime() !== new Date(original.date_transaction).getTime()) {
    update.date_transaction = next.date_transaction
  }
  return update
}

export function validateDeleteReason(reason: string): string | null {
  return reason.trim().length < DELETE_REASON_MIN ? `Motif obligatoire (${DELETE_REASON_MIN} caractères minimum)` : null
}

export interface RapportForm {
  titre: string
  type_rapport: string
  periode_debut: string // AAAA-MM-JJ
  periode_fin: string
  commentaires: string
}

export const TYPES_RAPPORT: Array<{ value: string; label: string }> = [
  { value: "mensuel", label: "Mensuel" },
  { value: "trimestriel", label: "Trimestriel" },
  { value: "annuel", label: "Annuel" },
  { value: "personnalise", label: "Personnalisé" },
]

export function validateRapport(form: RapportForm): Errors {
  const errors: Errors = {}
  if (!form.titre.trim()) errors.titre = "Titre obligatoire"
  if (!TYPES_RAPPORT.some((t) => t.value === form.type_rapport)) errors.type_rapport = "Type obligatoire"
  if (!form.periode_debut) errors.periode_debut = "Date de début obligatoire"
  if (!form.periode_fin) errors.periode_fin = "Date de fin obligatoire"
  if (form.periode_debut && form.periode_fin && form.periode_fin < form.periode_debut) {
    errors.periode_fin = "La fin doit être postérieure au début"
  }
  return errors
}

/** Période incluse : du début du premier jour à la fin du dernier jour. */
export function buildRapport(form: RapportForm) {
  return {
    titre: form.titre.trim(),
    type_rapport: form.type_rapport as "mensuel" | "trimestriel" | "annuel" | "personnalise",
    periode_debut: `${form.periode_debut}T00:00:00`,
    periode_fin: `${form.periode_fin}T23:59:59`,
    ...(form.commentaires.trim() ? { commentaires: form.commentaires.trim() } : {}),
  }
}

// Validation manuelle d'un paiement (F-F6) : motif de 3 à 500 caractères, transaction obligatoire pour valider
export const MOTIF_MIN = 3
export const MOTIF_MAX = 500

export function validateDecision(d: PaymentDecision): string | null {
  const motif = d.motif.trim()
  if (motif.length < MOTIF_MIN) return `Motif obligatoire (${MOTIF_MIN} caractères minimum)`
  if (motif.length > MOTIF_MAX) return `Motif trop long (${MOTIF_MAX} caractères maximum)`
  if (d.decision === "verifie" && !d.transaction_id?.trim()) return "ID de transaction obligatoire pour valider"
  return null
}
