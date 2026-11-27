// F-Q3 : données de l'édition du séminaire, utilisées par les certificats, bulletins, badges et fiches PDF.
// À mettre à jour à chaque nouvelle édition (ou à surcharger par les variables NEXT_PUBLIC_EDITION_* sur Vercel).
// Valeurs par défaut : édition 2026 (An-Nour 8.0), reprises du site public (annour.ci) le 2026-11-24 ; le lieu
// exact reste à confirmer (voir `lieu`).
//
// Next.js n'intègre une variable NEXT_PUBLIC_* au code envoyé au navigateur que si elle est lue littéralement
// (process.env.NEXT_PUBLIC_X) : chaque variable est donc lue explicitement. Aucun secret ici.

const env = (value: string | undefined, fallback: string) => (value && value.trim() ? value.trim() : fallback)

export const EDITION = {
  /** Numéro d'édition, ex. « 7 » */
  numero: env(process.env.NEXT_PUBLIC_EDITION_NUMERO, "8"),
  /** Libellé, ex. « 7ème édition » */
  libelle: env(process.env.NEXT_PUBLIC_EDITION_LIBELLE, "8ème édition"),
  /** Version courte affichée sous le titre de la fiche d'inscription, ex. « 7.0 » */
  version: env(process.env.NEXT_PUBLIC_EDITION_VERSION, "8.0"),
  /** Année de l'édition, ex. « 2025 » */
  annee: env(process.env.NEXT_PUBLIC_EDITION_ANNEE, "2026"),
  /** Période en toutes lettres, ex. « 20 au 25 décembre 2025 » */
  dates: env(process.env.NEXT_PUBLIC_EDITION_DATES, "23 au 29 décembre 2026"),
  /** Date de clôture (signature des certificats), ex. « 25 décembre 2025 » */
  dateCloture: env(process.env.NEXT_PUBLIC_EDITION_DATE_CLOTURE, "29 décembre 2026"),
  /**
   * Lieu, précédé de « au » sur les certificats (« … du 23 au 29 décembre 2026 au <lieu> ») : nom de
   * l'établissement, ex. « Lycée Moderne de Cocody ». 2026 : à Bingerville, établissement À CONFIRMER.
   */
  lieu: env(process.env.NEXT_PUBLIC_EDITION_LIEU, "Lycée Moderne de Cocody"),
  /** Ville de signature, ex. « Cocody » */
  ville: env(process.env.NEXT_PUBLIC_EDITION_VILLE, "Bingerville"),
  /** Accueil, ex. « Samedi 20 décembre à partir de 14h00 » */
  arrivee: env(process.env.NEXT_PUBLIC_EDITION_ARRIVEE, "Mercredi 23 décembre à partir de 14h00"),
  /** Contacts de l'organisation imprimés sur la fiche d'inscription */
  contacts: env(process.env.NEXT_PUBLIC_EDITION_CONTACTS, "+225 0545844135 / +225 0142080535 / +225 0787944973"),
  /**
   * Clé de l'année des bulletins côté serveur (champ annee_scolaire) : doit rester identique pendant toute
   * l'édition, sinon les rangs sont calculés séparément. Valeur par défaut du serveur : « AnNour25 ».
   */
  anneeScolaire: env(process.env.NEXT_PUBLIC_EDITION_ANNEE_SCOLAIRE, "AnNour26"),
  /** Année scolaire affichée sur les bulletins, ex. « 2024-2025 » */
  anneeScolaireLibelle: env(process.env.NEXT_PUBLIC_EDITION_ANNEE_SCOLAIRE_LIBELLE, "2025-2026"),
} as const

/** Adresse du site public imprimée sur les badges (domaine de production depuis 2026-11). */
export const SITE_PUBLIC = "annour.ci"

/** Texte sans accents pour les PDF dont la mise en page historique n'en utilise pas. */
export const sansAccents = (text: string) => text.normalize("NFD").replace(/[̀-ͯ]/g, "")
