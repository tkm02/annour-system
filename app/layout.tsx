import type React from "react"
import type { Metadata } from "next"
import { Plus_Jakarta_Sans } from "next/font/google"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { AuthProvider } from "@/contexts/auth-context"
import { Toaster } from "react-hot-toast"
import { Toaster as SonnerToaster } from "@/components/ui/sonner"
import { Suspense } from "react"
import "./globals.css"

// Police de l'identité An-Nour (ADR 0002) : chargée et auto-hébergée par Next au build, aucune dépendance ajoutée.
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-jakarta",
  display: "swap",
})

export const metadata: Metadata = {
  title: "An-Nour Admin",
  description: "Administration du séminaire An-Nour",
  generator: "Next.js",
  icons: { icon: "/ANNOUR.png", apple: "/ANNOUR.png" },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className={`${jakarta.variable} ${GeistMono.variable} antialiased`} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AuthProvider>
          <Suspense fallback={null}>
            {children}
            <Toaster />
            {/* Plusieurs écrans utilisent sonner : son conteneur doit aussi être monté */}
            <SonnerToaster theme="light" richColors position="top-right" />
          </Suspense>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
