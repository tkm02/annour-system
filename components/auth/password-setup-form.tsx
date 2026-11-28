"use client"

import type React from "react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { AlertCircle, CheckCircle2, Circle, Eye, EyeOff, Loader2, Lock } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ApiError, comptesApi, etatLien, type EtatLien, type UsageLien, type VerificationLien } from "@/lib/api"
import { MOT_DE_PASSE_MAX, jetonDepuisRecherche, reglesMotDePasse, reglesRespectees, sansJeton } from "@/lib/mot-de-passe"

const TEXTES: Record<UsageLien, { titre: string; description: string; bouton: string; succes: string }> = {
  activation: {
    titre: "Activer mon compte",
    description: "Choisissez le mot de passe de votre compte du back-office An-Nour.",
    bouton: "Activer mon compte",
    succes: "Votre compte est activé.",
  },
  reset: {
    titre: "Nouveau mot de passe",
    description: "Choisissez un nouveau mot de passe. Vos autres sessions seront fermées.",
    bouton: "Enregistrer le mot de passe",
    succes: "Votre mot de passe a été modifié.",
  },
}

const ETATS: Record<EtatLien, string> = {
  invalide: "Ce lien n'est pas valide.",
  expire: "Ce lien a expiré.",
  utilise: "Ce lien a déjà été utilisé ou a été remplacé par un lien plus récent.",
}

type Etape =
  | { nom: "verification" }
  | { nom: "lien_refuse"; etat: EtatLien | null; message: string }
  | { nom: "saisie"; info: VerificationLien }
  | { nom: "termine"; username: string }

function LienRefuse({ usage, etat, message }: { usage: UsageLien; etat: EtatLien | null; message: string }) {
  return (
    <div className="space-y-4" role="alert">
      <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive-soft p-4 text-sm">
        <AlertCircle className="h-5 w-5 shrink-0 text-destructive" aria-hidden="true" />
        <p className="text-destructive-strong">{etat ? ETATS[etat] : message}</p>
      </div>
      {usage === "reset" ? (
        <Button asChild className="w-full"><Link href="/mot-de-passe-oublie">Demander un nouveau lien</Link></Button>
      ) : (
        <p className="text-sm text-muted-foreground">
          Demandez un nouveau lien d&apos;activation à l&apos;administration du séminaire (super administrateur).
          Si votre compte est déjà activé, connectez-vous ou utilisez « Mot de passe oublié ».
        </p>
      )}
      <Button asChild variant="outline" className="w-full"><Link href="/">Retour à la connexion</Link></Button>
    </div>
  )
}

/** Définition du mot de passe par lien reçu par email : activation d'un compte ou réinitialisation. */
export default function PasswordSetupForm({ usage }: { usage: UsageLien }) {
  const textes = TEXTES[usage]
  // Le jeton est lu une seule fois à l'initialisation (composant client, pages sans rendu serveur des données)
  const [jeton] = useState<string | null>(() =>
    typeof window === "undefined" ? null : jetonDepuisRecherche(window.location.search))
  // Même état initial au rendu serveur et au premier rendu client (pas d'écart d'hydratation)
  const [etape, setEtape] = useState<Etape>({ nom: "verification" })
  const [password, setPassword] = useState("")
  const [confirmation, setConfirmation] = useState("")
  const [visible, setVisible] = useState(false)
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  useEffect(() => {
    // Jeton retiré de la barre d'adresse et de l'historique : il ne reste qu'en mémoire
    window.history.replaceState(null, "", sansJeton(window.location.href))
    const verification = jeton
      ? comptesApi.verifierLien(jeton, usage)
      : Promise.reject(new ApiError(400, ETATS.invalide, { detail: { code: "invalide" } }))
    verification
      .then((info) => setEtape({ nom: "saisie", info }))
      .catch((err: unknown) => setEtape({
        nom: "lien_refuse", etat: etatLien(err),
        message: err instanceof Error ? err.message : "Vérification du lien impossible. Réessayez plus tard.",
      }))
  }, [jeton, usage])

  // Calcul léger refait à chaque saisie
  const personnels = etape.nom === "saisie" ? [etape.info.username, etape.info.prenom] : []
  const regles = reglesMotDePasse(password, confirmation, personnels)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!jeton || !reglesRespectees(regles)) {
      setErreur("Le mot de passe ne respecte pas encore toutes les règles.")
      return
    }
    setEnvoi(true)
    setErreur(null)
    try {
      const reponse = usage === "activation"
        ? await comptesApi.activer(jeton, password)
        : await comptesApi.reinitialiser(jeton, password)
      setPassword("")
      setConfirmation("")
      setEtape({ nom: "termine", username: reponse.username })
    } catch (err: unknown) {
      const etat = etatLien(err)
      if (etat) {
        setEtape({ nom: "lien_refuse", etat, message: "" })
      } else {
        // 422 : règle de la politique non respectée (message de l'API) ; 429 : délai indiqué
        setErreur(err instanceof ApiError || err instanceof Error ? err.message : "Enregistrement impossible.")
      }
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <Card className="w-full shadow-lg border-0 bg-card">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold text-secondary">{textes.titre}</CardTitle>
        <CardDescription>{textes.description}</CardDescription>
      </CardHeader>
      <CardContent>
        {etape.nom === "verification" && (
          <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground" role="status" aria-live="polite">
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> Vérification du lien…
          </div>
        )}

        {etape.nom === "lien_refuse" && <LienRefuse usage={usage} etat={etape.etat} message={etape.message} />}

        {etape.nom === "termine" && (
          <div className="space-y-4 text-center" role="status">
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" aria-hidden="true" />
            <p className="font-medium">{textes.succes}</p>
            <p className="text-sm text-muted-foreground">
              Connectez-vous avec votre nom d&apos;utilisateur <strong className="text-foreground">{etape.username}</strong> ou
              votre email.
            </p>
            <Button asChild className="w-full"><Link href="/">Se connecter</Link></Button>
          </div>
        )}

        {etape.nom === "saisie" && (
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="rounded-lg bg-muted p-3 text-sm">
              Nom d&apos;utilisateur : <strong className="text-foreground">{etape.info.username}</strong>
            </div>
            {/* Champ caché : permet aux gestionnaires de mots de passe d'associer le mot de passe au compte */}
            <input type="text" name="username" autoComplete="username" value={etape.info.username} readOnly hidden />

            {erreur && (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive-soft p-3 text-sm"
                role="alert">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-destructive" aria-hidden="true" />
                <span className="text-destructive-strong">{erreur}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <Input id="password" type={visible ? "text" : "password"} value={password} maxLength={MOT_DE_PASSE_MAX}
                  onChange={(e) => { setPassword(e.target.value); setErreur(null) }} autoComplete="new-password"
                  className="pl-10 pr-10 h-12" aria-describedby="regles-mot-de-passe" disabled={envoi} required autoFocus />
                <button type="button" onClick={() => setVisible(!visible)} disabled={envoi}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                  aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}>
                  {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmation">Confirmer le mot de passe</Label>
              <Input id="confirmation" type={visible ? "text" : "password"} value={confirmation}
                maxLength={MOT_DE_PASSE_MAX} onChange={(e) => { setConfirmation(e.target.value); setErreur(null) }}
                autoComplete="new-password" className="h-12" disabled={envoi} required />
            </div>

            <ul id="regles-mot-de-passe" className="space-y-1 text-sm" aria-live="polite">
              {regles.map((r) => (
                <li key={r.id} className={r.ok ? "flex items-center gap-2 text-green-700" : "flex items-center gap-2 text-muted-foreground"}>
                  {r.ok ? <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> : <Circle className="h-4 w-4" aria-hidden="true" />}
                  <span>{r.libelle}<span className="sr-only">{r.ok ? " : respecté" : " : non respecté"}</span></span>
                </li>
              ))}
              <li className="text-xs text-muted-foreground pt-1">
                Évitez les mots de passe courants (azerty, 123456…) : ils sont refusés. Une phrase de plusieurs mots est
                plus sûre et plus facile à retenir.
              </li>
            </ul>

            <Button type="submit" className="w-full h-12" disabled={envoi || !reglesRespectees(regles)}>
              {envoi ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enregistrement…</> : textes.bouton}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
