"use client"

import type React from "react"
import { useState } from "react"
import { Link2, Loader2, Unlink } from "lucide-react"
import { toast } from "sonner"

import Field from "@/components/finance/field"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ApiError, adminApi, type Seminariste } from "@/lib/api"
import { MATRICULE_MAX, normaliserMatricule, reinscriptionErrorMessage, validateMatriculePrecedent } from "@/lib/reinscription"

export type ReinscriptionAction = "lier" | "delier"

/**
 * Rattachement manuel (admin) d'une inscription à celle de l'édition précédente : saisie, confirmation, PATCH.
 * « Délier » envoie `matricule_precedent: null`. Erreurs 404 / 409 affichées dans le dialogue.
 */
export default function ReinscriptionDialog({ seminariste, action, onClose, onDone }: {
  seminariste: Seminariste
  action: ReinscriptionAction
  onClose: () => void
  onDone: () => void
}) {
  const [saisie, setSaisie] = useState(seminariste.matricule_precedent ?? "")
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(action === "delier")
  const [busy, setBusy] = useState(false)
  const nom = `${seminariste.nom} ${seminariste.prenom}`
  const cible = normaliserMatricule(saisie)

  const close = () => {
    if (!busy) onClose()
  }

  const verifier = (event: React.FormEvent) => {
    event.preventDefault()
    const problem = validateMatriculePrecedent(saisie, seminariste.matricule)
    setFieldError(problem)
    setApiError(null)
    if (problem) document.getElementById("reinscription-matricule")?.focus()
    else setConfirming(true)
  }

  const envoyer = async () => {
    setBusy(true)
    setApiError(null)
    try {
      await adminApi.setReinscription(seminariste.matricule, action === "lier" ? cible : null)
      toast.success(action === "lier" ? `Inscription liée à ${cible}` : "Lien avec l'an dernier retiré")
      onDone()
    } catch (err) {
      setApiError(err instanceof ApiError ? reinscriptionErrorMessage(err) : "Opération impossible.")
      if (action === "lier") setConfirming(false)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && close()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{action === "lier" ? "Lier à l'inscription de l'an dernier" : "Délier de l'inscription de l'an dernier"}</DialogTitle>
          <DialogDescription>{nom} — inscription {seminariste.matricule}</DialogDescription>
        </DialogHeader>

        {action === "lier" && !confirming && (
          <form onSubmit={verifier} className="space-y-4" noValidate>
            <Field id="reinscription-matricule" label="Matricule de l'an dernier *" error={fieldError ?? undefined}
              hint="Matricule de l'inscription à l'édition précédente (espaces et casse ignorés).">
              {(p) => <Input {...p} aria-required autoComplete="off" maxLength={MATRICULE_MAX + 10} value={saisie}
                className="font-mono uppercase" onChange={(e) => { setSaisie(e.target.value); if (fieldError) setFieldError(null) }} />}
            </Field>
            {apiError && <p className="whitespace-pre-line text-sm text-destructive" role="alert">{apiError}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={close}>Annuler</Button>
              <Button type="submit" className="gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/90">
                <Link2 className="h-4 w-4" aria-hidden="true" /> Continuer
              </Button>
            </DialogFooter>
          </form>
        )}

        {confirming && (
          <div className="space-y-4">
            <p className="text-sm">
              {action === "lier" ? (
                <>Lier l&apos;inscription <strong className="font-mono">{seminariste.matricule}</strong> à l&apos;inscription de l&apos;an
                  dernier <strong className="font-mono">{cible}</strong> ? Elle sera affichée comme « Ancien (confirmé) » et ne sera
                  plus à vérifier.</>
              ) : (
                <>Retirer le lien entre <strong className="font-mono">{seminariste.matricule}</strong> et l&apos;inscription de
                  l&apos;an dernier <strong className="font-mono">{seminariste.matricule_precedent}</strong> ? L&apos;inscription sera
                  considérée comme nouvelle.</>
              )}
            </p>
            {apiError && <p className="whitespace-pre-line text-sm text-destructive" role="alert">{apiError}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" disabled={busy} autoFocus
                onClick={() => (action === "lier" ? setConfirming(false) : close())}>
                {action === "lier" ? "Modifier le matricule" : "Annuler"}
              </Button>
              <Button type="button" disabled={busy} onClick={envoyer}
                className={action === "lier" ? "gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/90" : "gap-2"}
                variant={action === "lier" ? "default" : "destructive"}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  : action === "lier" ? <Link2 className="h-4 w-4" aria-hidden="true" /> : <Unlink className="h-4 w-4" aria-hidden="true" />}
                {action === "lier" ? "Confirmer le lien" : "Délier"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
