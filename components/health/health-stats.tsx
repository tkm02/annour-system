"use client"

import { Activity, AlertTriangle, CalendarCheck, ClipboardList, HeartPulse, Users } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { StatistiquesSante } from "@/lib/api"

/** F-S1 : chiffres réels de GET /sante/statistiques (la carte « Consultations actives » a été retirée). */
export default function HealthStats({ stats }: { stats: StatistiquesSante }) {
  const tiles = [
    {
      title: "Séminaristes",
      value: stats.total_seminaristes,
      detail: `${stats.seminaristes_par_sexe.M} hommes · ${stats.seminaristes_par_sexe.F} femmes`,
      icon: Users,
    },
    { title: "Consultations", value: stats.total_consultations, detail: "depuis le début", icon: ClipboardList },
    { title: "Aujourd'hui", value: stats.consultations_aujourdhui, detail: "consultations du jour", icon: CalendarCheck },
    { title: "Patients consultés", value: stats.patients_consultes, detail: "au moins une consultation", icon: Activity },
    { title: "Allergies signalées", value: stats.patients_avec_allergies, detail: "séminaristes concernés", icon: AlertTriangle },
    { title: "Antécédents médicaux", value: stats.patients_avec_antecedents, detail: "séminaristes concernés", icon: HeartPulse },
  ]
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
      {tiles.map((tile) => (
        <Card key={tile.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{tile.title}</CardTitle>
            <tile.icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{tile.value}</div>
            <p className="text-xs text-muted-foreground">{tile.detail}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
