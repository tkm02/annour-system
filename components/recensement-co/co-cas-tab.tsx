"use client"

import type React from "react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Check, EqualNot, UserCheck, UserPlus } from "lucide-react"
import { toast } from "sonner"

import Pager from "@/components/common/pager"
import { EmptyState, ErrorState, LoadingState } from "@/components/common/states"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useRemoteData } from "@/hooks/use-remote-data"
import { ApiError, recensementCoApi, type CandidatCorrespondanceCO, type CorrespondanceCO } from "@/lib/api"
import { formatDate } from "@/lib/format"
import {
  PAGE_SIZE, changementsFusion, comparerCandidat, formatDateNaissance, motifCorrespondanceLabel, pageRecalee,
  qualiteLabel, type Comparaison,
} from "@/lib/recensement-co"
import { cn } from "@/lib/utils"
import { ActionConfirm } from "./co-decision-dialogs"
import { CoPhoto, StatutBadge, apiErrorMessage } from "./co-shared"

type Decision = { cas: CorrespondanceCO; candidat: CandidatCorrespondanceCO | null }

/** Valeur d'un candidat avec repère « identique » / « différent » (icône + texte, jamais la couleur seule). */
function Value({ cmp, children }: { cmp: Comparaison; children: React.ReactNode }) {
  return (
    <span className="inline-flex flex-wrap items-start gap-1 break-words">
      {children}
      {cmp === "identique" && (
        <span className="inline-flex items-center gap-0.5 rounded border border-primary bg-primary/15 px-1 text-xs text-foreground">
          <Check className="h-3 w-3" aria-hidden="true" />identique
        </span>
      )}
      {cmp === "different" && (
        <span className="inline-flex items-center gap-0.5 rounded border border-destructive/60 bg-destructive/10 px-1 text-xs text-foreground">
          <EqualNot className="h-3 w-3" aria-hidden="true" />différent
        </span>
      )}
    </span>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="py-1.5 text-sm">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  )
}

function CasCard({ cas, onDecide, busy, highlighted, error }: {
  cas: CorrespondanceCO
  onDecide: (d: Decision) => void
  busy: boolean
  highlighted: boolean
  error?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const f = cas.fiche
  const name = `${f.nom} ${f.prenoms}`

  // Cas ouvert depuis le détail d'une fiche : le faire défiler à l'écran et y placer le focus
  useEffect(() => {
    if (!highlighted || !ref.current) return
    ref.current.scrollIntoView({ behavior: "smooth", block: "start" })
    ref.current.focus({ preventScroll: true })
  }, [highlighted])

  return (
    <Card ref={ref} tabIndex={-1} aria-labelledby={`cas-${cas.id}-titre`}
      className={cn("gap-4 outline-none", highlighted && "ring-2 ring-secondary")}>
      <CardHeader>
        {highlighted && <p className="text-xs font-semibold text-secondary dark:text-foreground">Cas de la fiche consultée</p>}
        <CardTitle id={`cas-${cas.id}-titre`} className="text-base">{name}</CardTitle>
        <p className="text-sm text-muted-foreground">{motifCorrespondanceLabel(cas.motif)} · détecté le {formatDate(cas.created_at, true)}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          <section aria-label={`Fiche soumise par ${name}`} className="rounded-lg border-2 border-secondary/60 p-3">
            <div className="mb-2 flex items-center gap-3">
              <CoPhoto url={f.photo_url} sexe={f.sexe} name={name} className="h-16 w-[51px]" />
              <div className="space-y-1">
                <h3 className="text-sm font-semibold">Fiche soumise</h3>
                <StatutBadge statut={f.statut_fiche} />
              </div>
            </div>
            <dl className="divide-y">
              <Row label="Nom">{f.nom}</Row>
              <Row label="Prénoms">{f.prenoms}</Row>
              <Row label="Téléphone">{f.telephone ?? "—"}</Row>
              <Row label="Email">{f.email ?? "—"}</Row>
              <Row label="Date de naissance">{formatDateNaissance(f.date_naissance)}</Row>
              <Row label="Commission (édition en cours)">{f.commission} · {qualiteLabel(f.qualite)}</Row>
            </dl>
          </section>
          {cas.candidats.length === 0 && (
            <p className="text-sm text-muted-foreground">Aucun candidat disponible (personne supprimée entre-temps).</p>
          )}
          {cas.candidats.map((c, index) => {
            const cmp = comparerCandidat(f, c)
            const candidatName = `${c.nom} ${c.prenoms}`
            return (
              <section key={c.personne_id} aria-label={`Personne connue ${index + 1} : ${candidatName}`} className="rounded-lg border p-3">
                <div className="mb-2 flex items-center gap-3">
                  <CoPhoto url={c.photo_url} sexe={c.sexe ?? null} name={candidatName} className="h-16 w-[51px]" />
                  <h3 className="text-sm font-semibold">Personne connue{cas.candidats.length > 1 ? ` n° ${index + 1}` : ""}</h3>
                </div>
                <dl className="divide-y">
                  <Row label="Nom"><Value cmp={cmp.nom}>{c.nom}</Value></Row>
                  <Row label="Prénoms"><Value cmp={cmp.prenoms}>{c.prenoms}</Value></Row>
                  <Row label="Téléphones"><Value cmp={cmp.telephone}>{c.telephones.length ? c.telephones.join(", ") : "—"}</Value></Row>
                  <Row label="Email"><Value cmp={cmp.email}>{c.email ?? "—"}</Value></Row>
                  <Row label="Date de naissance"><Value cmp={cmp.date_naissance}>{formatDateNaissance(c.date_naissance)}</Value></Row>
                  <Row label="Commissions par édition">
                    {c.commissions.length ? (
                      <ul className="list-inside list-disc">{c.commissions.map((x) => <li key={x}>{x}</li>)}</ul>
                    ) : "—"}
                  </Row>
                </dl>
              </section>
            )
          })}
        </div>

        {/* Décisions : même poids visuel, après tous les candidats */}
        <div className="flex flex-col gap-2 border-t pt-4 sm:flex-row sm:flex-wrap">
          {cas.candidats.map((c) => (
            <Button key={c.personne_id} variant="outline" className="h-auto min-h-9 gap-2 whitespace-normal text-left" disabled={busy}
              onClick={() => onDecide({ cas, candidat: c })}>
              <UserCheck className="h-4 w-4 shrink-0" aria-hidden="true" /> C&apos;est la même personne que {c.nom} {c.prenoms}
            </Button>
          ))}
          <Button variant="outline" className="h-auto min-h-9 gap-2 whitespace-normal text-left" disabled={busy}
            onClick={() => onDecide({ cas, candidat: null })}>
            <UserPlus className="h-4 w-4 shrink-0" aria-hidden="true" /> Aucune de ces personnes : enregistrer comme nouvelle
          </Button>
        </div>
        {error && <p className="whitespace-pre-line text-sm text-destructive" role="alert">{error}</p>}
      </CardContent>
    </Card>
  )
}

function FusionDescription({ decision }: { decision: Decision & { candidat: CandidatCorrespondanceCO } }) {
  const { cas, candidat } = decision
  const changes = changementsFusion(cas.fiche, candidat)
  const show = (v: string | null | undefined) => (v === undefined ? "valeur actuelle non communiquée" : v ?? "(vide)")
  return (
    <>
      <p>
        L&apos;identité de <strong>{candidat.nom} {candidat.prenoms}</strong> (personne connue) sera remplacée par celle de la
        fiche soumise par <strong>{cas.fiche.nom} {cas.fiche.prenoms}</strong> :
      </p>
      {changes.length === 0 ? (
        <p>Aucun champ d&apos;identité ne change.</p>
      ) : (
        <ul className="list-disc space-y-1 pl-5 text-foreground">
          {changes.map((c) => (
            <li key={c.champ}>{c.libelle} : {show(c.avant)} → {show(c.apres)}</li>
          ))}
        </ul>
      )}
      <p>
        Les anciens numéros restent connus. La fiche devra ensuite être validée ; le doublon sera supprimé.
        <strong> Cette action est irréversible.</strong>
      </p>
    </>
  )
}

/** Onglet « Cas à vérifier » : fiches ambiguës, comparées aux personnes connues, à fusionner ou à séparer. */
export default function CoCasTab({ version, highlightFicheId, onChanged }: {
  version: number
  /** Fiche dont le détail a demandé « Voir les cas à vérifier » */
  highlightFicheId: string | null
  onChanged: () => void
}) {
  const [page, setPage] = useState(1)
  const [decision, setDecision] = useState<Decision | null>(null)
  const [busy, setBusy] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const params = useMemo(() => ({ statut: "ouverte" as const, skip: (page - 1) * PAGE_SIZE, limit: PAGE_SIZE }), [page])
  const fetcher = useCallback(() => recensementCoApi.listCorrespondances(params), [params])
  const { data, error, loading, reload } = useRemoteData(fetcher, version)

  // Dernier cas de la page traité : revenir à la dernière page non vide
  if (data && !loading && !error) {
    const recalee = pageRecalee(page, data.total, data.data.length)
    if (recalee !== page) setPage(recalee)
  }

  const resoudre = async () => {
    if (!decision) return
    const { cas, candidat } = decision
    setBusy(true)
    setErrors(({ [cas.id]: _old, ...rest }) => rest)
    try {
      await recensementCoApi.resolve(cas.id, candidat
        ? { decision: "fusion", personne_id: candidat.personne_id }
        : { decision: "nouveau" })
      toast.success(candidat ? "Fiches fusionnées : la fiche est à valider." : "Enregistrée comme nouvelle personne : la fiche est à valider.")
      setDecision(null)
      onChanged()
    } catch (err) {
      // 409 explicites du serveur (doublon avec historique, fiche existante validée, cas déjà traité) : detail affiché
      const message = apiErrorMessage(err, "Traitement du cas impossible")
      toast.error(message)
      setErrors((e) => ({ ...e, [cas.id]: message }))
      setDecision(null)
      if (err instanceof ApiError && (err.status === 409 || err.status === 404)) onChanged()
    } finally {
      setBusy(false)
    }
  }

  const fiche = decision?.cas.fiche
  const ficheName = fiche ? `${fiche.nom} ${fiche.prenoms}` : ""
  const total = data?.total ?? 0

  return (
    <div className="space-y-4" aria-busy={loading}>
      {error ? (
        <ErrorState message={apiErrorMessage(error, "Cas à vérifier indisponibles")} onRetry={reload} />
      ) : !data ? (
        <LoadingState label="Chargement des cas à vérifier…" />
      ) : data.data.length === 0 ? (
        <EmptyState message="Aucun cas à vérifier." />
      ) : (
        data.data.map((cas) => (
          <CasCard key={cas.id} cas={cas} onDecide={setDecision} busy={busy} error={errors[cas.id]}
            highlighted={!!highlightFicheId && cas.fiche.id === highlightFicheId} />
        ))
      )}
      {data && total > PAGE_SIZE && <Pager page={page} limit={PAGE_SIZE} total={total} onPageChange={setPage} disabled={loading} />}

      <ActionConfirm open={!!decision} busy={busy} onCancel={() => setDecision(null)} onConfirm={resoudre}
        title={decision?.candidat ? "Fusionner avec la personne connue ?" : "Enregistrer comme nouvelle personne ?"}
        confirmLabel={decision?.candidat ? "Fusionner définitivement" : "Enregistrer comme nouvelle personne"}
        description={decision?.candidat ? (
          <FusionDescription decision={{ cas: decision.cas, candidat: decision.candidat }} />
        ) : (
          <p>
            La fiche de <strong>{ficheName}</strong> sera conservée comme une nouvelle personne, distincte des personnes
            connues proposées, et repassera au statut « Soumise » (à valider).
          </p>
        )} />
    </div>
  )
}
