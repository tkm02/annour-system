"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/layout/dashboard-layout"
import DashboardStats from "@/components/dashboard/dashboard-stats"
import DemographicsTable from "@/components/dashboard/demographics-table"
import RecentRegistrations from "@/components/dashboard/recent-registrations"
import { dashboardApi } from "@/lib/api"

interface DashboardData {
  seminaristes: any[]
  total: number
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData>({
    seminaristes: [],
    total: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const dashboardData = await dashboardApi.getDashboardData()
      console.log('Dashboard Data:', dashboardData)
      setData(dashboardData)
    } catch (error) {
      console.error('Erreur Dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6 p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-64"></div>
            <div className="h-4 bg-muted rounded w-96"></div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">Vue d'ensemble du séminaire An-Nour</p>
          </div>
        </div>

        {/* Statistics Cards */}
        <DashboardStats 
          totalSeminaristes={data.total}
          data={data.seminaristes}
        />

        {/* Demographics and Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DemographicsTable data={data.seminaristes} />
          <RecentRegistrations data={data.seminaristes} />
        </div>
      </div>
    </DashboardLayout>
  )
}
