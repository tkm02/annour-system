// Consultations médicales : validation locale et corps envoyés (le serveur revalide tout).
import type { Consultation, ConsultationCreate, ConsultationUpdate } from "./api"

export const CLINICAL_MAX = 2000

export interface ConsultationFormValues {
  date_consultation: string // datetime-local (heure locale)
  motif_consultation: string
  observations_diagnostic: string
  traitement_prescrit: string
  notes_medicales_supplementaires: string
  medecin_responsable_id: string
}

export type Errors = Record<string, string>

const CLINICAL_FIELDS: Array<[keyof ConsultationFormValues, string]> = [
  ["motif_consultation", "Motif"],
  ["observations_diagnostic", "Observations / diagnostic"],
  ["traitement_prescrit", "Traitement"],
]

/**
 * Règles du serveur : date non future, textes cliniques de 1 à 2 000 caractères,
 * médecin obligatoire pour un admin (un utilisateur « sante » est le médecin par défaut).
 */
export function validateConsultation(values: ConsultationFormValues, requireMedecin: boolean, now: Date = new Date()): Errors {
  const errors: Errors = {}
  if (!values.date_consultation) {
    errors.date_consultation = "Date obligatoire"
  } else {
    const date = new Date(values.date_consultation)
    if (Number.isNaN(date.getTime())) errors.date_consultation = "Date invalide"
    else if (date.getTime() > now.getTime() + 60_000) errors.date_consultation = "La date ne peut pas être dans le futur"
  }
  for (const [field, label] of CLINICAL_FIELDS) {
    const text = values[field].trim()
    if (!text) errors[field] = `${label} obligatoire`
    else if (text.length > CLINICAL_MAX) errors[field] = `${CLINICAL_MAX} caractères maximum`
  }
  if (values.notes_medicales_supplementaires.trim().length > CLINICAL_MAX) {
    errors.notes_medicales_supplementaires = `${CLINICAL_MAX} caractères maximum`
  }
  if (requireMedecin && !values.medecin_responsable_id) errors.medecin_responsable_id = "Choisir le médecin responsable"
  return errors
}

export function buildConsultation(values: ConsultationFormValues, sendMedecin: boolean): ConsultationCreate {
  return {
    date_consultation: new Date(values.date_consultation).toISOString(),
    motif_consultation: values.motif_consultation.trim(),
    observations_diagnostic: values.observations_diagnostic.trim(),
    traitement_prescrit: values.traitement_prescrit.trim(),
    notes_medicales_supplementaires: values.notes_medicales_supplementaires.trim() || null,
    // Utilisateur « sante » : il est le médecin par défaut, on n'envoie pas le champ
    ...(sendMedecin && values.medecin_responsable_id ? { medecin_responsable_id: values.medecin_responsable_id } : {}),
  }
}

/** Modification : uniquement les champs changés (le patient rattaché ne change jamais). */
export function diffConsultation(original: Consultation, values: ConsultationFormValues, sendMedecin: boolean): ConsultationUpdate {
  const next = buildConsultation(values, sendMedecin)
  const update: ConsultationUpdate = {}
  if (new Date(next.date_consultation).getTime() !== new Date(original.date_consultation).getTime()) {
    update.date_consultation = next.date_consultation
  }
  for (const field of ["motif_consultation", "observations_diagnostic", "traitement_prescrit"] as const) {
    if (next[field] !== original[field]) update[field] = next[field]
  }
  if ((next.notes_medicales_supplementaires ?? null) !== (original.notes_medicales_supplementaires ?? null)) {
    update.notes_medicales_supplementaires = next.notes_medicales_supplementaires ?? null
  }
  if (next.medecin_responsable_id && next.medecin_responsable_id !== original.medecin_responsable_id) {
    update.medecin_responsable_id = next.medecin_responsable_id
  }
  return update
}

export interface InfosFormValues {
  contact_parent: string
  allergies: string
  antecedents_medicaux: string
  date_naissance: string
}

/** Informations médicales : champs modifiés seulement ; allergies/antécédents vidés → null ; contact non vide. */
export function diffInformations(
  original: { contact_parent: string; allergies: string | null; antecedents_medicaux: string | null; date_naissance: string | null },
  values: InfosFormValues,
): { update: Record<string, string | null>; error: string | null } {
  const update: Record<string, string | null> = {}
  const contact = values.contact_parent.trim()
  if (!contact) return { update, error: "Le contact du parent ne peut pas être vide" }
  if (contact !== original.contact_parent) update.contact_parent = contact
  for (const field of ["allergies", "antecedents_medicaux"] as const) {
    const value = values[field].trim() || null
    if (value !== (original[field] ?? null)) update[field] = value
  }
  if (values.date_naissance && values.date_naissance !== (original.date_naissance ?? "")) update.date_naissance = values.date_naissance
  if (Object.keys(update).length === 0) return { update, error: "Aucune modification" }
  return { update, error: null }
}
