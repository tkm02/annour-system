"use client"

import { Loader2 } from "lucide-react"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"

/** Confirmation d'une action : destructive par défaut (suppression), `tone="default"` pour une action ordinaire. */
export default function ConfirmDialog({
  open, title, description, confirmLabel = "Supprimer", busy, onConfirm, onCancel, tone = "destructive",
}: {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
  tone?: "destructive" | "default"
}) {
  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && !busy && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={(e) => { e.preventDefault(); onConfirm() }} disabled={busy}
            className={tone === "destructive" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : undefined}>
            {busy && <Loader2 className="h-4 w-4 animate-spin mr-2" />}{confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
