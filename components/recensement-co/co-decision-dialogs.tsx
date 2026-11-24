"use client"

import type React from "react"
import { useState } from "react"
import { Loader2 } from "lucide-react"

import Field from "@/components/finance/field"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { MOTIF_MAX, validateMotif } from "@/lib/recensement-co"

/**
 * Confirmation d'une action (valider, fusionner, abandonner…). Le focus initial est sur « Annuler »
 * (comportement par défaut de l'AlertDialog Radix) pour éviter une validation involontaire au clavier.
 */
export function ActionConfirm({ open, title, description, confirmLabel, cancelLabel = "Annuler", busy, onConfirm, onCancel }: {
  open: boolean
  title: string
  description: React.ReactNode
  confirmLabel: string
  cancelLabel?: string
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && !busy && onCancel()}>
      <AlertDialogContent className="max-h-[90dvh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription asChild><div className="space-y-2">{description}</div></AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction disabled={busy} onClick={(e) => { e.preventDefault(); onConfirm() }}>
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}{confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

/** Rejet d'une fiche : motif obligatoire (3 à 500 caractères), erreur de l'API affichée dans le dialogue. */
export function RejectDialog({ open, name, wasValidated, busy, apiError, onConfirm, onCancel }: {
  open: boolean
  name: string
  /** La fiche était validée : le rejet annule cette validation */
  wasValidated?: boolean
  busy?: boolean
  apiError?: string | null
  onConfirm: (motif: string) => void
  onCancel: () => void
}) {
  const [motif, setMotif] = useState("")
  const [error, setError] = useState<string | null>(null)

  const close = () => {
    if (busy) return
    onCancel()
  }
  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    const problem = validateMotif(motif)
    setError(problem)
    if (problem) document.getElementById("co-motif-rejet")?.focus()
    else onConfirm(motif.trim())
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rejeter la fiche</DialogTitle>
          <DialogDescription>{name} — le motif est conservé avec la fiche.</DialogDescription>
        </DialogHeader>
        {wasValidated && (
          <p className="rounded-md border border-secondary/60 bg-secondary/10 px-3 py-2 text-sm text-foreground" role="note">
            Cette fiche était validée : le rejet annule la validation.
          </p>
        )}
        <form onSubmit={submit} className="space-y-4" noValidate>
          <Field id="co-motif-rejet" label="Motif du rejet *" error={error ?? undefined}
            hint={`${motif.trim().length} / ${MOTIF_MAX} caractères (3 minimum)`}>
            {(p) => <Textarea {...p} aria-required rows={4} maxLength={MOTIF_MAX + 50} value={motif} disabled={busy}
              onChange={(e) => { setMotif(e.target.value); if (error) setError(validateMotif(e.target.value)) }} />}
          </Field>
          {apiError && <p className="whitespace-pre-line text-sm text-destructive" role="alert">{apiError}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={close} disabled={busy}>Annuler</Button>
            <Button type="submit" variant="destructive" disabled={busy}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}Rejeter la fiche
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
