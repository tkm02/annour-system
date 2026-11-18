"use client"

import type React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { ShieldAlert } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { allowedRolesFor, homeFor } from "@/lib/navigation"
import type { UserRole } from "@/lib/roles"

interface ProtectedRouteProps {
  children: React.ReactNode
  /** Rôles autorisés ; par défaut, ceux de la matrice lib/navigation.ts pour la page courante */
  roles?: UserRole[]
}

function Loader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background" role="status" aria-live="polite">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Vérification de l&apos;authentification…</p>
      </div>
    </div>
  )
}

export function AccessDenied({ home }: { home: string }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6" role="alert">
      <div className="max-w-md text-center space-y-4">
        <ShieldAlert className="mx-auto h-12 w-12 text-destructive" aria-hidden="true" />
        <h1 className="text-xl font-bold">Accès refusé</h1>
        <p className="text-muted-foreground">
          Votre rôle ne permet pas d&apos;accéder à cette page. Si vous pensez qu&apos;il s&apos;agit d&apos;une erreur,
          contactez l&apos;administrateur.
        </p>
        <Button asChild>
          <Link href={home}>Retour à mon tableau de bord</Link>
        </Button>
      </div>
    </div>
  )
}

export default function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Non connecté : retour à la connexion
  useEffect(() => {
    if (isMounted && !isAuthenticated) router.push("/")
  }, [isMounted, isAuthenticated, router])

  // Rendu serveur et premier rendu client identiques
  if (!isMounted || !isAuthenticated || !user) return <Loader />

  const allowed = roles ?? allowedRolesFor(pathname ?? "")
  if (allowed && !(allowed as string[]).includes(user.role)) {
    return <AccessDenied home={homeFor(user.role)} />
  }

  return <>{children}</>
}
