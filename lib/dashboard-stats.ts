// Calculs du tableau de bord (à partir de la liste des séminaristes déjà chargée), testés par
// tests/dashboard-stats.test.mjs. Mêmes règles qu'avant la refonte : la Pépinière est repérée par le nom du dortoir.

export interface SeminaristeResume {
  sexe?: string | null
  dortoir?: string | null
  niveau_academique?: string | null
  registration_date?: string | null
}

export interface NiveauStats {
  niveau: string
  garcons: number
  filles: number
  total: number
}

export interface DashboardStats {
  /** Total annoncé par le serveur */
  total: number
  garcons: number
  filles: number
  pepiniere: number
  pepiniereGarcons: number
  pepiniereFilles: number
  /** Parts (0-100) calculées sur le total du serveur, Pépinière incluse */
  partGarcons: number
  partFilles: number
  parNiveau: NiveauStats[]
}

const isPepiniere = (s: SeminaristeResume) => !!s.dortoir?.includes("Pépinière")

export function computeDashboardStats(rows: readonly SeminaristeResume[], total: number): DashboardStats {
  const garcons = rows.filter((s) => s.sexe === "M").length
  const filles = rows.filter((s) => s.sexe === "F").length
  const pepiniereGarcons = rows.filter((s) => isPepiniere(s) && s.sexe === "M").length
  const pepiniereFilles = rows.filter((s) => isPepiniere(s) && s.sexe === "F").length
  const pepiniere = rows.filter(isPepiniere).length

  const niveaux = new Map<string, NiveauStats>()
  for (const s of rows) {
    const niveau = s.niveau_academique || "Non classé"
    const entry = niveaux.get(niveau) ?? { niveau, garcons: 0, filles: 0, total: 0 }
    if (s.sexe === "M") entry.garcons += 1
    else if (s.sexe === "F") entry.filles += 1
    entry.total += 1
    niveaux.set(niveau, entry)
  }

  const part = (n: number) => (total > 0 ? (n / total) * 100 : 0)
  return {
    total,
    garcons,
    filles,
    pepiniere,
    pepiniereGarcons,
    pepiniereFilles,
    partGarcons: part(garcons),
    partFilles: part(filles),
    parNiveau: [...niveaux.values()].sort((a, b) => b.total - a.total),
  }
}

/** Inscriptions les plus récentes (copie triée : la liste d'origine n'est pas modifiée). */
export function recentRegistrations<T extends SeminaristeResume>(rows: readonly T[], limit = 8): T[] {
  return [...rows]
    .sort((a, b) => String(b.registration_date ?? "").localeCompare(String(a.registration_date ?? "")))
    .slice(0, limit)
}

/** Pourcentage lisible : « 52 % », « 52,5 % ». */
export function formatPercent(value: number): string {
  return `${value.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`
}
