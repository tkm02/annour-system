"use client"

import { useCallback, useEffect, useState } from "react"

import { ErrorState, LoadingState, errorText } from "@/components/common/states"
import HealthDemographics from "@/components/health/health-demographics"
import HealthStats from "@/components/health/health-stats"
import RecentConsultations from "@/components/health/recent-consultations"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { santeApi, type StatistiquesSante } from "@/lib/api"

export default function SantePage() {
  const [stats, setStats] = useState<StatistiquesSante | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      setStats(await santeApi.getStatistiques())
    } catch (err) {
      setError(errorText(err, "Statistiques indisponibles"))
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Santé</h1>
          <p className="text-muted-foreground">Vue d&apos;ensemble des consultations médicales</p>
        </div>
        {error ? <ErrorState message={error} onRetry={load} /> : !stats ? <LoadingState /> : (
          <>
            <HealthStats stats={stats} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <HealthDemographics stats={stats} />
              <RecentConsultations />
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
