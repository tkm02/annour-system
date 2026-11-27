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

const SUPER: UserRole = "super_admin"
const ADMIN: UserRole = "admin"
const SCI: UserRole = "scientifique"
const FIN: UserRole = "finances"
const SANTE: UserRole = "sante"

// Préfixe de chemin → rôles autorisés (le préfixe le plus long l'emporte). Aligné sur les routes de l'API :
// super_admin partout ; gestion des accès réservée au super_admin (TAF lot 3) ; finances lisibles par l'administration
// (les écritures sont masquées par canWriteFinance et refusées par l'API).
export const ROUTE_ROLES: Array<[string, UserRole[]]> = [
  ["/dashboard", [SUPER, ADMIN, SCI]],
  ["/seminaristes/ajouter", [SUPER, ADMIN]],
  ["/seminaristes", [SUPER, ADMIN, SCI]],
  ["/badges", [SUPER, ADMIN]],
  ["/certificats", [SUPER, ADMIN]],
  ["/feedback", [SUPER, ADMIN]],
  ["/acces", [SUPER]],
  ["/visiteurs", [SUPER, ADMIN]],
  ["/membres-co", [SUPER, ADMIN]],
  ["/recensement-co", [SUPER, ADMIN]],
  ["/scientifique", [SUPER, ADMIN, SCI]],
  ["/attributions", [SUPER, ADMIN, SCI]],
  ["/notes", [SUPER, ADMIN, SCI]],
  ["/bulletins", [SUPER, ADMIN, SCI]],
  ["/formateurs", [SUPER, ADMIN, SCI]],
  ["/sante", [SUPER, ADMIN, SANTE]],
  ["/finance", [SUPER, ADMIN, FIN]],
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

const NAV_ADMINISTRATION: NavItem[] = [
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
]

export const NAVIGATION: Record<UserRole, NavItem[]> = {
  super_admin: [
    ...NAV_ADMINISTRATION,
    { name: "Gérer les accès", href: "/acces", icon: "settings", section: "Administration" },
  ],
  admin: NAV_ADMINISTRATION,
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
