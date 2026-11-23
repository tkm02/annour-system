// Logique d'affichage du menu (coque du back-office) : entrée active, groupes, fil d'Ariane.
// Fonctions pures, testées par tests/nav-ui.test.mjs. Les droits restent définis par lib/navigation.ts et l'API.
import type { NavItem } from "./navigation"

const matches = (pathname: string, href: string) => pathname === href || pathname.startsWith(`${href}/`)

/** Lien actif : correspondance exacte ou sous-page, en privilégiant l'entrée la plus précise. */
export function activeHref(items: NavItem[], pathname: string): string | null {
  let best: string | null = null
  for (const item of items) {
    if (matches(pathname, item.href) && (!best || item.href.length > best.length)) best = item.href
  }
  return best
}

export interface NavSection {
  title: string
  items: NavItem[]
}

/** Regroupe les entrées par section, dans l'ordre de première apparition. */
export function groupBySection(items: NavItem[]): NavSection[] {
  const sections: NavSection[] = []
  for (const item of items) {
    const existing = sections.find((s) => s.title === item.section)
    if (existing) existing.items.push(item)
    else sections.push({ title: item.section, items: [item] })
  }
  return sections
}

export interface Crumb {
  label: string
  href?: string
}

/**
 * Fil d'Ariane : « Section › Page » pour une entrée du menu, plus « Sous-page » si l'URL va au-delà
 * (ex. /seminaristes/ajouter). La section est omise si elle porte le même nom que la page.
 */
export function breadcrumbFor(items: NavItem[], pathname: string, subPageLabels: Record<string, string> = {}): Crumb[] {
  const href = activeHref(items, pathname)
  if (!href) return []
  const item = items.find((i) => i.href === href)
  if (!item) return []
  const crumbs: Crumb[] = []
  if (item.section !== item.name) crumbs.push({ label: item.section })
  const isSubPage = pathname !== href
  crumbs.push(isSubPage ? { label: item.name, href } : { label: item.name })
  if (isSubPage) crumbs.push({ label: subPageLabels[pathname] ?? "Détail" })
  return crumbs
}

/** Libellés des sous-pages qui ne figurent pas dans le menu. */
export const SUB_PAGE_LABELS: Record<string, string> = {
  "/seminaristes/ajouter": "Ajouter un séminariste",
  "/finance/entrees": "Entrées",
  "/finance/sorties": "Sorties",
  "/finance/rapports": "Rapports",
  "/finance/paiements": "Paiements",
  "/sante/seminaristes": "Séminaristes",
  "/sante/consultations": "Consultations",
}

/** Initiales d'un nom d'utilisateur (avatar texte), 2 caractères au plus, en majuscules. */
export function initials(name: string | null | undefined): string {
  const parts = (name ?? "").trim().split(/[\s._-]+/).filter(Boolean)
  if (parts.length === 0) return "?"
  const letters = parts.length === 1 ? parts[0].slice(0, 2) : parts[0][0] + parts[parts.length - 1][0]
  return letters.toLocaleUpperCase("fr")
}
