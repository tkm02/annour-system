import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { initials } from "@/lib/nav-ui"

export interface RecentRegistration {
  matricule: string
  nom: string
  prenom: string
  sexe: string
  dortoir?: string | null
  registration_date?: string | null
}

const formatDate = (value?: string | null) =>
  value
    ? new Date(value).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
    : "—"

/** Dernières inscriptions (liste déjà triée par l'appelant). */
export default function RecentRegistrations({ rows }: { rows: RecentRegistration[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Inscriptions récentes</CardTitle>
        <CardDescription>Les dernières fiches enregistrées</CardDescription>
        <CardAction>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/seminaristes">
              Tout voir <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Aucune inscription pour le moment.</p>
        ) : (
          <ul role="list" className="divide-y divide-border">
            {rows.map((r) => (
              <li key={r.matricule} className="flex items-center gap-3 py-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground" aria-hidden="true">
                  {initials(`${r.prenom} ${r.nom}`)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{r.nom} {r.prenom}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    <span className="font-mono">{r.matricule}</span> · {r.sexe === "M" ? "Garçon" : r.sexe === "F" ? "Fille" : "—"} · {r.dortoir || "Dortoir non attribué"}
                  </p>
                </div>
                <time className="shrink-0 text-xs text-muted-foreground" dateTime={r.registration_date ?? undefined}>
                  {formatDate(r.registration_date)}
                </time>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
