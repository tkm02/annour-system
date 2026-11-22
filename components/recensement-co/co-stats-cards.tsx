"use client"

import { CheckCircle2, Clock, FileWarning, Scale, UserPlus, Users, XCircle, type LucideIcon } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import type { StatsCO } from "@/lib/api"
import { STATUT_LABELS } from "@/lib/recensement-co"

function StatCard({ label, value, icon: Icon, action }: {
  label: string
  value: number | string
  icon: LucideIcon
  /** Rend la carte entière cliquable (bouton étiré à l'intérieur de la carte, jamais l'inverse) */
  action?: { label: string; onClick: () => void }
}) {
  return (
    <Card className="relative gap-0 py-3 md:py-4 has-[button:focus-visible]:ring-2 has-[button:focus-visible]:ring-secondary">
      <CardContent className="flex items-start justify-between gap-2 px-3 md:px-4">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground md:text-sm">{label}</p>
          <p className="text-xl font-semibold text-foreground md:text-2xl">{value}</p>
          {action && (
            <button type="button" onClick={action.onClick}
              className="text-xs text-secondary underline-offset-2 hover:underline focus-visible:outline-none after:absolute after:inset-0 after:content-[''] dark:text-foreground">
              {action.label}
            </button>
          )}
        </div>
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground md:h-5 md:w-5" aria-hidden="true" />
      </CardContent>
    </Card>
  )
}

/** Cartes de synthèse de l'édition (GET /admin/co/stats). */
export default function CoStatsCards({ stats, onShowCas }: { stats: StatsCO; onShowCas?: () => void }) {
  const statut = (code: keyof typeof STATUT_LABELS) => stats.par_statut[code] ?? 0
  const anciens = stats.par_type.ancien ?? 0
  const nouveaux = stats.par_type.nouveau ?? 0
  return (
    <section aria-label="Synthèse du recensement" className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 md:gap-3 xl:grid-cols-7">
      <StatCard label="Fiches" value={stats.total} icon={Users} />
      <StatCard label={STATUT_LABELS.soumise} value={statut("soumise")} icon={Clock} />
      <StatCard label="Fiches à vérifier" value={statut("a_verifier")} icon={FileWarning} />
      <StatCard label={STATUT_LABELS.validee} value={statut("validee")} icon={CheckCircle2} />
      <StatCard label={STATUT_LABELS.rejetee} value={statut("rejetee")} icon={XCircle} />
      <StatCard label="Anciens / nouveaux" value={`${anciens} / ${nouveaux}`} icon={UserPlus} />
      <StatCard label="Cas ouverts" value={stats.cas_a_verifier} icon={Scale}
        action={onShowCas ? { label: "Afficher les cas", onClick: onShowCas } : undefined} />
    </section>
  )
}
