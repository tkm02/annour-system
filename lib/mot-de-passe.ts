// Parcours de compte (TAF lot 3) : règles de mot de passe affichées en direct et lecture du jeton reçu par email.
// La politique complète (mots de passe courants, suites…) est appliquée par l'API, qui reste seule juge (422).

export const MOT_DE_PASSE_MIN = 10
export const MOT_DE_PASSE_MAX = 128

export interface RegleMotDePasse {
  id: "longueur" | "personnel" | "identique"
  libelle: string
  ok: boolean
}

const simplifier = (texte: string) =>
  texte.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9@]/g, "")

/** Vrai si le mot de passe contient un morceau (3 caractères ou plus) du nom d'utilisateur, du nom, du prénom… */
export function contientInfoPersonnelle(mot: string, personnels: Array<string | null | undefined>): boolean {
  const simple = simplifier(mot)
  return personnels.some((valeur) =>
    (valeur ?? "").split(/[\s@._-]+/).some((morceau) => {
      const m = simplifier(morceau)
      return m.length >= 3 && simple.includes(m)
    })
  )
}

export function reglesMotDePasse(
  mot: string, confirmation: string, personnels: Array<string | null | undefined> = []
): RegleMotDePasse[] {
  return [
    { id: "longueur", libelle: `Au moins ${MOT_DE_PASSE_MIN} caractères`,
      ok: mot.length >= MOT_DE_PASSE_MIN && mot.length <= MOT_DE_PASSE_MAX },
    { id: "personnel", libelle: "Ne contient ni votre nom d'utilisateur ni votre prénom",
      ok: mot.length > 0 && !contientInfoPersonnelle(mot, personnels) },
    { id: "identique", libelle: "Les deux saisies sont identiques", ok: mot.length > 0 && mot === confirmation },
  ]
}

export const reglesRespectees = (regles: RegleMotDePasse[]) => regles.every((r) => r.ok)

/** Jeton du lien (`?jeton=…`) ; null s'il est absent ou manifestement invalide. */
export function jetonDepuisRecherche(search: string): string | null {
  const jeton = new URLSearchParams(search).get("jeton")?.trim() ?? ""
  return /^[A-Za-z0-9_-]{20,200}$/.test(jeton) ? jeton : null
}

/** Adresse sans le paramètre `jeton` (barre d'adresse, historique, mesures d'audience). */
export function sansJeton(url: string): string {
  try {
    const parsed = new URL(url, "http://local.invalid")
    if (!parsed.searchParams.has("jeton")) return url
    parsed.searchParams.delete("jeton")
    const relative = !/^[a-z]+:\/\//i.test(url)
    return relative ? `${parsed.pathname}${parsed.search}${parsed.hash}` : parsed.toString()
  } catch {
    return url
  }
}

/** Vercel Analytics (`beforeSend`) : l'adresse transmise ne contient jamais le jeton d'un lien de compte. */
export function sansJetonAnalytics<T extends { url: string }>(event: T): T {
  return { ...event, url: sansJeton(event.url) }
}
