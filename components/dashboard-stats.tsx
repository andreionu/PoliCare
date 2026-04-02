"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Calendar, Stethoscope, Activity, Loader2 } from "lucide-react"

interface DashboardStatsProps {
  totalPatients: number | null
  newPatientsThisMonth: number | null
  appointmentsToday: number | null
  activeDoctors: number | null
  attendanceRate: number | null
  attendanceRateLastMonth: number | null
  loading: boolean
}

function StatCard({
  title,
  value,
  sub,
  icon,
  loading,
}: {
  title: string
  value: string
  sub: string
  icon: React.ReactNode
  loading: boolean
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            <p className="text-xs text-muted-foreground mt-1">{sub}</p>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export function DashboardStats({
  totalPatients,
  newPatientsThisMonth,
  appointmentsToday,
  activeDoctors,
  attendanceRate,
  attendanceRateLastMonth,
  loading,
}: DashboardStatsProps) {
  const attendanceDiff =
    attendanceRate !== null && attendanceRateLastMonth !== null
      ? attendanceRate - attendanceRateLastMonth
      : null

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Pacienți"
        value={totalPatients?.toLocaleString() ?? "—"}
        sub={newPatientsThisMonth !== null ? `+${newPatientsThisMonth} înregistrați luna aceasta` : ""}
        icon={<Users className="h-4 w-4" />}
        loading={loading}
      />
      <StatCard
        title="Programări Azi"
        value={appointmentsToday?.toString() ?? "—"}
        sub="programări pentru astăzi"
        icon={<Calendar className="h-4 w-4" />}
        loading={loading}
      />
      <StatCard
        title="Medici Activi"
        value={activeDoctors?.toString() ?? "—"}
        sub="medici disponibili"
        icon={<Stethoscope className="h-4 w-4" />}
        loading={loading}
      />
      <StatCard
        title="Rata Prezență"
        value={attendanceRate !== null ? `${attendanceRate}%` : "—"}
        sub={
          attendanceDiff !== null
            ? `${attendanceDiff >= 0 ? "+" : ""}${attendanceDiff}% față de luna trecută`
            : "luna curentă"
        }
        icon={<Activity className="h-4 w-4" />}
        loading={loading}
      />
    </div>
  )
}
