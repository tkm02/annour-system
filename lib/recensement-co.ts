// Recensement CO (back-office) : logique pure de l'écran /recensement-co — filtres, libellés, silhouettes,
// validation du motif de rejet et du formulaire de correction. Le serveur revalide tout.
import type { CandidatCorrespondanceCO, ParticipationCODetail, ParticipationCOListe, ParticipationCOUpdate, QualiteCO, SexeCO } from "./api"

export type Errors = Record<string, string>

/** Valeur « tous » des listes déroulantes (Radix Select n'accepte pas de valeur vide). */
export const ALL = "tous"

export const PAGE_SIZE = 20

export const QUALITE_LABELS: Record<QualiteCO, string> = {
  membre: "Membre",
  responsable: "Responsable",
  responsable_adjoint: "Responsable adjoint",
}

export const STATUTS = ["soumise", "a_verifier", "validee", "rejetee"] as const
export type StatutFiche = (typeof STATUTS)[number]

export const STATUT_LABELS: Record<StatutFiche, string> = {
  soumise: "Soumise",
  a_verifier: "À vérifier",
  validee: "Validée",
  rejetee: "Rejetée",
}

export const TYPE_LABELS: Record<string, string> = { ancien: "Ancien", nouveau: "Nouveau" }
export const SEXE_LABELS: Record<SexeCO, string> = { M: "Homme", F: "Femme" }

export const MOTIF_CORRESPONDANCE_LABELS: Record<string, string> = {
  multiple: "Plusieurs personnes connues portent cette identité",
  partielle: "Identité connue, mais téléphone, commission ou date de naissance différents",
  telephone: "Numéro de téléphone déjà connu sous une autre identité",
  email: "Email déjà utilisé par une autre personne",
}

const labelOr = (labels: Record<string, string>, value: string | null | undefined) =>
  value ? (Object.hasOwn(labels, value) ? labels[value] : value) : "—"

export const qualiteLabel = (qualite: string | null | undefined) => labelOr(QUALITE_LABELS, qualite)
export const statutLabel = (statut: string | null | undefined) => labelOr(STATUT_LABELS, statut)
export const typeLabel = (type: string | null | undefined) => labelOr(TYPE_LABELS, type)
export const sexeLabel = (sexe: string | null | undefined) => labelOr(SEXE_LABELS, sexe)
export const motifCorrespondanceLabel = (motif: string | null | undefined) => labelOr(MOTIF_CORRESPONDANCE_LABELS, motif)

// ---------------------------------------------------------------------------
// Filtres, pagination et export
// ---------------------------------------------------------------------------

export interface FiltresCO {
  q: string
  commission: string
  qualite: string
  sexe: string
  type: string
  statut: string
}

export const FILTRES_VIDES: FiltresCO = { q: "", commission: ALL, qualite: ALL, sexe: ALL, type: ALL, statut: ALL }

type Params = Record<string, string | number>

const QUALITES_VALIDES = Object.keys(QUALITE_LABELS)
const SEXES_VALIDES = ["M", "F"]
const TYPES_VALIDES = ["ancien", "nouveau"]

/** Paramètres de filtre acceptés par l'API (valeurs inconnues ou « tous » ignorées ; recherche ≤ 100 caractères). */
export function buildFilterParams(filtres: FiltresCO): Params {
  const params: Params = {}
  const q = filtres.q.trim().slice(0, 100)
  if (q) params.q = q
  const commission = filtres.commission.trim()
  if (commission && commission !== ALL) params.commission = commission.slice(0, 100)
  if (QUALITES_VALIDES.includes(filtres.qualite)) params.qualite = filtres.qualite
  if (SEXES_VALIDES.includes(filtres.sexe)) params.sexe = filtres.sexe
  if (TYPES_VALIDES.includes(filtres.type)) params.type = filtres.type
  if ((STATUTS as readonly string[]).includes(filtres.statut)) params.statut = filtres.statut
  return params
}

/** Liste paginée : filtres + skip/limit (page commence à 1). */
export function buildListParams(filtres: FiltresCO, page: number, limit = PAGE_SIZE): Params {
  const safePage = Number.isInteger(page) && page > 0 ? page : 1
  return { ...buildFilterParams(filtres), skip: (safePage - 1) * limit, limit }
}

export type ExportFormat = "csv" | "xlsx"

/** Export : format + mêmes filtres que la liste (sans pagination). */
export function buildExportParams(format: ExportFormat, filtres: FiltresCO): Params {
  return { format, ...buildFilterParams(filtres) }
}

/** Nom de repli si l'en-tête Content-Disposition n'est pas lisible (CORS). */
export function exportFilename(format: ExportFormat, edition: string | null | undefined): string {
  const code = (edition ?? "").replace(/[^A-Za-z0-9_-]/g, "")
  return `membres_co${code ? `_${code}` : ""}.${format}`
}

export function hasActiveFilters(filtres: FiltresCO): boolean {
  return Object.keys(buildFilterParams(filtres)).length > 0
}

// ---------------------------------------------------------------------------
// Silhouette de photo d'identité
// ---------------------------------------------------------------------------

export type Silhouette = "homme" | "femme" | "neutre"

export function silhouetteFor(sexe: string | null | undefined): Silhouette {
  const value = (sexe ?? "").trim().toUpperCase()
  if (value === "M") return "homme"
  if (value === "F") return "femme"
  return "neutre"
}

export const SILHOUETTE_LABELS: Record<Silhouette, string> = {
  homme: "Silhouette d'homme : photo non fournie",
  femme: "Silhouette de femme voilée : photo non fournie",
  neutre: "Silhouette neutre : photo non fournie",
}

/** Libellé court des listes (la version complète est réservée au détail). */
export const PHOTO_NON_FOURNIE = "Photo non fournie"

// ---------------------------------------------------------------------------
// Dates et téléphones
// ---------------------------------------------------------------------------

/** « 2001-03-09T00:00:00Z » → « 2001-03-09 » (date de naissance stockée à minuit UTC, sans conversion de fuseau). */
export function toDateInput(value: string | null | undefined): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value ?? "")
  return match ? `${match[1]}-${match[2]}-${match[3]}` : ""
}

/** Date de naissance → « 09/03/2001 », ou « — ». */
export function formatDateNaissance(value: string | null | undefined): string {
  const day = toDateInput(value)
  if (!day) return "—"
  const [y, m, d] = day.split("-")
  return `${d}/${m}/${y}`
}

/** Même règle que le serveur : chiffres seuls, indicatif 225 (avec + ou 00) retiré ; null si ce n'est pas un numéro. */
export function normaliserTelephone(value: string | null | undefined): string | null {
  if (!value) return null
  let digits = value.replace(/\D/g, "")
  if (value.trim().startsWith("00")) digits = digits.slice(2)
  if (digits.startsWith("225") && (digits.length === 11 || digits.length === 13)) digits = digits.slice(3)
  return digits.length === 8 || digits.length === 10 ? digits : null
}

function ageAt(day: string, today: Date): number | null {
  const [y, m, d] = day.split("-").map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null
  const ty = today.getFullYear(), tm = today.getMonth() + 1, td = today.getDate()
  return ty - y - (tm < m || (tm === m && td < d) ? 1 : 0)
}

// ---------------------------------------------------------------------------
// Rejet et correction
// ---------------------------------------------------------------------------

export const MOTIF_MIN = 3
export const MOTIF_MAX = 500

/** Motif de rejet : 3 à 500 caractères après suppression des espaces (règle du serveur). */
export function validateMotif(motif: string): string | null {
  const length = motif.trim().length
  if (length < MOTIF_MIN) return `Le motif est obligatoire (${MOTIF_MIN} caractères minimum).`
  if (length > MOTIF_MAX) return `Le motif ne doit pas dépasser ${MOTIF_MAX} caractères.`
  return null
}

export interface CorrectionForm {
  nom: string
  prenoms: string
  date_naissance: string
  sexe: string
  telephone: string
  email: string
  commission: string
  qualite: string
  allergies: string
  antecedents_medicaux: string
}

export const NOM_MAX = 80
export const SANTE_MAX = 1000
const AGE_MIN = 10
const AGE_MAX = 100
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function formFromDetail(detail: ParticipationCODetail): CorrectionForm {
  return {
    nom: detail.nom ?? "",
    prenoms: detail.prenoms ?? "",
    date_naissance: toDateInput(detail.date_naissance),
    sexe: detail.sexe === "M" || detail.sexe === "F" ? detail.sexe : "",
    telephone: detail.telephone ?? "",
    email: detail.email ?? "",
    commission: detail.commission ?? "",
    qualite: detail.qualite ?? "",
    allergies: detail.allergies ?? "",
    antecedents_medicaux: detail.antecedents_medicaux ?? "",
  }
}

const hasLetters = (value: string) => /\p{L}|\d/u.test(value)

/** Ordre d'affichage des champs du formulaire (focus sur le premier champ en erreur). */
export const CORRECTION_FIELDS: Array<keyof CorrectionForm> = [
  "nom", "prenoms", "date_naissance", "sexe", "telephone", "email", "commission", "qualite", "allergies", "antecedents_medicaux",
]

const isChanged = (form: CorrectionForm, initial: CorrectionForm, field: keyof CorrectionForm) =>
  form[field].trim() !== initial[field].trim()

/** Vrai si au moins un champ diffère de la fiche chargée (abandon à confirmer). */
export function correctionModifiee(form: CorrectionForm, initial: CorrectionForm): boolean {
  return CORRECTION_FIELDS.some((field) => isChanged(form, initial, field))
}

/** Premier champ en erreur dans l'ordre du formulaire. */
export function premierChampEnErreur(errors: Errors): keyof CorrectionForm | null {
  return CORRECTION_FIELDS.find((field) => !!errors[field]) ?? null
}

/** Données de santé déjà renseignées que la correction viderait (confirmation demandée). */
export function santeEffacee(form: CorrectionForm, initial: CorrectionForm): Array<"allergies" | "antecedents_medicaux"> {
  return (["allergies", "antecedents_medicaux"] as const).filter((f) => initial[f].trim() !== "" && form[f].trim() === "")
}

/**
 * Validation locale du formulaire de correction : seuls les champs **modifiés** sont contrôlés (même règle que
 * diffCorrection ; une fiche 2025 incomplète reste corrigeable champ par champ). Un champ déjà renseigné ne peut pas
 * être vidé : le serveur ignore les valeurs nulles (identité, contact) ou effacerait la date de naissance.
 */
export function validateCorrection(form: CorrectionForm, initial: CorrectionForm, today = new Date()): Errors {
  const errors: Errors = {}
  const changed = (field: keyof CorrectionForm) => isChanged(form, initial, field)
  for (const field of ["nom", "prenoms"] as const) {
    if (!changed(field)) continue
    const value = form[field].trim()
    if (!value) errors[field] = "Ce champ est obligatoire."
    else if (value.length > NOM_MAX) errors[field] = `${NOM_MAX} caractères maximum.`
    else if (!hasLetters(value)) errors[field] = "Ce champ doit contenir des lettres."
  }
  if (changed("date_naissance")) {
    if (form.date_naissance) {
      const age = /^\d{4}-\d{2}-\d{2}$/.test(form.date_naissance) ? ageAt(form.date_naissance, today) : null
      if (age === null || age < AGE_MIN || age > AGE_MAX) errors.date_naissance = "Date de naissance invalide."
    } else {
      errors.date_naissance = "La date de naissance ne peut pas être effacée."
    }
  }
  if (changed("sexe")) {
    if (!form.sexe) errors.sexe = "Le sexe est obligatoire."
    else if (form.sexe !== "M" && form.sexe !== "F") errors.sexe = "Valeur invalide."
  }
  if (changed("telephone")) {
    const telephone = form.telephone.trim()
    if (!telephone) errors.telephone = "Le téléphone est obligatoire."
    else if (normaliserTelephone(telephone)?.length !== 10) errors.telephone = "Numéro invalide (10 chiffres, avec ou sans +225)."
  }
  if (changed("email")) {
    const email = form.email.trim()
    if (!email) errors.email = "L'email est obligatoire."
    else if (!EMAIL_RE.test(email) || email.length > 254) errors.email = "Adresse email invalide."
  }
  if (changed("commission")) {
    if (!form.commission.trim()) errors.commission = "La commission est obligatoire."
    else if (form.commission.trim().length > 100) errors.commission = "100 caractères maximum."
  }
  if (changed("qualite") && !QUALITES_VALIDES.includes(form.qualite)) errors.qualite = "La qualité est obligatoire."
  for (const field of ["allergies", "antecedents_medicaux"] as const) {
    if (changed(field) && form[field].trim().length > SANTE_MAX) errors[field] = `${SANTE_MAX} caractères maximum.`
  }
  return errors
}

/** Corps du PATCH : uniquement les champs modifiés (chaîne vide pour effacer une donnée de santé). */
export function diffCorrection(form: CorrectionForm, initial: CorrectionForm): ParticipationCOUpdate {
  const update: ParticipationCOUpdate = {}
  const changed = (field: keyof CorrectionForm) => isChanged(form, initial, field)
  for (const field of ["nom", "prenoms", "telephone", "commission"] as const) {
    if (changed(field) && form[field].trim()) update[field] = form[field].trim()
  }
  if (changed("email") && form.email.trim()) update.email = form.email.trim().toLowerCase()
  if (changed("date_naissance") && form.date_naissance) update.date_naissance = form.date_naissance
  if (changed("sexe") && (form.sexe === "M" || form.sexe === "F")) update.sexe = form.sexe
  if (changed("qualite") && QUALITES_VALIDES.includes(form.qualite)) update.qualite = form.qualite as QualiteCO
  for (const field of ["allergies", "antecedents_medicaux"] as const) {
    if (changed(field)) update[field] = form[field].trim()
  }
  return update
}

/**
 * Erreur de l'API sur une correction → erreurs par champ et message général (409 = email déjà utilisé).
 * Une erreur 422 sur un champ absent du formulaire alimente le message général.
 */
export function correctionApiErrors(error: { status?: number; message?: string; fieldErrors?: Errors }): {
  fieldErrors: Errors
  formError: string | null
} {
  const message = error.message || "Correction impossible."
  if (error.status === 409) return { fieldErrors: { email: message }, formError: null }
  if (error.status === 422 && error.fieldErrors && Object.keys(error.fieldErrors).length > 0) {
    const fieldErrors: Errors = {}
    const autres: string[] = []
    for (const [path, msg] of Object.entries(error.fieldErrors)) {
      const field = path.split(".").pop() ?? path
      if ((CORRECTION_FIELDS as string[]).includes(field)) fieldErrors[field] = msg
      else autres.push(`${path} : ${msg}`)
    }
    return { fieldErrors, formError: autres.length ? autres.join("\n") : null }
  }
  return { fieldErrors: {}, formError: message }
}

// ---------------------------------------------------------------------------
// Cas à vérifier
// ---------------------------------------------------------------------------

const normText = (value: string | null | undefined) =>
  (value ?? "").normalize("NFD").replace(/\p{M}/gu, "").toUpperCase().split(/[^A-Z0-9]+/).filter(Boolean).sort().join(" ")

export type ChampComparable = "nom" | "prenoms" | "telephone" | "email" | "date_naissance"
export type Comparaison = "identique" | "different" | null

/**
 * Comparaison champ par champ de la fiche soumise et d'un candidat (accents, casse, ordre des mots et indicatif
 * ignorés) : « identique », « different », ou null si la valeur manque des deux côtés.
 */
export function comparerCandidat(fiche: ParticipationCOListe, candidat: CandidatCorrespondanceCO): Record<ChampComparable, Comparaison> {
  const cmp = (a: string, b: string): Comparaison => (!a && !b ? null : a && a === b ? "identique" : "different")
  const tel = normaliserTelephone(fiche.telephone) ?? (fiche.telephone ?? "").trim()
  const telsCandidat = candidat.telephones.map((t) => normaliserTelephone(t) ?? t.trim()).filter(Boolean)
  return {
    nom: cmp(normText(fiche.nom), normText(candidat.nom)),
    prenoms: cmp(normText(fiche.prenoms), normText(candidat.prenoms)),
    telephone: !tel && telsCandidat.length === 0 ? null : tel && telsCandidat.includes(tel) ? "identique" : "different",
    email: cmp((fiche.email ?? "").trim().toLowerCase(), (candidat.email ?? "").trim().toLowerCase()),
    date_naissance: cmp(toDateInput(fiche.date_naissance), toDateInput(candidat.date_naissance)),
  }
}

/** Champs identiques entre la fiche soumise et un candidat. */
export function champsIdentiques(fiche: ParticipationCOListe, candidat: CandidatCorrespondanceCO): Set<ChampComparable> {
  const resultat = comparerCandidat(fiche, candidat)
  return new Set((Object.keys(resultat) as ChampComparable[]).filter((k) => resultat[k] === "identique"))
}

export interface ChangementFusion {
  champ: "nom" | "prenoms" | "date_naissance" | "sexe" | "telephone" | "email"
  libelle: string
  /** Valeur actuelle de la personne connue ; null = vide ; undefined = non communiquée par l'API */
  avant: string | null | undefined
  apres: string | null
}

/**
 * Champs d'identité de la personne connue remplacés par ceux de la fiche soumise lors d'une fusion (le serveur
 * recopie nom, prénoms, date de naissance, sexe, téléphone et email ; les anciens numéros restent connus).
 * Sexe : comparé à la valeur actuelle du candidat ; si l'API ne la communique pas (null/absent), il est signalé
 * avec une valeur actuelle « non communiquée » dès que la fiche en porte un.
 */
export function changementsFusion(fiche: ParticipationCOListe, candidat: CandidatCorrespondanceCO): ChangementFusion[] {
  const out: ChangementFusion[] = []
  const vide = (v: string | null | undefined) => (v ?? "").trim() || null
  const push = (champ: ChangementFusion["champ"], libelle: string, avant: string | null | undefined, apres: string | null) =>
    out.push({ champ, libelle, avant, apres })
  if (vide(candidat.nom) !== vide(fiche.nom)) push("nom", "Nom", vide(candidat.nom), vide(fiche.nom))
  if (vide(candidat.prenoms) !== vide(fiche.prenoms)) push("prenoms", "Prénoms", vide(candidat.prenoms), vide(fiche.prenoms))
  const dateAvant = toDateInput(candidat.date_naissance)
  const dateApres = toDateInput(fiche.date_naissance)
  if (dateAvant !== dateApres) {
    push("date_naissance", "Date de naissance",
      dateAvant ? formatDateNaissance(dateAvant) : null, dateApres ? formatDateNaissance(dateApres) : null)
  }
  if (candidat.sexe) {
    if (candidat.sexe !== fiche.sexe) push("sexe", "Sexe", sexeLabel(candidat.sexe), fiche.sexe ? sexeLabel(fiche.sexe) : null)
  } else if (fiche.sexe) {
    push("sexe", "Sexe", undefined, sexeLabel(fiche.sexe))
  }
  if (comparerCandidat(fiche, candidat).telephone === "different") {
    push("telephone", "Téléphone", candidat.telephones.length ? candidat.telephones.join(", ") : null, vide(fiche.telephone))
  }
  if ((candidat.email ?? "").trim().toLowerCase() !== (fiche.email ?? "").trim().toLowerCase()) {
    push("email", "Email", vide(candidat.email), vide(fiche.email))
  }
  return out
}

/** Page à afficher quand la page courante est devenue vide après une action (ex. dernier élément traité). */
export function pageRecalee(page: number, total: number, rowsOnPage: number, limit = PAGE_SIZE): number {
  if (page <= 1 || rowsOnPage > 0) return page
  return Math.max(1, Math.min(page, Math.ceil(total / limit)))
}

/** Nombre de filtres actifs hors recherche (bouton « Filtres (n) » sur mobile). */
export function nombreFiltresActifs(filtres: FiltresCO): number {
  return Object.keys(buildFilterParams({ ...filtres, q: "" })).length
}
