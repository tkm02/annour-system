// Pages et menus par rôle (F-Q1). Source unique côté interface : le serveur reste seul juge des droits,
// cette matrice évite seulement d'afficher un lien ou une page que l'API refuserait (403).
import type { UserRole } from "./roles"

export type IconName =
  | "dashboard" | "users" | "badge" | "certificate" | "message" | "settings" | "finance" | "health"
  | "science" | "assign" | "file" | "wallet" | "trending-up" | "trending-down" | "report" | "teacher" | "visitor"
  | "stethoscope" | "census"

export interface NavItem {
  name: string
  href: string
  icon: IconName
  /** Groupe d'affichage dans le menu (les entrées d'un même groupe sont contiguës) */
  section: string
}

const ADMIN: UserRole = "admin"
const SCI: UserRole = "scientifique"
const FIN: UserRole = "finances"
const SANTE: UserRole = "sante"

// Préfixe de chemin → rôles autorisés (le préfixe le plus long l'emporte). Aligné sur les routes de l'API.
export const ROUTE_ROLES: Array<[string, UserRole[]]> = [
  ["/dashboard", [ADMIN, SCI]],
  ["/seminaristes/ajouter", [ADMIN]],
  ["/seminaristes", [ADMIN, SCI]],
  ["/badges", [ADMIN]],
  ["/certificats", [ADMIN]],
  ["/feedback", [ADMIN]],
  ["/acces", [ADMIN]],
  ["/visiteurs", [ADMIN]],
  ["/membres-co", [ADMIN]],
  ["/recensement-co", [ADMIN]],
  ["/scientifique", [ADMIN, SCI]],
  ["/attributions", [ADMIN, SCI]],
  ["/notes", [ADMIN, SCI]],
  ["/bulletins", [ADMIN, SCI]],
  ["/formateurs", [ADMIN, SCI]],
  ["/sante", [ADMIN, SANTE]],
  ["/finance", [ADMIN, FIN]],
]

const matches = (pathname: string, prefix: string) => pathname === prefix || pathname.startsWith(`${prefix}/`)

/** Rôles autorisés pour une page protégée, ou null si la page n'est pas dans la matrice. */
export function allowedRolesFor(pathname: string): UserRole[] | null {
  let best: [string, UserRole[]] | null = null
  for (const entry of ROUTE_ROLES) {
    if (matches(pathname, entry[0]) && (!best || entry[0].length > best[0].length)) best = entry
  }
  return best ? best[1] : null
}

export function canAccess(role: string | null | undefined, pathname: string): boolean {
  const allowed = allowedRolesFor(pathname)
  if (!allowed) return true
  return !!role && (allowed as string[]).includes(role)
}

/** Page d'accueil après connexion, selon le rôle. */
export function homeFor(role: string | null | undefined): string {
  switch (role) {
    case FIN:
      return "/finance"
    case SANTE:
      return "/sante"
    default:
      return "/dashboard"
  }
}

export const NAVIGATION: Record<UserRole, NavItem[]> = {
  admin: [
    { name: "Tableau de bord", href: "/dashboard", icon: "dashboard", section: "Pilotage" },
    { name: "Séminaristes", href: "/seminaristes", icon: "users", section: "Séminaristes" },
    { name: "Badges", href: "/badges", icon: "badge", section: "Séminaristes" },
    { name: "Certificats", href: "/certificats", icon: "certificate", section: "Séminaristes" },
    { name: "Recensement CO", href: "/recensement-co", icon: "census", section: "Comité d'organisation" },
    { name: "Membres CO 2025 (archives)", href: "/membres-co", icon: "users", section: "Comité d'organisation" },
    { name: "Visiteurs", href: "/visiteurs", icon: "visitor", section: "Accueil" },
    { name: "Avis", href: "/feedback", icon: "message", section: "Accueil" },
    { name: "Scientifique", href: "/scientifique", icon: "science", section: "Pédagogie" },
    { name: "Attributions", href: "/attributions", icon: "assign", section: "Pédagogie" },
    { name: "Notes", href: "/notes", icon: "file", section: "Pédagogie" },
    { name: "Bulletins", href: "/bulletins", icon: "file", section: "Pédagogie" },
    { name: "Formateurs", href: "/formateurs", icon: "teacher", section: "Pédagogie" },
    { name: "Vue d'ensemble", href: "/finance", icon: "finance", section: "Finances" },
    { name: "Paiements", href: "/finance/paiements", icon: "wallet", section: "Finances" },
    { name: "Vue d'ensemble", href: "/sante", icon: "health", section: "Santé" },
    { name: "Gérer les accès", href: "/acces", icon: "settings", section: "Administration" },
  ],
  scientifique: [
    { name: "Tableau de bord", href: "/dashboard", icon: "dashboard", section: "Pilotage" },
    { name: "Séminaristes", href: "/seminaristes", icon: "users", section: "Séminaristes" },
    { name: "Scientifique", href: "/scientifique", icon: "science", section: "Pédagogie" },
    { name: "Attributions", href: "/attributions", icon: "assign", section: "Pédagogie" },
    { name: "Notes", href: "/notes", icon: "file", section: "Pédagogie" },
    { name: "Bulletins", href: "/bulletins", icon: "file", section: "Pédagogie" },
    { name: "Formateurs", href: "/formateurs", icon: "teacher", section: "Pédagogie" },
  ],
  finances: [
    { name: "Tableau de bord", href: "/finance", icon: "finance", section: "Finances" },
    { name: "Entrées", href: "/finance/entrees", icon: "trending-up", section: "Finances" },
    { name: "Sorties", href: "/finance/sorties", icon: "trending-down", section: "Finances" },
    { name: "Paiements", href: "/finance/paiements", icon: "wallet", section: "Finances" },
    { name: "Rapports", href: "/finance/rapports", icon: "report", section: "Finances" },
  ],
  sante: [
    { name: "Tableau de bord", href: "/sante", icon: "health", section: "Santé" },
    { name: "Séminaristes", href: "/sante/seminaristes", icon: "users", section: "Santé" },
    { name: "Consultations", href: "/sante/consultations", icon: "stethoscope", section: "Santé" },
  ],
}

export function navigationFor(role: string | null | undefined): NavItem[] {
  return (role && NAVIGATION[role as UserRole]) || []
}
