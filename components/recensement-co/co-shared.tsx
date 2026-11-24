"use client"

import type React from "react"
import { useState } from "react"
import { AlertTriangle, CheckCircle2, Clock, XCircle, type LucideIcon } from "lucide-react"

import IdPhotoPlaceholder from "@/components/common/id-photo-placeholder"
import { StatusBadge, type StatusTone } from "@/components/common/status-badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ApiError } from "@/lib/api"
import { PHOTO_NON_FOURNIE, statutLabel } from "@/lib/recensement-co"
import { cn } from "@/lib/utils"

// Statuts : ton sémantique + icône + libellé (jamais la couleur seule), via le badge commun
const STATUT_STYLES: Record<string, { icon: LucideIcon; tone: StatusTone }> = {
  soumise: { icon: Clock, tone: "info" },
  a_verifier: { icon: AlertTriangle, tone: "warning" },
  validee: { icon: CheckCircle2, tone: "success" },
  rejetee: { icon: XCircle, tone: "danger" },
}

export function StatutBadge({ statut, className }: { statut: string | null | undefined; className?: string }) {
  const style = STATUT_STYLES[statut ?? ""] ?? STATUT_STYLES.soumise
  return (
    <StatusBadge tone={style.tone} icon={style.icon} className={className}>
      {statutLabel(statut)}
    </StatusBadge>
  )
}

/**
 * Photo d'identité (4:5) ou silhouette. Dans les listes (`inList`), la photo est décorative (`alt=""`, le nom est
 * déjà lu) et la silhouette annoncée « Photo non fournie » ; dans le détail, libellés complets. Pendant le
 * chargement d'une vraie photo, la silhouette est masquée aux lecteurs d'écran.
 */
export function CoPhoto({ url, sexe, name, inList, className }: {
  url: string | null | undefined
  sexe: string | null | undefined
  name: string
  inList?: boolean
  className?: string
}) {
  const [status, setStatus] = useState<"idle" | "loading" | "loaded" | "error">("idle")
  const enAttente = !!url && status !== "error"
  return (
    <Avatar className={cn("h-12 w-[38px] rounded-md border", className)}>
      {url && <AvatarImage src={url} alt={inList ? "" : `Photo de ${name}`} className="object-cover" onLoadingStatusChange={setStatus} />}
      <AvatarFallback className="rounded-md p-0" delayMs={url ? 300 : 0}>
        <IdPhotoPlaceholder sexe={sexe} decorative={enAttente} label={inList ? PHOTO_NON_FOURNIE : undefined} />
      </AvatarFallback>
    </Avatar>
  )
}

/** Ligne « libellé : valeur » d'une fiche (liste de définitions). */
export function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(0,10rem)_1fr] gap-2 py-1.5 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words">{children ?? "—"}</dd>
    </div>
  )
}

/** Message d'erreur de l'API (texte français du serveur), avec la référence `request_id` si elle existe. */
export function apiErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof Error) || !error.message) return fallback
  if (error instanceof ApiError && error.requestId && !error.message.includes(error.requestId)) {
    return `${error.message} (référence : ${error.requestId})`
  }
  return error.message
}
