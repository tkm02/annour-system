"use client"

import SimpleBarChart from "@/components/common/bar-chart"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { StatistiquesSante } from "@/lib/api"

const dayLabel = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit" })

/** F-S1 : consultations des 7 derniers jours et répartition par sexe (données réelles). */
export default function HealthDemographics({ stats }: { stats: StatistiquesSante }) {
  const days = stats.consultations_7_derniers_jours.map((d) => ({ label: dayLabel(d.date), value: d.nombre }))
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Consultations des 7 derniers jours</CardTitle>
        <CardDescription>
          Par sexe (depuis le début) : {stats.consultations_par_sexe.M} hommes · {stats.consultations_par_sexe.F} femmes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SimpleBarChart data={days} seriesName="Consultations" orientation="vertical" formatValue={(v) => String(v)} />
      </CardContent>
    </Card>
  )
}
