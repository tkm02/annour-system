import { SILHOUETTE_LABELS, silhouetteFor, type Silhouette } from "@/lib/recensement-co"
import { cn } from "@/lib/utils"

/**
 * Silhouette de photo d'identité (format 4:5) affichée quand aucune photo n'est fournie :
 * homme (M), femme voilée en jilbab (F) ou neutre (sexe inconnu). Dessin original, couleurs du thème.
 * Contraste ≥ 3:1 avec le fond (`muted-foreground` à 80 % minimum sur `muted`, clair comme sombre).
 */
export default function IdPhotoPlaceholder({ sexe, variant, label, decorative, className }: {
  sexe?: string | null
  /** Force une silhouette (sinon déduite de `sexe`) */
  variant?: Silhouette
  /** Libellé accessible (par défaut : type de silhouette + « photo non fournie ») */
  label?: string
  /** Masquée aux lecteurs d'écran (ex. pendant le chargement de la vraie photo) */
  decorative?: boolean
  className?: string
}) {
  const kind = variant ?? silhouetteFor(sexe)
  const a11y = decorative
    ? { "aria-hidden": true as const, focusable: "false" as const }
    : { role: "img", "aria-label": label ?? SILHOUETTE_LABELS[kind] }
  return (
    <svg viewBox="0 0 120 150" {...a11y} preserveAspectRatio="xMidYMid slice"
      className={cn("h-full w-full text-muted-foreground", className)}>
      <rect width="120" height="150" className="fill-muted" />
      {kind === "homme" && (
        <g fill="currentColor">
          {/* Cou et visage */}
          <path className="opacity-80" d="M50 76h20v14l-10 14-10-14z" />
          <circle className="opacity-80" cx="60" cy="54" r="23" />
          {/* Cheveux courts et épaules avec col en V, séparés du visage par un liseré */}
          <path d="M37 52c0-17 10-27 23-27s23 10 23 27c-3-8-11-13-23-13s-20 5-23 13z" strokeWidth="2" className="stroke-muted" />
          <path d="M12 150c0-36 17-55 38-60l10 14 10-14c21 5 38 24 38 60z" strokeWidth="2" className="stroke-muted" />
        </g>
      )}
      {kind === "femme" && (
        <g fill="currentColor">
          {/* Voile et jilbab couvrant la tête, les épaules et le corps */}
          <path d="M60 20c-21 0-31 17-31 37 0 13 3 23 9 30-17 8-29 28-31 63h106c-2-35-14-55-31-63 6-7 9-17 9-30 0-20-10-37-31-37z" />
          {/* Visage encadré par le voile (contraste ≥ 3:1 avec le voile) */}
          <ellipse cx="60" cy="58" rx="15" ry="19" className="fill-muted" />
          <ellipse cx="60" cy="58" rx="15" ry="19" className="opacity-20" />
          {/* Pli du voile sous le menton */}
          <path d="M42 84q18 14 36 0" fill="none" strokeWidth="2.5" strokeLinecap="round" className="stroke-muted" />
        </g>
      )}
      {kind === "neutre" && (
        <g fill="currentColor" className="opacity-80">
          <circle cx="60" cy="56" r="22" />
          <path d="M16 150c0-36 19-58 44-58s44 22 44 58z" strokeWidth="2" className="stroke-muted" />
        </g>
      )}
    </svg>
  )
}
