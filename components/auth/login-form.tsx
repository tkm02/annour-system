"use client"

import type React from "react"
import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { User, Lock, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { authApi } from "@/lib/api"
import { homeFor } from "@/lib/navigation"
import { normalizeRole } from "@/lib/roles"

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  // Nom d'utilisateur OU email (l'API accepte les deux, sans tenir compte des majuscules)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    // Validation
    if (!email || !password) {
      setError("Veuillez remplir tous les champs")
      setIsLoading(false)
      return
    }

    try {
      const success = await login(email.trim(), password)

      if (success) {
        toast.success("Connexion réussie!")
        // F-F8 : chaque rôle arrive sur son propre tableau de bord
        const role = normalizeRole(authApi.getCurrentUser()?.role)
        setTimeout(() => {
          router.push(homeFor(role))
        }, 500)
      } else {
        setError("Identifiant ou mot de passe incorrect")
        toast.error("Identifiants incorrects")
      }
    } catch (error: any) {
      
      // ✅ Parser l'erreur API pour afficher un message clair
      let errorMessage = "Erreur lors de la connexion"
      
      // 429 (trop de tentatives) et 500 : le message d'ApiError contient déjà le délai ou la référence
      // 401 : même message pour un identifiant inconnu, un mot de passe faux ou un compte pas encore activé (API)
      if (error?.status === 422 || error?.status === 401) {
        errorMessage = "Identifiant ou mot de passe incorrect. Compte pas encore activé ? Utilisez le lien reçu par email."
      } else if (error?.status === 403) {
        errorMessage = error.message || "Accès refusé"
      } else if (error.message) {
        errorMessage = error.message
      }
      
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full shadow-lg border-0 bg-card">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold text-secondary">Connexion</CardTitle>
        <CardDescription className="text-muted-foreground">
          Connectez-vous à votre compte pour accéder au système
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Message d'erreur */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div className="text-sm">{error}</div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-foreground">
              NOM D&apos;UTILISATEUR OU EMAIL
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <Input
                id="email"
                type="text"
                placeholder="ex. kawa ou awa.kone@exemple.com"
                autoCapitalize="none"
                spellCheck={false}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setError(null)
                }}
                className="pl-10 h-12 border-border focus:border-primary focus:ring-primary"
                required
                disabled={isLoading}
                autoComplete="username"
              />
            </div>
          </div>

          {/* Mot de passe */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="password" className="text-sm font-medium text-foreground">
                MOT DE PASSE
              </Label>
              <Link href="/mot-de-passe-oublie" className="text-sm text-primary underline-offset-4 hover:underline">
                Mot de passe oublié ?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setError(null)
                }}
                className="pl-10 pr-10 h-12 border-border focus:border-primary focus:ring-primary"
                required
                disabled={isLoading}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 h-4 w-4 text-muted-foreground hover:text-foreground transition-colors"
                disabled={isLoading}
                aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Bouton de connexion */}
          <Button
            type="submit"
            className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connexion en cours...
              </>
            ) : (
              "Se connecter"
            )}
          </Button>
        </form>

        {/* Section informations */}
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <p className="text-sm font-medium text-muted-foreground mb-2">
            💡 Information
          </p>
          <div className="text-xs space-y-1 text-muted-foreground">
            <p>Connectez-vous avec votre <strong>nom d&apos;utilisateur</strong> ou votre <strong>email</strong>.</p>
            <p>
              Nouveau compte : ouvrez le lien d&apos;activation reçu par email pour choisir votre mot de passe. Lien
              expiré ? Demandez-en un nouveau à l&apos;administration du séminaire.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
