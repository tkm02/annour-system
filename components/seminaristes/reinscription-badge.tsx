import { CircleHelp, History } from "lucide-react"

import type { Seminariste } from "@/lib/api"
import { REINSCRIPTION_LABELS, reinscriptionStatut } from "@/lib/reinscription"

/** Repère de réinscription (icône + texte, tokens du thème) ; rien pour une nouvelle inscription. */
export default function ReinscriptionBadge({ seminariste }: {
  seminariste: Pick<Seminariste, "matricule_precedent" | "reinscription_a_verifier">
}) {
  const statut = reinscriptionStatut(seminariste)
  if (!statut) return null
  const ancien = statut === "ancien"
  const Icon = ancien ? History : CircleHelp
  return (
    <span
      className={ancien
        ? "mt-1 inline-flex items-center gap-1 rounded-full border border-primary bg-primary/15 px-2 py-0.5 text-xs font-medium text-foreground"
        : "mt-1 inline-flex items-center gap-1 rounded-full border border-secondary bg-secondary/10 px-2 py-0.5 text-xs font-medium text-secondary dark:text-foreground"}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {REINSCRIPTION_LABELS[statut]}
      {ancien && seminariste.matricule_precedent && (
        <span className="font-mono text-muted-foreground">
          <span className="sr-only">, matricule de l&apos;an dernier </span>· {seminariste.matricule_precedent}
        </span>
      )}
    </span>
  )
}
