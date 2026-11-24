"use client"

import type React from "react"
import { Loader2, type LucideIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Seminariste } from "@/lib/api"
import type { Column } from "@/components/common/data-table"

/**
 * Habillage commun des écrans de documents imprimables (badges, attestations, bulletins).
 * Les gabarits (aperçus et dessins PDF) restent dans leurs pages et ne sont pas modifiés ici.
 */

/** Carte de liste : titre, description et contenu (barre de filtres + tableau). */
export function ListPanel({ title, description, actions, children }: {
  title: string
  description?: React.ReactNode
  actions?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <Card className="gap-4">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <CardTitle className="text-base">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

/** Aperçu du premier élément sélectionné, avec bascule recto / verso facultative. */
export function PreviewPanel({ title = "Aperçu", verso, onToggleVerso, emptyIcon: EmptyIcon, emptyMessage, footer, children }: {
  title?: string
  /** Réglages de l'aperçu, affichés sous le gabarit */
  footer?: React.ReactNode
  verso?: boolean
  onToggleVerso?: () => void
  emptyIcon: LucideIcon
  emptyMessage: string
  /** Gabarit d'aperçu ; `null` si rien n'est sélectionné */
  children: React.ReactNode | null
}) {
  const hasPreview = children !== null && children !== undefined && children !== false
  return (
    <Card className="gap-4">
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-base">{title}</CardTitle>
        {onToggleVerso && (
          <div className="inline-flex rounded-md border border-border p-0.5" role="group" aria-label="Face affichée">
            <Button type="button" size="sm" variant={verso ? "ghost" : "default"} className="h-7 px-3"
              aria-pressed={!verso} onClick={() => verso && onToggleVerso()} disabled={!hasPreview}>
              Recto
            </Button>
            <Button type="button" size="sm" variant={verso ? "default" : "ghost"} className="h-7 px-3"
              aria-pressed={!!verso} onClick={() => !verso && onToggleVerso()} disabled={!hasPreview}>
              Verso
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="flex justify-center overflow-hidden">
        {hasPreview ? (
          children
        ) : (
          <div className="flex h-72 w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border px-4 text-center">
            <EmptyIcon className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">{emptyMessage}</p>
          </div>
        )}
      </CardContent>
      {footer && <CardContent className="border-t border-border pt-4">{footer}</CardContent>}
    </Card>
  )
}

/** Bouton de génération du PDF et rappel du format produit. */
export function GeneratePanel({ label, busyLabel = "Génération en cours…", icon: Icon, count, generating, onGenerate, notes }: {
  /** Libellé du bouton, ex. « Télécharger 3 badges (PDF) » */
  label: string
  busyLabel?: string
  icon: LucideIcon
  count: number
  generating: boolean
  onGenerate: () => void
  /** Caractéristiques du document produit */
  notes?: string[]
}) {
  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle className="text-base">Génération</CardTitle>
        <CardDescription>
          {count === 0 ? "Aucun élément sélectionné." : `${count} élément${count > 1 ? "s" : ""} sélectionné${count > 1 ? "s" : ""}.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button className="w-full" size="lg" onClick={onGenerate} disabled={count === 0 || generating}>
          {generating ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Icon aria-hidden="true" />}
          {generating ? busyLabel : label}
        </Button>
        {notes && notes.length > 0 && (
          <ul className="list-disc space-y-1 rounded-md bg-muted px-6 py-3 text-xs text-muted-foreground">
            {notes.map((note) => <li key={note}>{note}</li>)}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

/** Actions de sélection en masse sur la liste filtrée. */
export function SelectionActions({ filteredCount, allFilteredSelected, selectedCount, onSelectFiltered, onClear }: {
  filteredCount: number
  allFilteredSelected: boolean
  selectedCount: number
  onSelectFiltered: () => void
  onClear: () => void
}) {
  return (
    <>
      {!allFilteredSelected && filteredCount > 0 && (
        <Button type="button" variant="outline" size="sm" onClick={onSelectFiltered}>
          Sélectionner les {filteredCount.toLocaleString("fr-FR")} résultats
        </Button>
      )}
      {selectedCount > 0 && (
        <Button type="button" variant="ghost" size="sm" onClick={onClear}>
          Effacer la sélection ({selectedCount.toLocaleString("fr-FR")})
        </Button>
      )}
    </>
  )
}

/** Filtre par niveau de test (valeurs présentes dans la liste). */
export function NiveauFilter({ value, onChange, niveaux }: {
  value: string
  onChange: (value: string) => void
  niveaux: string[]
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full bg-card sm:w-48" aria-label="Filtrer par niveau"><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value="tous">Tous les niveaux</SelectItem>
        {niveaux.map((niveau) => <SelectItem key={niveau} value={niveau}>{niveau}</SelectItem>)}
      </SelectContent>
    </Select>
  )
}

/** Niveaux distincts et triés d'une liste de séminaristes. */
export const niveauxOf = (rows: readonly Pick<Seminariste, "niveau">[]) =>
  Array.from(new Set(rows.map((s) => s.niveau).filter((n): n is string => !!n))).sort((a, b) => a.localeCompare(b, "fr"))

type SeminaristeLigne = Pick<Seminariste, "matricule" | "nom" | "prenom" | "niveau">

/** Colonnes communes d'une liste de séminaristes à sélectionner. */
export function seminaristeColumns<T extends SeminaristeLigne>(): Column<T>[] {
  return [
    { id: "matricule", header: "Matricule", cell: (s) => <span className="font-mono text-xs">{s.matricule}</span>, sortValue: (s) => s.matricule },
    {
      id: "nom", header: "Nom et prénom", sortValue: (s) => `${s.nom} ${s.prenom ?? ""}`,
      cell: (s) => (
        <div className="min-w-0">
          <div className="font-medium">{s.nom}</div>
          <div className="text-sm text-muted-foreground">{s.prenom}</div>
        </div>
      ),
    },
    {
      id: "niveau", header: "Niveau", sortValue: (s) => s.niveau, hideBelow: "sm",
      cell: (s) => s.niveau ?? <span className="text-muted-foreground">Non classé</span>,
    },
  ]
}
