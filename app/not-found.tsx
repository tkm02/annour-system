import Link from "next/link"
import { Compass } from "lucide-react"

import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-8 text-center shadow-xs">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent">
          <Compass className="h-6 w-6 text-accent-foreground" aria-hidden="true" />
        </div>
        <p className="text-sm font-semibold text-primary">Erreur 404</p>
        <h1 className="mt-1 text-xl font-semibold text-foreground">Page introuvable</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          L&apos;adresse demandée n&apos;existe pas ou a été déplacée.
        </p>
        <Button className="mt-6" asChild>
          <Link href="/">Retour à l&apos;accueil</Link>
        </Button>
      </div>
    </main>
  )
}
