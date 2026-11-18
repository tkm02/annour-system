import Image from "next/image"
import LoginForm from "@/components/auth/login-form"
import logoAnnour from "@/public/ANNOUR.png"

// Le logo contient déjà le nom et l'intitulé complet du séminaire
const LOGO_ALT = "An-Nour — Séminaire Intercommunal de Formation Islamique et Managériale"

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Logo and branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/10 to-secondary/10 items-center justify-center p-12">
        <div className="text-center space-y-8 max-w-md">
          <Image src={logoAnnour} alt={LOGO_ALT} className="mx-auto h-auto w-full max-w-sm" sizes="384px" priority />
          <p className="text-lg text-primary font-medium italic">An Nour, pour une spiritualité étincelante.</p>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden text-center space-y-3">
            <Image src={logoAnnour} alt={LOGO_ALT} className="mx-auto h-auto w-full max-w-[240px]" sizes="240px" priority />
            <p className="text-sm text-muted-foreground italic">An Nour, pour une spiritualité étincelante.</p>
          </div>

          <LoginForm />
        </div>
      </div>
    </div>
  )
}
