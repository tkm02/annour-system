import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { NiveauStats } from "@/lib/dashboard-stats"

/**
 * Répartition par niveau : tableau accessible + barre de proportion (garçons / filles) par ligne.
 * Couleurs neutres de la palette graphique (pas de codage genré), toujours doublées des valeurs écrites.
 */
export default function DemographicsTable({ rows }: { rows: NiveauStats[] }) {
  const max = Math.max(1, ...rows.map((r) => r.total))
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Répartition par niveau</CardTitle>
        <CardDescription>Effectifs par niveau académique</CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Aucun séminariste pour le moment.</p>
        ) : (
          <>
            <div className="mb-3 flex items-center gap-4 text-xs text-muted-foreground" aria-hidden="true">
              <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-chart-1" />Garçons</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-chart-4" />Filles</span>
            </div>
            <table className="w-full text-sm">
              <caption className="sr-only">Répartition des séminaristes par niveau et par sexe</caption>
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th scope="col" className="py-2 pr-2 text-left font-semibold">Niveau</th>
                  <th scope="col" className="hidden w-2/5 py-2 font-semibold sm:table-cell"><span className="sr-only">Proportion</span></th>
                  <th scope="col" className="px-2 py-2 text-right font-semibold">Garçons</th>
                  <th scope="col" className="px-2 py-2 text-right font-semibold">Filles</th>
                  <th scope="col" className="py-2 pl-2 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.niveau} className="border-b border-border last:border-0">
                    <th scope="row" className="max-w-40 truncate py-2.5 pr-2 text-left font-medium" title={row.niveau}>{row.niveau}</th>
                    <td className="hidden py-2.5 sm:table-cell" aria-hidden="true">
                      <div className="flex h-2 overflow-hidden rounded-full bg-muted" style={{ width: `${(row.total / max) * 100}%` }}>
                        <span className="bg-chart-1" style={{ width: `${row.total ? (row.garcons / row.total) * 100 : 0}%` }} />
                        <span className="bg-chart-4" style={{ width: `${row.total ? (row.filles / row.total) * 100 : 0}%` }} />
                      </div>
                    </td>
                    <td className="px-2 py-2.5 text-right tabular-nums">{row.garcons}</td>
                    <td className="px-2 py-2.5 text-right tabular-nums">{row.filles}</td>
                    <td className="py-2.5 pl-2 text-right font-semibold tabular-nums">{row.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </CardContent>
    </Card>
  )
}
