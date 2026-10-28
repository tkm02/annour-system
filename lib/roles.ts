// Rôles reconnus par l'API (doit rester aligné avec app/utils/auth.py côté backend)
export const ROLES = ["admin", "scientifique", "finances", "sante"] as const

export type UserRole = (typeof ROLES)[number]

// Anciennes valeurs encore possibles en base ou en session → valeur canonique
const ROLE_ALIASES: Record<string, UserRole> = {
  administration: "admin",
  finance: "finances",
  scientific: "scientifique",
  "santé": "sante",
}

export const ROLE_LABELS: Record<UserRole, string> = {
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
