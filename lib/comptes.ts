// Gestion des accès (TAF lot 3) : statut d'un compte, lien à (r)envoyer, libellés du journal des connexions.
// Aligné sur l'API : POST /admin/comptes/{id}/envoyer-lien envoie une activation si le compte n'a jamais été activé,
// une réinitialisation sinon, et refuse (409) un compte activé puis désactivé.

export type StatutCompte = "actif" | "en_attente" | "desactive"

interface CompteResume {
  is_active: boolean
  en_attente_activation?: boolean
}

export function statutCompte(user: CompteResume): StatutCompte {
  if (user.en_attente_activation) return "en_attente"
  return user.is_active ? "actif" : "desactive"
}

export const LIBELLES_STATUT: Record<StatutCompte, string> = {
  actif: "Activé",
  en_attente: "En attente d'activation",
  desactive: "Désactivé",
}

export interface ActionLien {
  usage: "activation" | "reset"
  libelle: string
  confirmation: string
}

/** Lien proposé pour un compte ; null pour un compte désactivé (le réactiver d'abord). */
export function actionLien(user: CompteResume): ActionLien | null {
  const statut = statutCompte(user)
  if (statut === "en_attente") {
    return { usage: "activation", libelle: "Renvoyer le lien d'activation",
      confirmation: "Un nouveau lien d'activation (valable 72 h) sera envoyé par email ; le lien précédent ne fonctionnera plus." }
  }
  if (statut === "actif") {
    return { usage: "reset", libelle: "Envoyer un lien de réinitialisation",
      confirmation: "Un lien pour choisir un nouveau mot de passe (valable 1 h) sera envoyé par email. Le mot de passe actuel reste valable tant que le lien n'est pas utilisé." }
  }
  return null
}

/** Le compte en attente s'active par son lien : la bascule activé / désactivé ne s'applique qu'aux comptes activés. */
export const basculePossible = (user: CompteResume) => statutCompte(user) !== "en_attente"

export const LIBELLES_EVENEMENTS: Record<string, string> = {
  login_ok: "Connexion réussie",
  login_echec: "Échec de connexion",
  login_bloque: "Connexion bloquée (trop d'échecs)",
  login_inactif: "Connexion refusée (compte désactivé)",
  activation: "Compte activé",
  reset_demande: "Demande de réinitialisation",
  reset_ok: "Mot de passe réinitialisé",
  lien_envoye: "Lien envoyé",
  lien_renvoye: "Lien renvoyé",
  email_echec: "Échec d'envoi de l'email",
  compte_genere: "Compte généré (recensement CO)",
  compte_cree: "Compte créé",
}

export type TonEvenement = "success" | "danger" | "warning" | "info" | "neutral"

export function tonEvenement(type: string): TonEvenement {
  if (type === "login_ok" || type === "activation" || type === "reset_ok") return "success"
  if (type === "login_echec" || type === "login_bloque" || type === "email_echec") return "danger"
  if (type === "login_inactif") return "warning"
  if (type === "lien_envoye" || type === "lien_renvoye" || type === "reset_demande") return "info"
  return "neutral"
}

export const libelleEvenement = (type: string) => LIBELLES_EVENEMENTS[type] ?? type

/** Navigateur résumé (le journal garde l'en-tête complet, l'écran n'en montre que l'essentiel). */
export function navigateurCourt(userAgent: string | null | undefined): string {
  if (!userAgent) return "—"
  const ua = userAgent
  const appareil = /Android|iPhone|iPad|Mobile/i.test(ua) ? "mobile" : "ordinateur"
  const nav = /Edg\//.test(ua) ? "Edge" : /OPR\/|Opera/.test(ua) ? "Opera" : /Chrome\//.test(ua) ? "Chrome"
    : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "Autre navigateur"
  return `${nav} (${appareil})`
}
