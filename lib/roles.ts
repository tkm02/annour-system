// Rôles reconnus par l'API (doit rester aligné avec app/utils/auth.py côté backend).
// TAF lot 3 : super_admin = tous les droits, seul à gérer les accès ; admin = commission Administration
// (finances en lecture seule, santé conservée).
export const ROLES = ["super_admin", "admin", "scientifique", "finances", "sante"] as const

export type UserRole = (typeof ROLES)[number]

// Anciennes valeurs encore possibles en base ou en session → valeur canonique
const ROLE_ALIASES: Record<string, UserRole> = {
  administration: "admin",
  finance: "finances",
  scientific: "scientifique",
  "santé": "sante",
}

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: "Super administrateur",
  admin: "Administration",
  scientifique: "Scientifique",
  finances: "Finances",
  sante: "Santé",
}

export function normalizeRole(role?: string | null): string {
  if (!role) return ""
  const value = role.trim().toLowerCase()
  return ROLE_ALIASES[value] ?? value
}

export function roleLabel(role?: string | null): string {
  return ROLE_LABELS[normalizeRole(role) as UserRole] ?? "Utilisateur"
}

/** Droits de la commission Administration : admin, et super_admin qui a tous les droits. */
export function isAdministration(role?: string | null): boolean {
  const value = normalizeRole(role)
  return value === "admin" || value === "super_admin"
}

/** Rôles attribuables depuis l'interface : super_admin s'attribue uniquement par script (scripts/create_admin.py). */
export const ROLES_ATTRIBUABLES = ROLES.filter((role) => role !== "super_admin")

/** Gestion des accès (comptes, génération en lot, liens, journal des connexions) : super_admin seul. */
export function canManageAccess(role?: string | null): boolean {
  return normalizeRole(role) === "super_admin"
}

/** Écritures du module Finances (entrées, sorties, rapports, décisions de paiement) : l'API refuse les autres (403). */
export function canWriteFinance(role?: string | null): boolean {
  const value = normalizeRole(role)
  return value === "finances" || value === "super_admin"
}
