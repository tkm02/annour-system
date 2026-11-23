import type React from "react"
import type { LucideIcon } from "lucide-react"

import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

export type Tone = "default" | "brand" | "success" | "warning" | "danger" | "info"

// Pastille d'icône : fond teinté + couleur foncée du même ton (contraste ≥ 6:1, ADR 0002)
const ICON_TONES: Record<Tone, string> = {
  default: "bg-accent text-accent-foreground",
  brand: "bg-brand-soft text-brand-strong",
  success: "bg-success-soft text-success-strong",
  warning: "bg-warning-soft text-warning-strong",
  danger: "bg-destructive-soft text-destructive-strong",
  info: "bg-info-soft text-info-strong",
}

/**
 * Indicateur clé : libellé, valeur, complément facultatif et icône. Si `action` est fourni, toute la carte devient
 * cliquable (bouton étiré à l'intérieur de la carte, jamais l'inverse).
 */
export function StatCard({ label, value, hint, icon: Icon, tone = "default", action, className }: {
  label: string
  value: React.ReactNode
  hint?: React.ReactNode
  icon?: LucideIcon
  tone?: Tone
  action?: { label: string; onClick: () => void }
  className?: string
}) {
  return (
    <div
      className={cn(
        "relative flex items-start justify-between gap-3 rounded-lg border border-border bg-card p-4 shadow-xs transition-colors md:p-5",
        action && "hover:border-primary/40 has-[button:focus-visible]:ring-2 has-[button:focus-visible]:ring-ring/70",
        className
      )}
    >
      <div className="min-w-0">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground md:text-[28px] md:leading-9">{value}</p>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        {action && (
          <button
            type="button"
            onClick={action.onClick}
            className="mt-2 text-xs font-medium text-primary underline-offset-2 after:absolute after:inset-0 after:content-[''] hover:underline focus-visible:outline-none"
          >
            {action.label}
          </button>
        )}
      </div>
      {Icon && (
        <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-md", ICON_TONES[tone])} aria-hidden="true">
          <Icon className="h-[18px] w-[18px]" />
        </span>
      )}
    </div>
  )
}

/** Grille d'indicateurs : 1 colonne en mobile, 2 en tablette, 4 au maximum sur ordinateur. */
export function StatGrid({ children, label, className }: { children: React.ReactNode; label?: string; className?: string }) {
  return (
    <section aria-label={label} className={cn("grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 md:gap-4", className)}>
      {children}
    </section>
  )
}

/** Squelettes de cartes pendant le chargement. */
export function StatGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 md:gap-4" role="status" aria-label="Chargement des indicateurs">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="rounded-lg border border-border bg-card p-4 shadow-xs md:p-5">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="mt-3 h-8 w-20" />
        </div>
      ))}
    </div>
  )
}
