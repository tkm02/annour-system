import type React from "react"
import type { Metadata } from "next"

// Page atteinte par un lien contenant un jeton : jamais indexée, jamais transmise dans l'en-tête Referer
export const metadata: Metadata = {
  title: "Activer mon compte — An-Nour",
  referrer: "no-referrer",
  robots: { index: false, follow: false },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
