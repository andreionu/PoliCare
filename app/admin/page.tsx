"use client"

import { useState, useEffect } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { DashboardStats } from "@/components/dashboard-stats"
import { RecentAppointments } from "@/components/recent-appointments"
import { DepartmentsOverview } from "@/components/departments-overview"
import { LoginScreen } from "@/components/login-screen"
import { Preloader } from "@/components/preloader"

interface DashboardData {
  totalPatients: number
  newPatientsThisMonth: number
  appointmentsToday: number
  activeDoctors: number
  attendanceRate: number | null
  attendanceRateLastMonth: number | null
  recentAppointments: Array<{
    id: string
    startTime: string
    status: string
    patient: { name: string }
    doctor: { name: string }
    department: { name: string } | null
  }>
  departments: Array<{
    id: string
    name: string
    totalAppointments: number
    doctorCount: number
  }>
}

export default function DashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [statsData, setStatsData] = useState<DashboardData | null>(null)
  const [loadingStats, setLoadingStats] = useState(false)

  // Restore auth from localStorage on mount
  useEffect(() => {
    const storedRole = localStorage.getItem("userRole")
    if (storedRole) setIsAuthenticated(true)
  }, [])

  const handleLogin = () => {
    setIsLoading(true)
    setTimeout(() => {
      setIsAuthenticated(true)
      setIsLoading(false)
    }, 2000)
  }

  useEffect(() => {
    if (!isAuthenticated) return
    setLoadingStats(true)
    fetch("/api/dashboard/stats")
      .then((r) => r.json())
      .then((data) => setStatsData(data))
      .catch(console.error)
      .finally(() => setLoadingStats(false))
  }, [isAuthenticated])

  if (!isAuthenticated && !isLoading) {
    return <LoginScreen onLogin={handleLogin} />
  }

  if (isLoading) {
    return <Preloader />
  }

  return (
    <AdminLayout>
      <main className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Bine ai venit înapoi! Iată un sumar al activității de azi.</p>
          </div>
        </div>

        <DashboardStats
          totalPatients={statsData?.totalPatients ?? null}
          newPatientsThisMonth={statsData?.newPatientsThisMonth ?? null}
          appointmentsToday={statsData?.appointmentsToday ?? null}
          activeDoctors={statsData?.activeDoctors ?? null}
          attendanceRate={statsData?.attendanceRate ?? null}
          attendanceRateLastMonth={statsData?.attendanceRateLastMonth ?? null}
          loading={loadingStats}
        />

        <div className="grid gap-6 lg:grid-cols-7">
          <div className="lg:col-span-4">
            <RecentAppointments
              appointments={statsData?.recentAppointments ?? []}
              loading={loadingStats}
            />
          </div>
          <div className="lg:col-span-3">
            <DepartmentsOverview
              departments={statsData?.departments ?? []}
              loading={loadingStats}
            />
          </div>
        </div>
      </main>
    </AdminLayout>
  )
}
