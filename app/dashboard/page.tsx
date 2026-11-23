"use client"

import { useMemo } from "react"
import { RefreshCw } from "lucide-react"

import DashboardLayout from "@/components/layout/dashboard-layout"
import DashboardStats from "@/components/dashboard/dashboard-stats"
import DemographicsTable from "@/components/dashboard/demographics-table"
import RecentRegistrations, { type RecentRegistration } from "@/components/dashboard/recent-registrations"
import { PageHeader } from "@/components/common/page-header"
import { StatGridSkeleton } from "@/components/common/stat-card"
import { ErrorState, ListSkeleton, errorText } from "@/components/common/states"
import { Button } from "@/components/ui/button"
import { dashboardApi } from "@/lib/api"
import { computeDashboardStats, recentRegistrations, type SeminaristeResume } from "@/lib/dashboard-stats"
import { EDITION } from "@/lib/edition"
import { useRemoteData } from "@/hooks/use-remote-data"

type Row = SeminaristeResume & RecentRegistration

export default function DashboardPage() {
  const { data, error: loadError, loading, reload } = useRemoteData(dashboardApi.getDashboardData)
  const rows = useMemo(() => (data?.seminaristes ?? []) as Row[], [data])
  const total = data?.total ?? 0
  const error = loadError
    ? errorText(loadError, "Impossible de charger le tableau de bord. Vérifiez votre connexion puis réessayez.")
    : null
  const firstLoad = loading && !data

  const stats = useMemo(() => computeDashboardStats(rows, total), [rows, total])
  const recent = useMemo(() => recentRegistrations(rows, 8), [rows])

  return (
    <DashboardLayout>
      <PageHeader
        title="Tableau de bord"
        description={`Vue d'ensemble de la ${EDITION.libelle} du séminaire An-Nour`}
        actions={
          <Button variant="outline" onClick={reload} disabled={loading}>
            <RefreshCw className={loading ? "animate-spin" : undefined} aria-hidden="true" />
            Actualiser
          </Button>
        }
      />

      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : firstLoad ? (
        <div className="space-y-6">
          <StatGridSkeleton />
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-lg border border-border bg-card p-6"><ListSkeleton rows={4} /></div>
            <div className="rounded-lg border border-border bg-card p-6"><ListSkeleton rows={4} /></div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <DashboardStats stats={stats} />
          <div className="grid gap-6 lg:grid-cols-2">
            <DemographicsTable rows={stats.parNiveau} />
            <RecentRegistrations rows={recent} />
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
