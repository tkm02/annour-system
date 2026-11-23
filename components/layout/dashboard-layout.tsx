"use client"

import type React from "react"

import { useState } from "react"
import { cn } from "@/lib/utils"
import Sidebar from "./sidebar"
import Header from "./header"
import ProtectedRoute from "@/components/auth/protected-route"

interface DashboardLayoutProps {
  children: React.ReactNode
}

// Préférence d'interface uniquement (aucune donnée personnelle) : barre latérale réduite ou dépliée.
const COLLAPSED_KEY = "annour.sidebar.collapsed"

function readCollapsedPreference(): boolean | null {
  try {
    const value = window.localStorage.getItem(COLLAPSED_KEY)
    return value === null ? null : value === "1"
  } catch {
    return null
  }
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  // Sans préférence enregistrée : réduite de 1024 à 1279 px, dépliée au-delà. La coque n'est rendue
  // qu'après montage (ProtectedRoute), donc cette lecture côté client ne crée pas d'écart d'hydratation.
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false
    return readCollapsedPreference() ?? window.matchMedia("(min-width: 1024px) and (max-width: 1279px)").matches
  })

  const toggleCollapsed = () => {
    setCollapsed((value) => {
      const next = !value
      try {
        window.localStorage.setItem(COLLAPSED_KEY, next ? "1" : "0")
      } catch {
        // stockage indisponible (navigation privée) : la préférence n'est simplement pas mémorisée
      }
      return next
    })
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <a
          href="#contenu"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-[60] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
        >
          Aller au contenu
        </a>

        <Sidebar
          collapsed={collapsed}
          onToggleCollapsed={toggleCollapsed}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
        />

        <div className={cn("transition-[padding] duration-200", collapsed ? "lg:pl-16" : "lg:pl-64")}>
          <Header onMenuClick={() => setMobileOpen(true)} />
          <main id="contenu" tabIndex={-1} className="mx-auto w-full max-w-screen-2xl p-4 outline-none sm:p-6">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
