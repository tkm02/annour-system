"use client"

import { useCallback, useState } from "react"
import { AlertTriangle, CheckCircle2, Pencil, ShieldAlert, XCircle } from "lucide-react"
import { toast } from "sonner"

import { ErrorState, LoadingState } from "@/components/common/states"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useAuth } from "@/contexts/auth-context"
import { useRemoteData } from "@/hooks/use-remote-data"
import { ApiError, recensementCoApi, type ParticipationCODetail } from "@/lib/api"
import { formatDate } from "@/lib/format"
import { formatDateNaissance, qualiteLabel, sexeLabel, typeLabel, type QualitesParCommission } from "@/lib/recensement-co"
import CoCorrectionForm from "./co-correction-form"
import { ActionConfirm, RejectDialog } from "./co-decision-dialogs"
import { CoPhoto, InfoRow, StatutBadge, apiErrorMessage } from "./co-shared"

type Pending = "valider" | "rejeter" | "abandon" | null

const decisionLabel = (statut: string) =>
  statut === "validee" ? "Validée le" : statut === "rejetee" ? "Rejetée le" : "Dernière décision le"

function DetailView({ detail }: { detail: ParticipationCODetail }) {
  return (
    <div className="space-y-5">
      <section aria-labelledby="co-d-identite">
        <h3 id="co-d-identite" className="text-sm font-semibold">Identité et contact</h3>
        <dl className="divide-y">
          <InfoRow label="Nom">{detail.nom}</InfoRow>
          <InfoRow label="Prénoms">{detail.prenoms}</InfoRow>
          <InfoRow label="Sexe">{sexeLabel(detail.sexe)}</InfoRow>
          <InfoRow label="Date de naissance">{formatDateNaissance(detail.date_naissance)}</InfoRow>
          <InfoRow label="Téléphone">{detail.telephone ?? "—"}</InfoRow>
          <InfoRow label="Email">{detail.email ?? "—"}</InfoRow>
        </dl>
      </section>
      <section aria-labelledby="co-d-participation">
        <h3 id="co-d-participation" className="text-sm font-semibold">Participation à l&apos;édition</h3>
        <dl className="divide-y">
          <InfoRow label="Commission">{detail.commission}</InfoRow>
          <InfoRow label="Qualité">{qualiteLabel(detail.qualite)}</InfoRow>
          <InfoRow label="Ancien / nouveau">{typeLabel(detail.type)}</InfoRow>
          <InfoRow label="Soumise le">{formatDate(detail.soumise_at, true)}</InfoRow>
          <InfoRow label="Consentement le">{formatDate(detail.consentement_at, true)}</InfoRow>
          {detail.validee_at && (
            <InfoRow label={decisionLabel(detail.statut_fiche)}>
              {formatDate(detail.validee_at, true)}{detail.validee_par ? ` par ${detail.validee_par}` : ""}
            </InfoRow>
          )}
          {detail.motif_rejet && <InfoRow label="Motif du rejet">{detail.motif_rejet}</InfoRow>}
        </dl>
      </section>
      <section aria-labelledby="co-d-sante" className="rounded-lg border border-destructive/40 p-4">
        <h3 id="co-d-sante" className="flex items-center gap-2 text-sm font-semibold">
          <ShieldAlert className="h-4 w-4 text-destructive" aria-hidden="true" /> Données de santé — confidentiel
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">Accès journalisé. Ne pas recopier hors de l&apos;application.</p>
        <dl className="mt-2 divide-y">
          <InfoRow label="Allergies"><span className="whitespace-pre-line">{detail.allergies || "Aucune déclarée"}</span></InfoRow>
          <InfoRow label="Antécédents médicaux"><span className="whitespace-pre-line">{detail.antecedents_medicaux || "Aucun déclaré"}</span></InfoRow>
        </dl>
      </section>
      <section aria-labelledby="co-d-historique">
        <h3 id="co-d-historique" className="text-sm font-semibold">Historique des éditions</h3>
        {detail.historique.length === 0 ? (
          <p className="py-1.5 text-sm text-muted-foreground">Aucune autre édition enregistrée.</p>
        ) : (
          <ul className="divide-y text-sm">
            {detail.historique.map((h, i) => (
              <li key={`${h.edition ?? "?"}-${i}`} className="flex flex-wrap justify-between gap-2 py-1.5">
                <span className="font-medium">{h.edition ?? "Édition inconnue"}</span>
                <span className="text-muted-foreground">{h.commission} · {qualiteLabel(h.qualite)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

/**
 * Détail d'une fiche (santé comprise), correction, validation et rejet. Monté uniquement pendant l'ouverture
 * (`key` = id côté page) : les données de santé ne restent pas en mémoire après la fermeture. Un seul GET du
 * détail par ouverture (lecture journalisée côté serveur) : le PATCH renvoie la fiche, valider/rejeter la mettent à
 * jour localement.
 */
export default function CoDetailDialog({ id, commissions, qualitesParCommission = null, onClose, onChanged, onShowCas }: {
  id: string
  commissions: string[]
  qualitesParCommission?: QualitesParCommission
  onClose: () => void
  /** Recharge la synthèse et les listes (jamais le détail) */
  onChanged: () => void
  onShowCas: (participationId: string) => void
}) {
  const fetcher = useCallback(() => recensementCoApi.get(id), [id])
  const remote = useRemoteData(fetcher, 0, { keepPrevious: false })
  const [local, setLocal] = useState<ParticipationCODetail | null>(null)
  const detail = local ?? remote.data
  const [editing, setEditing] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [pending, setPending] = useState<Pending>(null)
  const [busy, setBusy] = useState(false)
  const [conflict, setConflict] = useState<string | null>(null)
  const [rejectError, setRejectError] = useState<string | null>(null)
  const [closeAfterAbandon, setCloseAfterAbandon] = useState(false)
  const { user } = useAuth()

  /** Fermeture (Échap, clic extérieur, croix) : confirmation si une correction est en cours. */
  const requestClose = () => {
    if (busy) return
    if (editing && dirty) {
      setCloseAfterAbandon(true)
      setPending("abandon")
    } else onClose()
  }
  const requestCancelEdit = () => {
    if (dirty) {
      setCloseAfterAbandon(false)
      setPending("abandon")
    } else setEditing(false)
  }
  const abandon = () => {
    setPending(null)
    setDirty(false)
    setEditing(false)
    if (closeAfterAbandon) onClose()
  }

  const decide = (patch: Partial<ParticipationCODetail>) => {
    if (detail) setLocal({ ...detail, ...patch })
    setPending(null)
    onChanged()
  }

  const valider = async () => {
    if (!detail) return
    setBusy(true)
    setConflict(null)
    try {
      const r = await recensementCoApi.validate(detail.id)
      toast.success("Fiche validée")
      decide({ statut_fiche: r.statut_fiche, validee_at: new Date().toISOString(), validee_par: user?.username ?? null, motif_rejet: null })
    } catch (err) {
      setPending(null)
      if (err instanceof ApiError && err.status === 409) setConflict(err.message)
      else toast.error(apiErrorMessage(err, "Validation impossible"))
    } finally {
      setBusy(false)
    }
  }

  const rejeter = async (motif: string) => {
    if (!detail) return
    setBusy(true)
    setRejectError(null)
    try {
      const r = await recensementCoApi.reject(detail.id, motif)
      toast.success("Fiche rejetée")
      decide({ statut_fiche: r.statut_fiche, validee_at: new Date().toISOString(), validee_par: user?.username ?? null, motif_rejet: motif })
    } catch (err) {
      setRejectError(apiErrorMessage(err, "Rejet impossible"))
    } finally {
      setBusy(false)
    }
  }

  const name = detail ? `${detail.nom} ${detail.prenoms}` : ""
  const aVerifier = detail?.statut_fiche === "a_verifier"

  return (
    <Dialog open onOpenChange={(o) => !o && requestClose()}>
      <DialogContent className="h-[100dvh] max-w-full overflow-y-auto rounded-none sm:h-auto sm:max-h-[90vh] sm:max-w-3xl sm:rounded-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Corriger la fiche" : "Fiche du membre"}</DialogTitle>
          <DialogDescription>{detail ? name : "Recensement du comité d'organisation"}</DialogDescription>
        </DialogHeader>

        {remote.error && !detail ? (
          <ErrorState message={apiErrorMessage(remote.error, "Fiche indisponible")} onRetry={remote.reload} />
        ) : !detail ? (
          <LoadingState label="Chargement de la fiche…" />
        ) : (
          <div className="space-y-5">
            <div className="flex items-start gap-4">
              <CoPhoto url={detail.photo_url} sexe={detail.sexe} name={name} className="h-[120px] w-24" />
              <div className="min-w-0 space-y-2">
                <p className="text-lg font-medium break-words">{name}</p>
                <StatutBadge statut={detail.statut_fiche} />
                <p className="text-sm text-muted-foreground">{detail.commission} · {qualiteLabel(detail.qualite)} · {typeLabel(detail.type)}</p>
              </div>
            </div>

            {(aVerifier || conflict) && (
              <Alert className="border-secondary">
                <AlertTriangle aria-hidden="true" />
                <AlertTitle>Cas à vérifier</AlertTitle>
                <AlertDescription>
                  <p>{conflict ?? "Cette fiche ressemble à une personne déjà connue. Traitez le cas avant de la valider."}</p>
                  <Button variant="outline" size="sm" className="mt-2" disabled={editing && dirty} onClick={() => onShowCas(detail.id)}>
                    Voir les cas à vérifier
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {editing ? (
              <CoCorrectionForm key={detail.id} detail={detail} commissions={commissions}
                qualitesParCommission={qualitesParCommission} onDirtyChange={setDirty}
                onCancel={requestCancelEdit}
                onSaved={(saved) => { setLocal(saved); setDirty(false); setEditing(false); onChanged() }} />
            ) : (
              <>
                <DetailView detail={detail} />
                <div className="sticky bottom-0 -mx-6 -mb-6 space-y-2 border-t bg-background px-6 py-4 sm:static sm:m-0 sm:p-0 sm:pt-4">
                  {aVerifier && (
                    <p id="co-valider-aide" className="text-sm text-muted-foreground sm:text-right">Traitez d&apos;abord le cas à vérifier.</p>
                  )}
                  <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <Button variant="outline" className="gap-2" onClick={() => setEditing(true)} disabled={busy}>
                      <Pencil className="h-4 w-4" aria-hidden="true" /> Corriger
                    </Button>
                    {detail.statut_fiche !== "rejetee" && (
                      <Button variant="outline" className="gap-2 border-destructive/60" disabled={busy}
                        onClick={() => { setRejectError(null); setPending("rejeter") }}>
                        <XCircle className="h-4 w-4 text-destructive" aria-hidden="true" /> Rejeter
                      </Button>
                    )}
                    {detail.statut_fiche !== "validee" && (
                      <Button className="gap-2"
                        disabled={busy || aVerifier} aria-describedby={aVerifier ? "co-valider-aide" : undefined}
                        onClick={() => setPending("valider")}>
                        <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Valider
                      </Button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        <ActionConfirm open={pending === "valider"} busy={busy} onCancel={() => setPending(null)} onConfirm={valider}
          title={`Valider la fiche de ${name} ?`} confirmLabel="Valider la fiche"
          description="La fiche sera marquée comme validée. Le membre ne pourra plus la modifier depuis le formulaire public." />
        <ActionConfirm open={pending === "abandon"} onCancel={() => setPending(null)} onConfirm={abandon}
          title="Abandonner les modifications ?" confirmLabel="Abandonner les modifications" cancelLabel="Continuer la correction"
          description="Les modifications non enregistrées de cette fiche seront perdues." />
        {pending === "rejeter" && detail && (
          <RejectDialog open name={name} wasValidated={detail.statut_fiche === "validee"} busy={busy} apiError={rejectError}
            onConfirm={rejeter} onCancel={() => setPending(null)} />
        )}
      </DialogContent>
    </Dialog>
  )
}
