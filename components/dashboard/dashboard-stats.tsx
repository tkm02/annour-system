"use client"

import { Sprout, User, UserRound, Users } from "lucide-react"

import { StatCard, StatGrid } from "@/components/common/stat-card"
import { formatPercent, type DashboardStats as Stats } from "@/lib/dashboard-stats"

/** 4 indicateurs clés ; le détail (Pépinière, parts) figure dans le complément de chaque carte. */
export default function DashboardStats({ stats }: { stats: Stats }) {
  const n = (value: number) => value.toLocaleString("fr-FR")
  return (
    <StatGrid label="Indicateurs clés">
      <StatCard label="Séminaristes inscrits" value={n(stats.total)} icon={Users} hint="Pépinière comprise" />
      <StatCard
        label="Garçons"
        value={n(stats.garcons)}
        icon={User}
        hint={`${formatPercent(stats.partGarcons)} · dont ${n(stats.pepiniereGarcons)} en Pépinière`}
      />
      <StatCard
        label="Filles"
        value={n(stats.filles)}
        icon={UserRound}
        hint={`${formatPercent(stats.partFilles)} · dont ${n(stats.pepiniereFilles)} en Pépinière`}
      />
      <StatCard
        label="Pépinière"
        value={n(stats.pepiniere)}
        icon={Sprout}
        tone="brand"
        hint={`${n(stats.pepiniereGarcons)} garçons · ${n(stats.pepiniereFilles)} filles`}
      />
    </StatGrid>
  )
}
