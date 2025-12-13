import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface RecentRegistration {
  matricule: string
  nom: string
  prenom: string
  sexe: string
  dortoir: string
}

interface RecentRegistrationsProps {
  data: RecentRegistration[]
}

export default function RecentRegistrations({ data }: RecentRegistrationsProps) {
  // Les 5 plus récents (tri par ID ou date si disponible)
  const recent = data
    .sort((a, b) => (b.matricule as string).localeCompare(a.matricule as string))
    .slice(0, 5)
    .map(reg => ({
      matricule: reg.matricule,
      nom: `${reg.nom} ${reg.prenom}`,
      genre: reg.sexe,
      dortoir: reg.dortoir || 'Non assigné',
      date: new Date().toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      })
    }))

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">
          Enregistrements récents
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recent.map((registration, index) => (
            <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">
                    {registration.matricule}
                  </span>
                  <Badge 
                    variant={registration.genre === "M" ? "default" : "secondary"} 
                    className="text-xs"
                  >
                    {registration.genre}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                  {registration.nom}
                </div>
                <div className="text-xs text-muted-foreground">
                  {registration.dortoir}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground">
                  {registration.date}
                </div>
              </div>
            </div>
          ))}
          {recent.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              Aucun enregistrement récent
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
