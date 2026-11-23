"use client"

import { CheckCircle2, Clock, FileWarning, Scale, UserPlus, Users, XCircle } from "lucide-react"

import { StatCard } from "@/components/common/stat-card"
import type { StatsCO } from "@/lib/api"
import { STATUT_LABELS } from "@/lib/recensement-co"

/** Cartes de synthèse de l'édition (GET /admin/co/stats), sur l'indicateur commun. */
export default function CoStatsCards({ stats, onShowCas }: { stats: StatsCO; onShowCas?: () => void }) {
  const statut = (code: keyof typeof STATUT_LABELS) => stats.par_statut[code] ?? 0
  const anciens = stats.par_type.ancien ?? 0
  const nouveaux = stats.par_type.nouveau ?? 0
  return (
    <section aria-label="Synthèse du recensement" className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7">
      <StatCard label="Fiches" value={stats.total} icon={Users} />
      <StatCard label={STATUT_LABELS.soumise} value={statut("soumise")} icon={Clock} tone="info" />
      <StatCard label="Fiches à vérifier" value={statut("a_verifier")} icon={FileWarning} tone="warning" />
      <StatCard label={STATUT_LABELS.validee} value={statut("validee")} icon={CheckCircle2} tone="success" />
      <StatCard label={STATUT_LABELS.rejetee} value={statut("rejetee")} icon={XCircle} tone="danger" />
      <StatCard label="Anciens / nouveaux" value={`${anciens} / ${nouveaux}`} icon={UserPlus} tone="brand" />
      <StatCard label="Cas ouverts" value={stats.cas_a_verifier} icon={Scale} tone="warning"
        action={onShowCas ? { label: "Afficher les cas", onClick: onShowCas } : undefined} />
    </section>
  )
}
