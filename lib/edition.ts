// F-Q3 : données de l'édition du séminaire, utilisées par les certificats, bulletins, badges et fiches PDF.
// À mettre à jour à chaque nouvelle édition (ou à surcharger par les variables NEXT_PUBLIC_EDITION_* sur Vercel).
// Les valeurs ci-dessous sont celles de l'édition précédente : à remplacer avant la prochaine édition.
//
// Next.js n'intègre une variable NEXT_PUBLIC_* au code envoyé au navigateur que si elle est lue littéralement
// (process.env.NEXT_PUBLIC_X) : chaque variable est donc lue explicitement. Aucun secret ici.

const env = (value: string | undefined, fallback: string) => (value && value.trim() ? value.trim() : fallback)

export const EDITION = {
  /** Numéro d'édition, ex. « 7 » */
  numero: env(process.env.NEXT_PUBLIC_EDITION_NUMERO, "7"),
  /** Libellé, ex. « 7ème édition » */
  libelle: env(process.env.NEXT_PUBLIC_EDITION_LIBELLE, "7ème édition"),
  /** Version courte affichée sous le titre de la fiche d'inscription, ex. « 7.0 » */
  version: env(process.env.NEXT_PUBLIC_EDITION_VERSION, "7.0"),
  /** Année de l'édition, ex. « 2025 » */
  annee: env(process.env.NEXT_PUBLIC_EDITION_ANNEE, "2025"),
  /** Période en toutes lettres, ex. « 20 au 25 décembre 2025 » */
  dates: env(process.env.NEXT_PUBLIC_EDITION_DATES, "20 au 25 décembre 2025"),
  /** Date de clôture (signature des certificats), ex. « 25 décembre 2025 » */
  dateCloture: env(process.env.NEXT_PUBLIC_EDITION_DATE_CLOTURE, "25 décembre 2025"),
  /** Lieu, ex. « Lycée Moderne de Cocody » */
  lieu: env(process.env.NEXT_PUBLIC_EDITION_LIEU, "Lycée Moderne de Cocody"),
  /** Ville de signature, ex. « Cocody » */
  ville: env(process.env.NEXT_PUBLIC_EDITION_VILLE, "Cocody"),
  /** Accueil, ex. « Samedi 20 décembre à partir de 14h00 » */
  arrivee: env(process.env.NEXT_PUBLIC_EDITION_ARRIVEE, "Samedi 20 décembre à partir de 14h00"),
  /** Contacts de l'organisation imprimés sur la fiche d'inscription */
  contacts: env(process.env.NEXT_PUBLIC_EDITION_CONTACTS, "+225 0545844135 / +225 0142080535 / +225 0787944973"),
  /**
   * Clé de l'année des bulletins côté serveur (champ annee_scolaire) : doit rester identique pendant toute
   * l'édition, sinon les rangs sont calculés séparément. Valeur par défaut du serveur : « AnNour25 ».
   */
  anneeScolaire: env(process.env.NEXT_PUBLIC_EDITION_ANNEE_SCOLAIRE, "AnNour25"),
  /** Année scolaire affichée sur les bulletins, ex. « 2024-2025 » */
  anneeScolaireLibelle: env(process.env.NEXT_PUBLIC_EDITION_ANNEE_SCOLAIRE_LIBELLE, "2024-2025"),
} as const

/** Texte sans accents pour les PDF dont la mise en page historique n'en utilise pas. */
export const sansAccents = (text: string) => text.normalize("NFD").replace(/[̀-ͯ]/g, "")
