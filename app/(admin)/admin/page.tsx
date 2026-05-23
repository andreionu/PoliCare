"use client"

import { useState, useEffect, useCallback } from "react"
import { DashboardStats } from "@/components/dashboard-stats"
import { RecentAppointments } from "@/components/recent-appointments"
import { DepartmentsOverview } from "@/components/departments-overview"
import { Badge } from "@/components/ui/badge"
import { useRealtimeEvent } from "@/hooks/use-realtime"

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
  const [statsData, setStatsData] = useState<DashboardData | null>(null)
  const [loadingStats, setLoadingStats] = useState(false)

  const fetchStats = useCallback(() => {
    setLoadingStats(true)
    fetch("/api/dashboard/stats")
      .then((r) => r.json())
      .then((data) => setStatsData(data))
      .catch(console.error)
      .finally(() => setLoadingStats(false))
  }, [])

  useEffect(() => { fetchStats() }, [fetchStats])
  useRealtimeEvent("appointments_updated", fetchStats)
  useRealtimeEvent("stats_updated", fetchStats)

  const [greeting, setGreeting] = useState("")

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setGreeting("Bună dimineața")
    else if (hour < 18) setGreeting("Bună ziua")
    else setGreeting("Bună seara")
  }, [])

  return (
    <>
      <main className="flex-1 overflow-y-auto bg-[#F8FAFC] dark:bg-[#0A0C10]/50">
        <div className="p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="rounded-full px-3 py-1 border-primary/20 bg-primary/5 text-primary dark:border-primary/10 dark:bg-primary/5 font-bold text-[10px] tracking-widest uppercase">
                  Management Portal
                </Badge>
                <div className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">v1.2.4</span>
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight text-foreground">{greeting}, Admin!</h1>
              <p className="text-muted-foreground font-medium">Iată o privire de ansamblu asupra clinicii tale pentru astăzi.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden lg:flex flex-col items-end text-right">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Data curentă</p>
                <p className="text-sm font-bold text-foreground">
                  {new Date().toLocaleDateString("ro-RO", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <DashboardStats
              totalPatients={statsData?.totalPatients ?? null}
              newPatientsThisMonth={statsData?.newPatientsThisMonth ?? null}
              appointmentsToday={statsData?.appointmentsToday ?? null}
              activeDoctors={statsData?.activeDoctors ?? null}
              attendanceRate={statsData?.attendanceRate ?? null}
              attendanceRateLastMonth={statsData?.attendanceRateLastMonth ?? null}
              loading={loadingStats}
            />

            <div className="grid gap-8 lg:grid-cols-7 items-start pb-8">
              <div className="lg:col-span-4 transition-all duration-500 hover:translate-y-[-4px]">
                <RecentAppointments
                  appointments={statsData?.recentAppointments ?? []}
                  loading={loadingStats}
                />
              </div>
              <div className="lg:col-span-3 transition-all duration-500 hover:translate-y-[-4px]">
                <DepartmentsOverview
                  departments={statsData?.departments ?? []}
                  loading={loadingStats}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
