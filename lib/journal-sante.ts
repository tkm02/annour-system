// Journal des accès aux données de santé (TAF lot 4, super_admin seul) : libellés lisibles des actions et des cibles.
// Actions écrites par l'API : module Santé (app/routes/sante.py), fiches CO (recensement_co.py), formulaires publics
// (utils/acces_public.py) et lectures hors module (utils/sante_acces.py).

export const LIBELLES_ACTIONS_SANTE: Record<string, string> = {
  READ_FICHE: "Lecture d'une fiche médicale",
  UPDATE_INFOS: "Modification des informations médicales",
  LIST_CONSULTATIONS: "Liste des consultations d'un patient",
  LIST_ALL_CONSULTATIONS: "Liste de toutes les consultations",
  READ_CONSULTATION: "Lecture d'une consultation",
  CREATE: "Création d'une consultation",
  UPDATE: "Modification d'une consultation",
  EXPORT: "Export d'une consultation",
  READ_FICHE_CO: "Lecture d'une fiche CO",
  UPDATE_FICHE_CO: "Modification de la santé d'une fiche CO",
  READ_FICHE_CO_PUBLIC: "Fiche CO affichée (formulaire public)",
  UPDATE_FICHE_CO_PUBLIC: "Santé modifiée (formulaire CO public)",
  READ_REINSCRIPTION_PUBLIC: "Fiche affichée (réinscription publique)",
  LIST_INSCRIPTIONS: "Liste des inscriptions",
  READ_INSCRIPTION: "Lecture d'une inscription",
  LIST_SEMINARISTES: "Liste des séminaristes (badges, pédagogie)",
  LIST_MEMBRES_CO_2025: "Liste des membres CO 2025",
  READ_MEMBRE_CO_2025: "Lecture d'un membre CO 2025",
}

export const libelleActionSante = (action: string) => LIBELLES_ACTIONS_SANTE[action] ?? action

/** Cible lisible : matricule tel quel ; préfixes techniques traduits ; « * » = liste de fiches. */
export function libelleCibleSante(cible: string): string {
  if (cible === "*") return "Plusieurs fiches (liste)"
  if (cible.startsWith("CO:")) return `Fiche CO ${cible.slice(3, 9)}…`
  if (cible.startsWith("MEMBRECO:")) return `Membre CO 2025 ${cible.slice(9, 15)}…`
  return cible
}

/** Compte à l'origine de l'accès : les formulaires publics n'ont pas de compte. */
export const libelleActeurSante = (entree: { user_id: string; username: string }) =>
  entree.user_id === "public" ? "Formulaire public" : entree.username
