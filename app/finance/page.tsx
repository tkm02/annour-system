"use client"

import { useCallback, useEffect, useState } from "react"
import { ArrowDownRight, ArrowUpRight, Info, Scale } from "lucide-react"

import SimpleBarChart, { recordToBars } from "@/components/common/bar-chart"
import { ErrorState, LoadingState, errorText } from "@/components/common/states"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { financeApi, type DashboardFinance, type SyncStatus } from "@/lib/api"
import { formatDate, formatMontant } from "@/lib/format"

function StatTile({ title, montant, count, hint }: { title: string; montant: number; count?: number; hint?: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-2xl tabular-nums">{formatMontant(montant)}</CardTitle>
      </CardHeader>
      <CardContent className="text-xs text-muted-foreground">
        {count !== undefined ? `${count} opération${count > 1 ? "s" : ""}` : hint}
      </CardContent>
    </Card>
  )
}

/** F-F7 : état de synchronisation en lecture seule (pas de synchronisation complète proposée). */
function SyncCard() {
  const [status, setStatus] = useState<SyncStatus | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    financeApi.getSyncStatus().then(setStatus).catch((err) => setError(errorText(err, "État indisponible")))
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Inscriptions reportées en finances</CardTitle>
        <CardDescription>Inscriptions au paiement vérifié ayant leur entrée financière.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : !status ? (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        ) : (
          <>
            <Progress value={status.sync_percentage} aria-label={`${status.sync_percentage} % synchronisé`} />
            <p className="text-sm">
              {status.synced_count} / {status.total_registrations} ({status.sync_percentage} %) — {formatMontant(status.total_amount)}
            </p>
            {status.not_synced_count > 0 && (
              <p className="text-xs text-muted-foreground flex gap-2">
                <Info className="h-4 w-4 shrink-0" aria-hidden="true" />
                {status.not_synced_count} inscription(s) vérifiée(s) sans entrée financière. La synchronisation complète
                est suspendue en attendant la décision sur les inscriptions historiques sans ID de transaction.
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default function FinanceDashboardPage() {
  const [data, setData] = useState<DashboardFinance | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    setData(null)
    try {
      setData(await financeApi.getDashboard())
    } catch (err) {
      setError(errorText(err, "Tableau de bord indisponible"))
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Finances</h1>
          <p className="text-muted-foreground">Vue d&apos;ensemble des entrées, sorties et du solde.</p>
        </div>

        {error ? (
          <ErrorState message={error} onRetry={load} />
        ) : !data ? (
          <LoadingState />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-1"><ArrowUpRight className="h-4 w-4" aria-hidden="true" /> Total des entrées</CardDescription>
                  <CardTitle className="text-2xl tabular-nums">{formatMontant(data.total_entrees)}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-1"><ArrowDownRight className="h-4 w-4" aria-hidden="true" /> Total des sorties</CardDescription>
                  <CardTitle className="text-2xl tabular-nums">{formatMontant(data.total_sorties)}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-1"><Scale className="h-4 w-4" aria-hidden="true" /> Solde</CardDescription>
                  <CardTitle className={`text-2xl tabular-nums ${data.solde < 0 ? "text-destructive" : ""}`}>
                    {formatMontant(data.solde)}
                  </CardTitle>
                </CardHeader>
              </Card>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <StatTile title="Inscriptions" montant={data.inscriptions.montant} count={data.inscriptions.count} />
              <StatTile title="Dons" montant={data.dons.montant} count={data.dons.count} />
              <StatTile title="Ventes" montant={data.ventes.montant} count={data.ventes.count} />
              <StatTile title="Autres entrées" montant={data.autres_entrees.montant} count={data.autres_entrees.count} />
              <StatTile title="Sorties" montant={data.sorties.montant} count={data.sorties.count} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle className="text-base">Entrées par catégorie</CardTitle></CardHeader>
                <CardContent>
                  <SimpleBarChart data={recordToBars(data.repartition_entrees)} seriesName="Montant des entrées" formatValue={formatMontant} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-base">Sorties par catégorie</CardTitle></CardHeader>
                <CardContent>
                  <SimpleBarChart data={recordToBars(data.repartition_sorties)} seriesName="Montant des sorties" formatValue={formatMontant} />
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader><CardTitle className="text-base">10 dernières opérations</CardTitle></CardHeader>
                <CardContent className="overflow-x-auto">
                  {data.transactions_recentes.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Aucune opération.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Libellé</TableHead>
                          <TableHead className="text-right">Montant</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.transactions_recentes.map((t) => (
                          <TableRow key={t.reference}>
                            <TableCell className="whitespace-nowrap">{formatDate(t.date_transaction)}</TableCell>
                            <TableCell>
                              <Badge variant={t.type === "ENTREE" ? "default" : "secondary"}>
                                {t.type === "ENTREE" ? "Entrée" : "Sortie"}
                              </Badge>
                              <span className="ml-2 text-xs text-muted-foreground">{t.categorie}</span>
                            </TableCell>
                            <TableCell>{t.libelle}{t.nom_seminariste ? ` — ${t.nom_seminariste}` : ""}</TableCell>
                            <TableCell className="text-right tabular-nums whitespace-nowrap">
                              {t.type === "SORTIE" ? "− " : ""}{formatMontant(t.montant)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
              <SyncCard />
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
