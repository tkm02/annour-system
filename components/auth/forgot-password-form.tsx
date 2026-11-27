"use client"

import type React from "react"
import Link from "next/link"
import { useState } from "react"
import { AlertCircle, ArrowLeft, Loader2, MailCheck, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { comptesApi } from "@/lib/api"

/** Demande d'un lien de réinitialisation : la réponse est la même que le compte existe ou non. */
export default function ForgotPasswordForm() {
  const [identifier, setIdentifier] = useState("")
  const [envoi, setEnvoi] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const valeur = identifier.trim()
    if (!valeur) {
      setErreur("Saisissez votre nom d'utilisateur ou votre email.")
      return
    }
    setEnvoi(true)
    setErreur(null)
    try {
      const reponse = await comptesApi.motDePasseOublie(valeur)
      setMessage(reponse.message)
    } catch (err: unknown) {
      setErreur(err instanceof Error ? err.message : "Demande impossible. Réessayez plus tard.")
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <Card className="w-full shadow-lg border-0 bg-card">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold text-secondary">Mot de passe oublié</CardTitle>
        <CardDescription>Recevez par email un lien pour choisir un nouveau mot de passe.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {message ? (
          <div className="space-y-4 text-center" role="status">
            <MailCheck className="mx-auto h-12 w-12 text-primary" aria-hidden="true" />
            <p className="text-sm">{message}</p>
            <p className="text-xs text-muted-foreground">
              Le lien est valable 1 heure et ne fonctionne qu&apos;une fois. Un compte jamais activé doit utiliser son lien
              d&apos;activation : demandez-en un nouveau à l&apos;administration du séminaire.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {erreur && (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive-soft p-3 text-sm"
                role="alert">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-destructive" aria-hidden="true" />
                <span className="text-destructive-strong">{erreur}</span>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="identifier">Nom d&apos;utilisateur ou email</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <Input id="identifier" value={identifier} maxLength={254} autoComplete="username" autoFocus
                  autoCapitalize="none" spellCheck={false} className="pl-10 h-12" disabled={envoi} required
                  onChange={(e) => { setIdentifier(e.target.value); setErreur(null) }} />
              </div>
            </div>
            <Button type="submit" className="w-full h-12" disabled={envoi}>
              {envoi ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Envoi…</> : "Recevoir le lien"}
            </Button>
          </form>
        )}
        <Button asChild variant="ghost" className="w-full gap-2">
          <Link href="/"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Retour à la connexion</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
