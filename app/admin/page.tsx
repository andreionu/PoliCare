"use client"

import { useState } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { DashboardStats } from "@/components/dashboard-stats"
import { RecentAppointments } from "@/components/recent-appointments"
import { DepartmentsOverview } from "@/components/departments-overview"
import { LoginScreen } from "@/components/login-screen"
import { Preloader } from "@/components/preloader"

export default function DashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = () => {
    setIsLoading(true)
    setTimeout(() => {
      setIsAuthenticated(true)
      setIsLoading(false)
    }, 2000)
  }

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

        <DashboardStats />

        <div className="grid gap-6 lg:grid-cols-7">
          <div className="lg:col-span-4">
            <RecentAppointments />
          </div>
          <div className="lg:col-span-3">
            <DepartmentsOverview />
          </div>
        </div>
      </main>
    </AdminLayout>
  )
}
