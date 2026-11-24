"use client"

import type React from "react"
import { useId, useMemo, useState } from "react"
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react"

import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ErrorState, ListSkeleton } from "@/components/common/states"
import Pager from "@/components/common/pager"
import { clampPage, paginate, sortRows, type SortDirection, type SortValue } from "@/lib/table"
import { cn } from "@/lib/utils"

type Breakpoint = "sm" | "md" | "lg" | "xl"

// Classes statiques (détectées par Tailwind) : colonne masquée sous un point de rupture
const HIDE_BELOW: Record<Breakpoint, string> = {
  sm: "hidden sm:table-cell",
  md: "hidden md:table-cell",
  lg: "hidden lg:table-cell",
  xl: "hidden xl:table-cell",
}

export interface Column<T> {
  id: string
  header: React.ReactNode
  cell: (row: T) => React.ReactNode
  /** Rend la colonne triable */
  sortValue?: (row: T) => SortValue
  align?: "left" | "right" | "center"
  /** Masque la colonne sous ce point de rupture (vue tableau) */
  hideBelow?: Breakpoint
  className?: string
  headerClassName?: string
}

export interface DataTableProps<T> {
  columns: Column<T>[]
  rows: readonly T[]
  getRowKey: (row: T) => string
  /** Légende du tableau, lue par les lecteurs d'écran */
  caption: string
  loading?: boolean
  error?: string | null
  onRetry?: () => void
  /** Contenu affiché si la liste est vide (EmptyState) */
  empty?: React.ReactNode
  /** Vue en cartes sous 768 px ; sans elle, le tableau défile horizontalement */
  renderCard?: (row: T) => React.ReactNode
  /** Pagination côté client ; omettre si le serveur pagine déjà */
  pageSize?: number
  pageSizeOptions?: number[]
  initialSort?: { id: string; direction: SortDirection }
  /** Sélection de lignes (actions groupées) */
  selection?: { selected: ReadonlySet<string>; onChange: (next: Set<string>) => void; label: (row: T) => string }
  /** Barre d'actions affichée quand au moins une ligne est sélectionnée */
  bulkActions?: (selectedKeys: string[]) => React.ReactNode
  className?: string
}

const alignClass = (align?: "left" | "right" | "center") =>
  align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left"

export function DataTable<T>({
  columns, rows, getRowKey, caption, loading, error, onRetry, empty, renderCard,
  pageSize, pageSizeOptions = [10, 25, 50, 100], initialSort, selection, bulkActions, className,
}: DataTableProps<T>) {
  const [sort, setSort] = useState<{ id: string; direction: SortDirection } | null>(initialSort ?? null)
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(pageSize ?? 0)
  const pageSizeId = useId()

  const sorted = useMemo(() => {
    if (!sort) return [...rows]
    const column = columns.find((c) => c.id === sort.id)
    return column?.sortValue ? sortRows(rows, column.sortValue, sort.direction) : [...rows]
  }, [rows, columns, sort])

  const currentPage = size ? clampPage(page, sorted.length, size) : 1
  const visible = size ? paginate(sorted, currentPage, size) : sorted
  const visibleKeys = visible.map(getRowKey)
  const selectedCount = selection?.selected.size ?? 0
  const allVisibleSelected = !!selection && visibleKeys.length > 0 && visibleKeys.every((k) => selection.selected.has(k))
  const someVisibleSelected = !!selection && visibleKeys.some((k) => selection.selected.has(k))

  const toggleSort = (id: string) => {
    setSort((current) =>
      current?.id !== id ? { id, direction: "asc" } : current.direction === "asc" ? { id, direction: "desc" } : null
    )
  }

  const toggleRow = (key: string, checked: boolean) => {
    if (!selection) return
    const next = new Set(selection.selected)
    if (checked) next.add(key)
    else next.delete(key)
    selection.onChange(next)
  }

  const toggleAllVisible = (checked: boolean) => {
    if (!selection) return
    const next = new Set(selection.selected)
    for (const key of visibleKeys) {
      if (checked) next.add(key)
      else next.delete(key)
    }
    selection.onChange(next)
  }

  if (error) return <ErrorState message={error} onRetry={onRetry} />
  if (loading) return <ListSkeleton />
  if (rows.length === 0) return <>{empty}</>

  return (
    <div className={cn("space-y-3", className)}>
      {selection && bulkActions && selectedCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-primary/30 bg-accent px-3 py-2 text-sm" role="region" aria-label="Actions groupées">
          <span className="font-medium text-accent-foreground">
            {selectedCount} sélectionné{selectedCount > 1 ? "s" : ""}
          </span>
          <div className="ml-auto flex flex-wrap gap-2">{bulkActions([...selection.selected])}</div>
        </div>
      )}

      {/* Vue cartes (mobile) */}
      {renderCard && (
        <ul role="list" className="space-y-2 md:hidden" aria-label={caption}>
          {visible.map((row) => (
            <li key={getRowKey(row)}>{renderCard(row)}</li>
          ))}
        </ul>
      )}

      {/* Vue tableau */}
      <div className={cn("overflow-x-auto rounded-lg border border-border bg-card", renderCard && "hidden md:block")}>
        <table className="w-full caption-bottom text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead className="sticky top-0 z-[1] bg-muted/60">
            <tr className="border-b border-border">
              {selection && (
                <th scope="col" className="w-10 px-3 py-2.5">
                  <Checkbox
                    checked={allVisibleSelected ? true : someVisibleSelected ? "indeterminate" : false}
                    onCheckedChange={(v) => toggleAllVisible(v === true)}
                    aria-label="Sélectionner toutes les lignes affichées"
                  />
                </th>
              )}
              {columns.map((column) => {
                const active = sort?.id === column.id
                const ariaSort = active ? (sort.direction === "asc" ? "ascending" : "descending") : column.sortValue ? "none" : undefined
                return (
                  <th
                    key={column.id}
                    scope="col"
                    aria-sort={ariaSort}
                    className={cn(
                      "h-10 whitespace-nowrap px-3 text-xs font-semibold text-muted-foreground",
                      alignClass(column.align),
                      column.hideBelow && HIDE_BELOW[column.hideBelow],
                      column.headerClassName
                    )}
                  >
                    {column.sortValue ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(column.id)}
                        className={cn(
                          "-mx-1 inline-flex items-center gap-1 rounded px-1 py-0.5 hover:text-foreground",
                          active && "text-foreground"
                        )}
                      >
                        {column.header}
                        {active ? (
                          sort.direction === "asc" ? <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" /> : <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
                        ) : (
                          <ArrowUpDown className="h-3.5 w-3.5 opacity-50" aria-hidden="true" />
                        )}
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => {
              const key = getRowKey(row)
              const isSelected = !!selection?.selected.has(key)
              return (
                <tr
                  key={key}
                  data-state={isSelected ? "selected" : undefined}
                  className="border-b border-border transition-colors last:border-0 hover:bg-muted/50 data-[state=selected]:bg-accent/60"
                >
                  {selection && (
                    <td className="w-10 px-3 py-2.5">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(v) => toggleRow(key, v === true)}
                        aria-label={`Sélectionner ${selection.label(row)}`}
                      />
                    </td>
                  )}
                  {columns.map((column) => (
                    <td
                      key={column.id}
                      className={cn(
                        "px-3 py-2.5 align-middle",
                        alignClass(column.align),
                        column.align === "right" && "tabular-nums",
                        column.hideBelow && HIDE_BELOW[column.hideBelow],
                        column.className
                      )}
                    >
                      {column.cell(row)}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {size > 0 && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-2 pt-4 text-sm text-muted-foreground">
            <label htmlFor={pageSizeId}>Lignes par page</label>
            <Select value={String(size)} onValueChange={(v) => { setSize(Number(v)); setPage(1) }}>
              <SelectTrigger id={pageSizeId} className="h-8 w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((n) => (
                  <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="sm:flex-1">
            <Pager page={currentPage} limit={size} total={sorted.length} onPageChange={setPage} />
          </div>
        </div>
      )}
    </div>
  )
}
