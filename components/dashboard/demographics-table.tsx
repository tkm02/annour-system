import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

interface DemographicsData {
  niveau_academique: string
  sexe: string
}

interface DemographicsTableProps {
  data: DemographicsData[]
}

export default function DemographicsTable({ data }: DemographicsTableProps) {
  // Group by niveau_academique
  const demographics = data.reduce((acc: any, seminariste) => {
    const niveau = seminariste.niveau_academique || 'Non classé'
    if (!acc[niveau]) {
      acc[niveau] = { garcons: 0, filles: 0 }
    }
    if (seminariste.sexe === 'M') {
      acc[niveau].garcons += 1
    } else if (seminariste.sexe === 'F') {
      acc[niveau].filles += 1
    }
    return acc
  }, {})

  const demographicsArray = Object.entries(demographics).map(([niveau, counts]: any) => ({
    niveau,
    garcons: counts.garcons.toString().padStart(2, "0"),
    filles: counts.filles.toString().padStart(2, "0"),
  }))

  return (
    <Card className="border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold text-foreground">Démographie</CardTitle>
        <Button variant="outline" size="sm" className="gap-2 bg-transparent">
          <Download className="h-4 w-4" />
          Exporter
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4 text-sm font-medium text-muted-foreground border-b border-border pb-2">
            <div>Niveau</div>
            <div>Garçons</div>
            <div>Filles</div>
          </div>
          {demographicsArray.slice(0, 5).map((row, index) => (
            <div key={index} className="grid grid-cols-3 gap-4 text-sm">
              <div className="font-medium text-foreground">{row.niveau}</div>
              <div className="text-secondary font-semibold">{row.garcons}</div>
              <div className="text-primary font-semibold">{row.filles}</div>
            </div>
          ))}
          {demographicsArray.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              Aucune donnée démographique
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
