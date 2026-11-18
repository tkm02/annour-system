"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PagerProps {
  page: number
  limit: number
  total: number
  onPageChange: (page: number) => void
  disabled?: boolean
}

/** Pagination simple « Précédent / Suivant » avec le total du serveur. */
export default function Pager({ page, limit, total, onPageChange, disabled }: PagerProps) {
  const pages = Math.max(1, Math.ceil(total / limit))
  const from = total === 0 ? 0 : (page - 1) * limit + 1
  const to = Math.min(total, page * limit)
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4">
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {total === 0 ? "Aucun résultat" : `${from}–${to} sur ${total}`}
      </p>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => onPageChange(page - 1)} disabled={disabled || page <= 1}>
          <ChevronLeft className="h-4 w-4" aria-hidden="true" /> Précédent
        </Button>
        <span className="text-sm">
          Page {page} / {pages}
        </span>
        <Button variant="outline" size="sm" onClick={() => onPageChange(page + 1)} disabled={disabled || page >= pages}>
          Suivant <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  )
}
