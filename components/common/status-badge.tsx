import type React from "react"
import { AlertTriangle, CheckCircle2, Circle, Info, XCircle, type LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

export type StatusTone = "neutral" | "info" | "warning" | "success" | "danger"

// Texte foncé sur fond teinté (≥ 6,3:1, ADR 0002) ; l'icône et le libellé portent le sens, jamais la couleur seule.
const TONES: Record<StatusTone, { className: string; icon: LucideIcon }> = {
  neutral: { className: "border-border bg-muted text-foreground", icon: Circle },
  info: { className: "border-info/20 bg-info-soft text-info-strong", icon: Info },
  warning: { className: "border-warning/20 bg-warning-soft text-warning-strong", icon: AlertTriangle },
  success: { className: "border-success/20 bg-success-soft text-success-strong", icon: CheckCircle2 },
  danger: { className: "border-destructive/20 bg-destructive-soft text-destructive-strong", icon: XCircle },
}

/** Badge de statut : ton sémantique + icône + libellé. */
export function StatusBadge({ tone = "neutral", icon, children, className }: {
  tone?: StatusTone
  /** Icône spécifique ; `null` pour n'afficher que le libellé */
  icon?: LucideIcon | null
  children: React.ReactNode
  className?: string
}) {
  const style = TONES[tone]
  const Icon = icon === undefined ? style.icon : icon
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium",
        style.className,
        className
      )}
    >
      {Icon && <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
      {children}
    </span>
  )
}
