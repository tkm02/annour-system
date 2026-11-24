"use client"

import Link from "next/link"
import { AlertTriangle, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"

/** Erreur inattendue d'affichage : message générique (aucun détail technique exposé) et nouvel essai. */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-8 text-center shadow-xs" role="alert">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive-soft">
          <AlertTriangle className="h-6 w-6 text-destructive" aria-hidden="true" />
        </div>
        <h1 className="text-xl font-semibold text-foreground">Une erreur est survenue</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          La page n&apos;a pas pu s&apos;afficher. Réessayez ; si le problème persiste, contactez l&apos;administrateur.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          <Button variant="outline" asChild>
            <Link href="/">Retour à l&apos;accueil</Link>
          </Button>
          <Button onClick={reset}>
            <RefreshCw aria-hidden="true" />
            Réessayer
          </Button>
        </div>
      </div>
    </main>
  )
}
