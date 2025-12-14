import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { AuthProvider } from "@/contexts/auth-context"
import { ThemeProvider } from "next-themes"
import { Toaster } from "react-hot-toast"
import { Suspense } from "react"
import "./globals.css"

export const metadata: Metadata = {
  title: "An-Nour Admin",
  description: "Administration du séminaire An-Nour",
  generator: "Next.js",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className={`${GeistSans.variable} ${GeistMono.variable} antialiased light`}>
      <body>
        <AuthProvider>
          <Suspense fallback={null}>
            {children}
            <Toaster />
          </Suspense>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
