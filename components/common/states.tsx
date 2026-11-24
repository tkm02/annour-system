"use client"

import type React from "react"
import { AlertCircle, Inbox, Loader2, RefreshCw, type LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * États communs des écrans : chargement, erreur (avec réessai) et liste vide.
 * Convention : squelettes (`ListSkeleton`) pour une page ou une liste, `LoadingState` dans un dialogue ou un petit bloc.
 */
export function LoadingState({ label = "Chargement…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground" role="status" aria-live="polite">
      <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
      {label}
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center" role="alert">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive-soft" aria-hidden="true">
        <AlertCircle className="h-6 w-6 text-destructive" />
      </span>
      <p className="max-w-md whitespace-pre-line text-sm text-destructive-strong">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
          <RefreshCw className="h-4 w-4" aria-hidden="true" /> Réessayer
        </Button>
      )}
    </div>
  )
}

/**
 * Liste vide. Distinguer « aucune donnée » (action : Ajouter) de « aucun résultat pour ces filtres »
 * (action : Réinitialiser les filtres).
 */
export function EmptyState({ message, title, icon: Icon = Inbox, action }: {
  message: string
  title?: string
  icon?: LucideIcon
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center">
      <span className="mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-muted" aria-hidden="true">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </span>
      {title && <p className="font-semibold text-foreground">{title}</p>}
      <p className="max-w-sm text-sm text-muted-foreground">{message}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

/** Squelette de liste ou de tableau (lignes de la forme du contenu). */
export function ListSkeleton({ rows = 5, label = "Chargement…" }: { rows?: number; label?: string }) {
  return (
    <div className="divide-y divide-border" role="status" aria-live="polite">
      <span className="sr-only">{label}</span>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-4 py-3" aria-hidden="true">
          <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="hidden h-6 w-20 rounded-full sm:block" />
        </div>
      ))}
    </div>
  )
}

export const errorText = (error: unknown, fallback: string) =>
  error instanceof Error && error.message ? error.message : fallback
