import type { Metadata } from "next"
import AddSeminaristForm from "@/components/seminaristes/add-seminarist-form"

export const metadata: Metadata = {
  title: "Inscription — Séminaire An-Nour",
  description: "Formulaire public d'inscription au séminaire An-Nour",
}

// Page publique : aucune connexion requise. L'ouverture est contrôlée par le serveur (REGISTRATIONS_OPEN).
export default function InscriptionPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:py-12">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <header className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center shadow">
            <span className="text-white text-lg font-bold" lang="ar">النور</span>
          </div>
          <h1 className="text-2xl font-bold text-secondary">SÉMINAIRE AN-NOUR</h1>
          <p className="text-muted-foreground">Formation islamique et managériale — inscription en ligne</p>
        </header>
        <AddSeminaristForm mode="public" />
      </div>
    </main>
  )
}
