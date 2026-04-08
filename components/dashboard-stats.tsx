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
  gradient,
}: {
  title: string
  value: string
  sub: string
  icon: React.ReactNode
  loading: boolean
  gradient: string
}) {
  return (
    <Card className="relative overflow-hidden group border-none shadow-sm hover:shadow-md transition-all duration-300 bg-white dark:bg-card/50 backdrop-blur-sm">
      <div className={`absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 opacity-10 rounded-full blur-3xl group-hover:opacity-20 transition-opacity bg-gradient-to-br ${gradient}`} />
      <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
        <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">{title}</CardTitle>
        <div className={`p-2 rounded-xl bg-gradient-to-br ${gradient} text-white shadow-lg`}>
          {icon}
        </div>
      </CardHeader>
      <CardContent className="relative z-10">
        {loading ? (
          <div className="flex flex-col gap-2">
            <div className="h-8 w-24 bg-muted animate-pulse rounded-lg" />
            <div className="h-3 w-32 bg-muted/50 animate-pulse rounded-lg" />
          </div>
        ) : (
          <>
            <div className="text-3xl font-extrabold tracking-tight text-foreground mb-1">{value}</div>
            <p className="text-xs font-medium text-muted-foreground/80 flex items-center gap-1.5">
              {sub}
            </p>
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
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Pacienți"
        value={totalPatients?.toLocaleString() ?? "—"}
        sub={newPatientsThisMonth !== null ? `+${newPatientsThisMonth} înregistrați lunar` : "Încărcare date..."}
        icon={<Users className="h-5 w-5" />}
        loading={loading}
        gradient="from-primary to-primary/80 shadow-primary/20"
      />
      <StatCard
        title="Programări Azi"
        value={appointmentsToday?.toString() ?? "—"}
        sub={`${appointmentsToday ?? 0} pacienți programați astăzi`}
        icon={<Calendar className="h-5 w-5" />}
        loading={loading}
        gradient="from-emerald-500 to-teal-600 shadow-emerald-500/20"
      />
      <StatCard
        title="Medici Activi"
        value={activeDoctors?.toString() ?? "—"}
        sub={`${activeDoctors ?? 0} specialiști disponibili`}
        icon={<Stethoscope className="h-5 w-5" />}
        loading={loading}
        gradient="from-purple-500 to-fuchsia-600 shadow-purple-500/20"
      />
      <StatCard
        title="Rata Prezență"
        value={attendanceRate !== null ? `${attendanceRate}%` : "—"}
        sub={
          attendanceDiff !== null
            ? `${attendanceDiff >= 0 ? "📈 +" : "📉 "}${attendanceDiff}% față de luna trecută`
            : "Monitorizare rată abandon"
        }
        icon={<Activity className="h-5 w-5" />}
        loading={loading}
        gradient="from-amber-500 to-orange-600 shadow-amber-500/20"
      />
    </div>
  )
}
