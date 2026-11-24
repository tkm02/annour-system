// Formulaire d'inscription : validation locale et construction du corps attendu par POST /registrations.
// Aucun import d'exécution : ce module est testé directement par `npm test`.
import type { FieldErrors, RegistrationPayload } from "./api"

export const COMMUNE_AUTRE = "Autre"
export const MIN_AGE = 5
export const MAX_AGE = 100

export interface RegistrationFormValues {
  nom: string
  prenom: string
  dateNaissance: string // AAAA-MM-JJ
  sexe: "" | "M" | "F"
  communeHabitation: string
  communeAutre: string
  niveauAcademique: string
  contactSeminariste: string
  contactParent: string
  dortoirId: string
  dortoirNom: string
  allergie: string
  antecedentMedical: string
  transactionId: string
}

export const EMPTY_REGISTRATION_FORM: RegistrationFormValues = {
  nom: "",
  prenom: "",
  dateNaissance: "",
  sexe: "",
  communeHabitation: "",
  communeAutre: "",
  niveauAcademique: "",
  contactSeminariste: "",
  contactParent: "",
  dortoirId: "",
  dortoirNom: "",
  allergie: "",
  antecedentMedical: "",
  transactionId: "",
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

/** Âge révolu à la date du jour, ou null si la date est absente ou invalide. */
export function computeAge(dateNaissance: string, today: Date = new Date()): number | null {
  if (!ISO_DATE.test(dateNaissance)) return null
  const [y, m, d] = dateNaissance.split("-").map(Number)
  const birth = new Date(Date.UTC(y, m - 1, d))
  if (birth.getUTCFullYear() !== y || birth.getUTCMonth() !== m - 1 || birth.getUTCDate() !== d) return null
  let age = today.getUTCFullYear() - y
  const beforeBirthday =
    today.getUTCMonth() < m - 1 || (today.getUTCMonth() === m - 1 && today.getUTCDate() < d)
  if (beforeBirthday) age -= 1
  return age
}

const countDigits = (value: string) => (value.match(/\d/g) ?? []).length

function checkPhone(value: string, required: boolean): string | null {
  const v = value.trim()
  if (!v) return required ? "Contact obligatoire" : null
  if (v.length > 30 || !/^[+\d\s().-]+$/.test(v) || countDigits(v) < 8) return "Numéro de téléphone invalide"
  return null
}

/** Validation locale (le serveur revalide tout) : renvoie les erreurs par nom de champ du formulaire. */
export function validateRegistrationForm(values: RegistrationFormValues, today: Date = new Date()): FieldErrors {
  const errors: FieldErrors = {}
  const required: Array<[keyof RegistrationFormValues, string]> = [
    ["nom", "Nom obligatoire"],
    ["prenom", "Prénom obligatoire"],
    ["dateNaissance", "Date de naissance obligatoire"],
    ["sexe", "Sexe obligatoire"],
    ["communeHabitation", "Commune obligatoire"],
    ["niveauAcademique", "Niveau académique obligatoire"],
    ["dortoirId", "Dortoir obligatoire"],
    ["transactionId", "ID de transaction Wave obligatoire"],
  ]
  for (const [field, message] of required) {
    if (!String(values[field] ?? "").trim()) errors[field] = message
  }

  for (const field of ["nom", "prenom", "communeAutre", "transactionId"] as const) {
    if (values[field].trim().length > 100) errors[field] = "100 caractères maximum"
  }
  for (const field of ["allergie", "antecedentMedical"] as const) {
    if (values[field].trim().length > 2000) errors[field] = "2 000 caractères maximum"
  }

  if (values.communeHabitation === COMMUNE_AUTRE && !values.communeAutre.trim()) {
    errors.communeAutre = "Préciser la commune"
  }

  if (values.dateNaissance) {
    const age = computeAge(values.dateNaissance, today)
    if (age === null || age < 0) errors.dateNaissance = "Date de naissance invalide"
    else if (age < MIN_AGE) errors.dateNaissance = `Âge minimum : ${MIN_AGE} ans`
    else if (age > MAX_AGE) errors.dateNaissance = `Âge maximum : ${MAX_AGE} ans`
  }

  const parent = checkPhone(values.contactParent, true)
  if (parent) errors.contactParent = parent
  const seminariste = checkPhone(values.contactSeminariste, false)
  if (seminariste) errors.contactSeminariste = seminariste

  return errors
}

/** Corps de POST /registrations (noms de champs du serveur). */
// fee : tarif affiché par GET /registrations/status (informatif, le serveur applique toujours son propre tarif)
export function buildRegistrationPayload(values: RegistrationFormValues, fee = 0, today: Date = new Date()): RegistrationPayload {
  const age = computeAge(values.dateNaissance, today)
  const autre = values.communeHabitation === COMMUNE_AUTRE ? values.communeAutre.trim() : ""
  return {
    personalInfo: {
      nom: values.nom.trim(),
      prenom: values.prenom.trim(),
      sexe: values.sexe as "M" | "F",
      age: age === null ? "" : String(age),
      // Le serveur enregistre communeHabitation : on y place la commune précisée quand « Autre » est choisi
      communeHabitation: autre || values.communeHabitation.trim(),
      communeAutre: autre,
      niveauAcademique: values.niveauAcademique.trim(),
      contactParent: values.contactParent.trim(),
      contactSeminariste: values.contactSeminariste.trim(),
      dateNaissance: values.dateNaissance || undefined,
    },
    dormitoryInfo: { dortoir: values.dortoirNom.trim(), dortoirId: values.dortoirId.trim() },
    healthInfo: {
      allergie: values.allergie.trim() || "RAS",
      antecedentMedical: values.antecedentMedical.trim() || "Néant",
    },
    paymentInfo: { transactionId: values.transactionId.trim(), amount: fee },
  }
}

/**
 * Erreurs 422 du serveur (clé "personalInfo.nom", "paymentInfo.transactionId"...) → champs du formulaire.
 * Une erreur sur un bloc entier (ex. "personalInfo", règle métier) est rattachée à "_form".
 */
export function mapServerFieldErrors(serverErrors: FieldErrors): FieldErrors {
  const mapped: FieldErrors = {}
  const known = new Set(Object.keys(EMPTY_REGISTRATION_FORM))
  for (const [path, message] of Object.entries(serverErrors)) {
    const parts = path.split(".")
    let field = parts.length > 1 ? parts[parts.length - 1] : "_form"
    if (field === "dortoir") field = "dortoirId"
    if (!known.has(field)) field = "_form"
    mapped[field] = mapped[field] ? `${mapped[field]} ; ${message}` : message
  }
  return mapped
}
