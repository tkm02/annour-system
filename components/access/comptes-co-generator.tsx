"use client"

import { useCallback, useEffect, useState } from "react"
import { Loader2, RefreshCw, UserPlus } from "lucide-react"
import { toast } from "sonner"

import ConfirmDialog from "@/components/common/confirm-dialog"
import { EmptyState, ErrorState, LoadingState, errorText } from "@/components/common/states"
import { StatusBadge } from "@/components/common/status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { comptesApi, type ApercuComptesCO, type RapportGenerationComptesCO } from "@/lib/api"
import { roleLabel } from "@/lib/roles"

const STATUT_RESULTAT = {
  cree: { tone: "success", label: "Créé" },
  ignore: { tone: "neutral", label: "Ignoré" },
  erreur: { tone: "danger", label: "Erreur" },
} as const

function Rapport({ rapport, onFermer }: { rapport: RapportGenerationComptesCO; onFermer: () => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Rapport de génération — {rapport.edition}</CardTitle>
        <CardDescription>
          {rapport.crees} créé(s) · {rapport.ignores} ignoré(s) · {rapport.erreurs} en erreur
          {rapport.emails_non_envoyes > 0 && ` · ${rapport.emails_non_envoyes} email(s) non envoyé(s) : renvoyez le lien depuis l'onglet Comptes`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Membre</TableHead>
                <TableHead>Nom d&apos;utilisateur</TableHead>
                <TableHead>Résultat</TableHead>
                <TableHead>Email d&apos;activation</TableHead>
                <TableHead>Motif</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rapport.resultats.map((r) => (
                <TableRow key={r.participation_id}>
                  <TableCell>{`${r.nom} ${r.prenoms}`.trim() || "—"}</TableCell>
                  <TableCell className="font-mono text-sm">{r.username ?? "—"}</TableCell>
                  <TableCell><StatusBadge tone={STATUT_RESULTAT[r.statut].tone}>{STATUT_RESULTAT[r.statut].label}</StatusBadge></TableCell>
                  <TableCell>
                    {r.email_envoye === true && <StatusBadge tone="success">Envoyé</StatusBadge>}
                    {r.email_envoye === false && <StatusBadge tone="danger">Non envoyé</StatusBadge>}
                    {r.email_envoye == null && "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{r.motif ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <Button variant="outline" onClick={onFermer}>Revenir à l&apos;aperçu</Button>
      </CardContent>
    </Card>
  )
}

/**
 * Génération en lot des comptes des membres du CO (super_admin) : l'aperçu est calculé par l'API (fiches validées de
 * l'édition active, commissions ayant accès au back-office) ; rien n'est créé avant la confirmation.
 */
export default function ComptesCOGenerator({ onGenere }: { onGenere: () => void }) {
  const [apercu, setApercu] = useState<ApercuComptesCO | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)
  const [selection, setSelection] = useState<Set<string>>(new Set())
  const [confirmation, setConfirmation] = useState(false)
  const [generation, setGeneration] = useState(false)
  const [rapport, setRapport] = useState<RapportGenerationComptesCO | null>(null)

  const charger = useCallback(async () => {
    try {
      const data = await comptesApi.apercuComptesCO()
      setErreur(null)
      setApercu(data)
      setSelection(new Set(data.lignes.filter((l) => l.statut === "a_creer").map((l) => l.participation_id)))
    } catch (err) {
      setErreur(errorText(err, "Aperçu indisponible"))
    }
  }, [])

  useEffect(() => { charger() }, [charger])

  // Rechargement demandé : l'aperçu affiché est d'abord retiré (indicateur de chargement)
  const recharger = () => {
    setErreur(null)
    setApercu(null)
    charger()
  }

  const generer = async () => {
    setGeneration(true)
    try {
      const resultat = await comptesApi.genererComptesCO([...selection])
      setRapport(resultat)
      setConfirmation(false)
      if (resultat.emails_non_envoyes > 0) {
        toast.warning(`${resultat.crees} compte(s) créé(s), ${resultat.emails_non_envoyes} email(s) non envoyé(s)`)
      } else {
        toast.success(`${resultat.crees} compte(s) créé(s), liens d'activation envoyés`)
      }
      onGenere()
    } catch (err) {
      toast.error(errorText(err, "Génération impossible"))
      setConfirmation(false)
    } finally {
      setGeneration(false)
    }
  }

  if (rapport) return <Rapport rapport={rapport} onFermer={() => { setRapport(null); recharger() }} />
  if (erreur) return <ErrorState message={erreur} onRetry={recharger} />
  if (!apercu) return <LoadingState label="Calcul de l'aperçu…" />

  const aCreer = apercu.lignes.filter((l) => l.statut === "a_creer")
  const ignores = apercu.lignes.filter((l) => l.statut === "ignore")
  const tout = aCreer.length > 0 && aCreer.every((l) => selection.has(l.participation_id))
  const basculer = (id: string) => setSelection((s) => {
    const suivant = new Set(s)
    if (suivant.has(id)) suivant.delete(id)
    else suivant.add(id)
    return suivant
  })

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between space-y-0">
          <div>
            <CardTitle className="text-base">Comptes à créer — {apercu.edition}</CardTitle>
            <CardDescription>
              Fiches CO validées des commissions Scientifique, Administration, Finance et Santé, sans compte. Chaque
              membre recevra par email son nom d&apos;utilisateur et un lien d&apos;activation valable 72 h.
            </CardDescription>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" size="sm" className="gap-2" onClick={recharger}>
              <RefreshCw className="h-4 w-4" aria-hidden="true" />Actualiser
            </Button>
            <Button size="sm" className="gap-2" disabled={selection.size === 0} onClick={() => setConfirmation(true)}>
              <UserPlus className="h-4 w-4" aria-hidden="true" />Générer {selection.size} compte(s)
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {aCreer.length === 0 ? (
            <EmptyState title="Aucun compte à créer"
              message="Toutes les fiches validées ont déjà un compte, ou aucune fiche n'est encore validée (Recensement CO)." />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox checked={tout} aria-label="Tout sélectionner"
                        onCheckedChange={(v) => setSelection(v ? new Set(aCreer.map((l) => l.participation_id)) : new Set())} />
                    </TableHead>
                    <TableHead>Membre</TableHead>
                    <TableHead>Commission</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Nom d&apos;utilisateur</TableHead>
                    <TableHead className="hidden md:table-cell">Email</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {aCreer.map((l) => (
                    <TableRow key={l.participation_id}>
                      <TableCell>
                        <Checkbox checked={selection.has(l.participation_id)} onCheckedChange={() => basculer(l.participation_id)}
                          aria-label={`Sélectionner ${l.nom} ${l.prenoms}`} />
                      </TableCell>
                      <TableCell className="font-medium">{l.nom} {l.prenoms}</TableCell>
                      <TableCell>{l.commission}</TableCell>
                      <TableCell>{roleLabel(l.role)}</TableCell>
                      <TableCell className="font-mono text-sm">{l.username}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm">{l.email}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {ignores.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Fiches ignorées ({ignores.length})</CardTitle>
            <CardDescription>Corrigez la fiche (ex. email manquant) dans le Recensement CO, puis actualisez l&apos;aperçu.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="divide-y text-sm">
              {ignores.map((l) => (
                <li key={l.participation_id} className="flex flex-col gap-1 py-2 sm:flex-row sm:items-center sm:justify-between">
                  <span className="font-medium">{l.nom} {l.prenoms} <span className="text-muted-foreground font-normal">· {l.commission}</span></span>
                  <span className="text-muted-foreground">{l.motif}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={confirmation}
        title={`Générer ${selection.size} compte(s) ?`}
        description="Les comptes seront créés inactifs et chaque membre recevra un email avec son nom d'utilisateur et un lien d'activation. Cette action envoie des emails réels."
        confirmLabel="Générer et envoyer"
        tone="default"
        busy={generation}
        onConfirm={generer}
        onCancel={() => setConfirmation(false)}
      />
      {generation && <span className="sr-only" role="status"><Loader2 aria-hidden="true" />Génération en cours…</span>}
    </div>
  )
}
