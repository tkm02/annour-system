"use client"

import type React from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

interface ProtectedRouteProps {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuth()
  const router = useRouter()
  const [isMounted, setIsMounted] = useState(false)

  // S'assurer que le composant est monté côté client
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Rediriger si non authentifié (uniquement côté client)
  useEffect(() => {
    if (isMounted && !isAuthenticated) {
      router.push("/")
    }
  }, [isMounted, isAuthenticated, router])

  // Pendant le SSR et le premier rendu client, toujours afficher le loader
  // Cela garantit que le HTML serveur = HTML client initial
  if (!isMounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Vérification de l'authentification...</p>
        </div>
      </div>
    )
  }

  // Après le montage, vérifier l'authentification
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Vérification de l'authentification...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
