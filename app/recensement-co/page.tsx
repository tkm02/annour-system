"use client"

import { useCallback, useMemo, useState } from "react"
import { RefreshCw } from "lucide-react"

import { PageHeader } from "@/components/common/page-header"
import { StatGridSkeleton } from "@/components/common/stat-card"
import { ErrorState } from "@/components/common/states"
import DashboardLayout from "@/components/layout/dashboard-layout"
import CoCasTab from "@/components/recensement-co/co-cas-tab"
import CoDetailDialog from "@/components/recensement-co/co-detail-dialog"
import CoFichesTab from "@/components/recensement-co/co-fiches-tab"
import { apiErrorMessage } from "@/components/recensement-co/co-shared"
import CoStatsCards from "@/components/recensement-co/co-stats-cards"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRemoteData } from "@/hooks/use-remote-data"
import { ApiError, recensementCoApi } from "@/lib/api"

type Onglet = "fiches" | "cas"

/** Recensement des membres du CO pour l'édition en cours (admin) — contrat /admin/co/* du Backend. */
export default function RecensementCOPage() {
  // Incrémenté après chaque action : synthèse et listes se rechargent (le détail ouvert n'est pas relu)
  const [version, setVersion] = useState(0)
  const [onglet, setOnglet] = useState<Onglet>("fiches")
  const [openId, setOpenId] = useState<string | null>(null)
  const [highlightFicheId, setHighlightFicheId] = useState<string | null>(null)
  const refresh = useCallback(() => setVersion((v) => v + 1), [])

  const stats = useRemoteData(recensementCoApi.getStats, version)
  // Commissions actives (valeurs acceptées par la correction) ; repli sur celles des fiches si indisponible
  const config = useRemoteData(recensementCoApi.getConfiguration)

  const commissionsFiltre = useMemo(() => {
    const all = new Set([...(config.data?.commissions ?? []), ...Object.keys(stats.data?.par_commission ?? {})])
    return [...all]
  }, [config.data, stats.data])
  const commissionsActives = config.data?.commissions ?? []
  const qualitesParCommission = config.data?.qualites_par_commission ?? null
  const edition = stats.data?.edition ?? null
  const editionLibelle = config.data?.edition?.code === edition && config.data?.edition?.libelle ? config.data.edition.libelle : edition
  const cas = stats.data?.cas_a_verifier ?? 0
  // 503 : aucune édition active, toutes les routes /admin/co/* répondent de même → onglets masqués
  const recensementFerme = stats.error instanceof ApiError && stats.error.status === 503

  const showCas = (ficheId?: string) => {
    setHighlightFicheId(ficheId ?? null)
    setOpenId(null)
    setOnglet("cas")
  }

  return (
    <DashboardLayout>
      <PageHeader
        title={`Recensement CO${editionLibelle ? ` — ${editionLibelle}` : ""}`}
        description="Fiches transmises par le formulaire public : vérification, correction, validation et cas à vérifier."
        actions={
          <Button variant="outline" onClick={refresh} disabled={stats.loading}>
            <RefreshCw className={stats.loading ? "animate-spin" : undefined} aria-hidden="true" /> Actualiser
          </Button>
        }
      />
      <div className="space-y-6">

        <section aria-label="Synthèse du recensement">
          {stats.error ? (
            <Card><CardContent>
              <ErrorState message={apiErrorMessage(stats.error, "Synthèse du recensement indisponible")} onRetry={stats.reload} />
            </CardContent></Card>
          ) : !stats.data ? (
            <StatGridSkeleton />
          ) : (
            <CoStatsCards stats={stats.data} onShowCas={() => showCas()} />
          )}
        </section>

        {!recensementFerme && (
          <Tabs value={onglet} onValueChange={(v) => { setOnglet(v as Onglet); setHighlightFicheId(null) }}>
            <TabsList className="w-full sm:w-fit">
              <TabsTrigger value="fiches">Fiches</TabsTrigger>
              <TabsTrigger value="cas">
                Cas à vérifier
                {cas > 0 && (
                  <span className="ml-1 rounded-full bg-warning-soft px-1.5 text-xs font-semibold text-warning-strong">
                    {cas}<span className="sr-only"> cas ouverts</span>
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
            {/* forceMount : filtres, recherche et page conservés en changeant d'onglet */}
            <TabsContent value="fiches" forceMount className="data-[state=inactive]:hidden">
              <Card><CardContent>
                <CoFichesTab version={version} commissions={commissionsFiltre} edition={edition} onOpen={setOpenId} />
              </CardContent></Card>
            </TabsContent>
            <TabsContent value="cas" forceMount className="data-[state=inactive]:hidden">
              <CoCasTab version={version} highlightFicheId={highlightFicheId} onChanged={refresh} />
            </TabsContent>
          </Tabs>
        )}
      </div>
      {/* Monté seulement pendant l'ouverture : le détail (santé) n'est pas conservé après fermeture */}
      {openId && (
        <CoDetailDialog key={openId} id={openId} commissions={commissionsActives} qualitesParCommission={qualitesParCommission}
          onClose={() => setOpenId(null)} onChanged={refresh} onShowCas={showCas} />
      )}
    </DashboardLayout>
  )
}
