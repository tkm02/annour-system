"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, UserCheck, UserX, GraduationCap } from "lucide-react"

interface Stat {
  title: string
  value: string
  icon: React.ElementType
  color: string
}

interface DashboardStatsProps {
  totalSeminaristes: number
  data: any[]
}

export default function DashboardStats({ 
  totalSeminaristes, 
  data 
}: DashboardStatsProps) {
  
  const malesCount = data.filter(s => (s.sexe === 'M' && (!s.dortoir?.includes('Pépinière')))).length
  const femalesCount = data.filter(s => (s.sexe === 'F' && (!s.dortoir?.includes('Pépinière')))).length
  const pepiniereCount = data.filter(s => s.dortoir?.includes('Pépinière')).length
  const pepiniereGarcon = data.filter(s => (s.dortoir?.includes('Pépinière') && s.sexe === 'M')).length
  const pepiniereFille = data.filter(s => (s.dortoir?.includes('Pépinière') && s.sexe === 'F')).length
  const malePercentage = totalSeminaristes > 0 ? ((malesCount + pepiniereGarcon) / totalSeminaristes) * 100 : 0
  const femalePercentage = totalSeminaristes > 0 ? ((femalesCount + pepiniereFille) / totalSeminaristes) * 100 : 0
  const stats: Stat[] = [
    {
      title: "Totales Séminaristes",
      value: totalSeminaristes.toString().padStart(3, "0"),
      icon: Users,
      color: "text-primary",
    },
    {
      title: "Séminaristes Garçons",
      value: malesCount.toString().padStart(3, "0"),
      icon: UserCheck,
      color: "text-secondary",
    },
    {
      title: "Séminaristes Filles",
      value: femalesCount.toString().padStart(3, "0"),
      icon: UserX,
      color: "text-accent",
    },
    {
      title: "Séminaristes Pépinières",
      value: pepiniereCount.toString().padStart(3, "0"),
      icon: GraduationCap,
      color: "text-muted-foreground",
    },
    {
      title: "Séminaristes Pépinières Garçons",
      value: pepiniereGarcon.toString().padStart(3, "0"),
      icon: UserCheck,
      color: "text-secondary",
    },
    {
      title: "Séminaristes Pépinières Filles",
      value: pepiniereFille.toString().padStart(3, "0"),
      icon: UserX,
      color: "text-accent",
    },
    {
      title: "Pourcentage Garçons",
      value: `${malePercentage.toFixed(2)}%`,
      icon: UserCheck,
      color: "text-secondary",
    },
    {
      title: "Pourcentage Filles",
      value: `${femalePercentage.toFixed(2)}%`,
      icon: UserX,
      color: "text-accent",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <Card key={index} className="border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
