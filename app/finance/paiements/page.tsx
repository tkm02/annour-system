"use client"

import DashboardLayout from "@/components/layout/dashboard-layout"
import PaymentsManager from "@/components/finance/payments-manager"

export default function PaiementsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Paiements</h1>
          <p className="text-muted-foreground">
            Validation manuelle des reçus illisibles ou contrôlés sur le relevé Wave.
          </p>
        </div>
        <PaymentsManager />
      </div>
    </DashboardLayout>
  )
}
