import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { AuthProvider } from "@/contexts/auth-context"
import { ThemeProvider } from "next-themes"
import { Toaster } from "react-hot-toast"
import { Toaster as SonnerToaster } from "@/components/ui/sonner"
import { Suspense } from "react"
import "./globals.css"

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
    <html lang="fr" className={`${GeistSans.variable} ${GeistMono.variable} antialiased light`} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AuthProvider>
          <Suspense fallback={null}>
            {children}
            <Toaster />
            {/* Plusieurs écrans utilisent sonner : son conteneur doit aussi être monté */}
            <SonnerToaster richColors position="top-right" />
          </Suspense>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
