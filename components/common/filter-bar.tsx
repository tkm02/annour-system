"use client"

import type React from "react"
import { useId } from "react"
import { Search, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export interface ActiveFilter {
  /** Libellé lisible, ex. « Niveau : Secondaire » */
  label: string
  onRemove: () => void
}

/**
 * Barre d'outils d'une liste : recherche, filtres (Select…), puces des filtres actifs, réinitialisation, compteur
 * et actions à droite. Le texte recherché n'est jamais placé dans l'URL (il peut contenir un nom).
 */
export function FilterBar({
  search, onSearchChange, searchLabel = "Rechercher", searchPlaceholder = "Rechercher…",
  filters, activeFilters = [], onReset, count, actions, className,
}: {
  search?: string
  onSearchChange?: (value: string) => void
  searchLabel?: string
  searchPlaceholder?: string
  /** Contrôles de filtre (Select, etc.) */
  filters?: React.ReactNode
  activeFilters?: ActiveFilter[]
  onReset?: () => void
  /** Compteur, ex. « 24 sur 128 séminaristes » */
  count?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}) {
  const searchId = useId()
  const hasActive = activeFilters.length > 0 || !!search?.trim()

  return (
    <div className={cn("mb-4 space-y-3", className)}>
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        {onSearchChange && (
          <div className="relative w-full lg:max-w-xs">
            <label htmlFor={searchId} className="sr-only">{searchLabel}</label>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              id={searchId}
              type="search"
              value={search ?? ""}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              autoComplete="off"
              className="bg-card pl-9"
            />
          </div>
        )}
        {filters && <div className="flex flex-wrap items-center gap-2">{filters}</div>}
        {actions && <div className="flex flex-wrap items-center gap-2 lg:ml-auto">{actions}</div>}
      </div>

      {(hasActive || count) && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {count && <span className="text-muted-foreground" aria-live="polite">{count}</span>}
          {activeFilters.map((filter) => (
            <span
              key={filter.label}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-card py-0.5 pl-2.5 pr-1 text-xs font-medium text-foreground"
            >
              {filter.label}
              <button
                type="button"
                onClick={filter.onRemove}
                aria-label={`Retirer le filtre ${filter.label}`}
                className="rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </span>
          ))}
          {hasActive && onReset && (
            <Button variant="link" size="sm" onClick={onReset} className="h-auto px-1 py-0">
              Réinitialiser les filtres
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
