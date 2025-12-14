"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")  // ✅ Garder "email"
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
      console.log("🔐 Tentative de connexion pour:", email)
      
      // ✅ Passer l'email (l'API l'attend)
      const success = await login(email, password)

      if (success) {
        toast.success("Connexion réussie!")
        console.log("✅ Connexion réussie, redirection...")
        
        setTimeout(() => {
          router.push("/dashboard")
        }, 500)
      } else {
        setError("Email ou mot de passe incorrect")
        toast.error("Identifiants incorrects")
      }
    } catch (error: any) {
      console.error("❌ Erreur de connexion:", error)
      
      // ✅ Parser l'erreur API pour afficher un message clair
      let errorMessage = "Erreur lors de la connexion"
      
      if (error.message?.includes("422")) {
        errorMessage = "Email ou mot de passe incorrect"
      } else if (error.message?.includes("401")) {
        errorMessage = "Identifiants invalides"
      } else if (error.message?.includes("403")) {
        errorMessage = "Accès refusé"
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

          {/* ✅ EMAIL (pas username) */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-foreground">
              EMAIL
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="votre.email@exemple.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setError(null)
                }}
                className="pl-10 h-12 border-border focus:border-primary focus:ring-primary"
                required
                disabled={isLoading}
                autoComplete="email"
              />
            </div>
          </div>

          {/* Mot de passe */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-foreground">
              MOT DE PASSE
            </Label>
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
            <p>Utilisez votre <strong>email</strong> et mot de passe fournis par l'administrateur.</p>
            <p className="text-primary font-medium mt-2">
              Exemple : admin@annour.ci
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
