import type React from "react"
import Image from "next/image"
import logoAnnour from "@/public/ANNOUR.png"

// Le logo contient déjà le nom et l'intitulé complet du séminaire
const LOGO_ALT = "An-Nour — Séminaire Intercommunal de Formation Islamique et Managériale"

/** Mise en page des écrans hors session (connexion, activation, mot de passe oublié) : logo à gauche, contenu à droite. */
export default function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/10 to-secondary/10 items-center justify-center p-12">
        <div className="text-center space-y-8 max-w-md">
          <Image src={logoAnnour} alt={LOGO_ALT} className="mx-auto h-auto w-full max-w-sm" sizes="384px" priority />
          <p className="text-lg text-primary font-medium italic">An Nour, pour une spiritualité étincelante.</p>
        </div>
      </div>

      <main className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden text-center space-y-3">
            <Image src={logoAnnour} alt={LOGO_ALT} className="mx-auto h-auto w-full max-w-[240px]" sizes="240px" priority />
            <p className="text-sm text-muted-foreground italic">An Nour, pour une spiritualité étincelante.</p>
          </div>
          {children}
        </div>
      </main>
    </div>
  )
}
