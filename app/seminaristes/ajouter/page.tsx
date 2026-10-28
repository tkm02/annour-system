"use client";
import { useAuth } from "@/contexts/auth-context"
import { normalizeRole } from "@/lib/roles"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import DashboardLayout from "@/components/layout/dashboard-layout"
import AddSeminaristForm from "@/components/seminaristes/add-seminarist-form"

export default function AjouterSeminaristePage() {
  const router = useRouter()
  const { user } = useAuth()
  
  useEffect(() => {
    // ✅ Rediriger si pas admin
    if (user && normalizeRole(user.role) !== "admin") {
      router.push("/seminaristes")
    }
  }, [user, router])
  
  // Si pas admin, ne rien afficher
  if (!user || normalizeRole(user.role) !== "admin") {
    return null
  }
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">SÉMINARISTE</h1>
            <p className="text-muted-foreground">Ajouter un nouveau séminariste</p>
          </div>
        </div>

        <AddSeminaristForm />
      </div>
    </DashboardLayout>
  )
}
