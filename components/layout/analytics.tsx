"use client"

import { Analytics } from "@vercel/analytics/next"
import { sansJetonAnalytics } from "@/lib/mot-de-passe"

/** TAF lot 3 : le jeton des liens d'activation / réinitialisation n'est jamais transmis aux mesures d'audience. */
export default function AnalyticsSansJeton() {
  return <Analytics beforeSend={sansJetonAnalytics} />
}
