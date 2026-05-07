"use client"

import { useState, useEffect, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { Users, Calendar, FileText, Settings, UserPlus, Clock, Loader2, Activity, Filter, X } from "lucide-react"

interface ActivityLog {
  id: string
  action: string
  entity: string
  entityId: string | null
  description: string
  createdAt: string
  user: { name: string; role: string } | null
}

interface ActivityData {
  activities: ActivityLog[]
  todayCount: number
  weekCount: number
  activeUsers: number
}

function getEntityIcon(entity: string) {
  const map: Record<string, React.ComponentType<{ className?: string }>> = {
    appointment: Calendar,
    patient: Users,
    medicalRecord: FileText,
    doctor: UserPlus,
    department: Settings,
    user: Users,
    report: FileText,
  }
  return map[entity.toLowerCase()] ?? Activity
}

function getEntityColor(entity: string) {
  const map: Record<string, { bg: string; icon: string; border: string }> = {
    appointment: { bg: "bg-blue-50 dark:bg-blue-900/20", icon: "text-blue-600 dark:text-blue-400", border: "border-blue-100 dark:border-blue-800" },
    patient: { bg: "bg-emerald-50 dark:bg-emerald-900/20", icon: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-100 dark:border-emerald-800" },
    medicalrecord: { bg: "bg-purple-50 dark:bg-purple-900/20", icon: "text-purple-600 dark:text-purple-400", border: "border-purple-100 dark:border-purple-800" },
    doctor: { bg: "bg-indigo-50 dark:bg-indigo-900/20", icon: "text-indigo-600 dark:text-indigo-400", border: "border-indigo-100 dark:border-indigo-800" },
    department: { bg: "bg-slate-50 dark:bg-slate-900/20", icon: "text-slate-600 dark:text-slate-400", border: "border-slate-100 dark:border-slate-800" },
    user: { bg: "bg-amber-50 dark:bg-amber-900/20", icon: "text-amber-600 dark:text-amber-400", border: "border-amber-100 dark:border-amber-800" },
    report: { bg: "bg-rose-50 dark:bg-rose-900/20", icon: "text-rose-600 dark:text-rose-400", border: "border-rose-100 dark:border-rose-800" },
  }
  return map[entity.toLowerCase()] ?? { bg: "bg-slate-50", icon: "text-slate-600", border: "border-slate-100" }
}

function formatRelativeTime(dateStr: string) {
  const date = new Date(dateStr)
  const diffMs = Date.now() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return "Acum"
  if (diffMin < 60) return `Acum ${diffMin} ${diffMin === 1 ? "minut" : "minute"}`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `Acum ${diffHr} ${diffHr === 1 ? "oră" : "ore"}`
  const diffDays = Math.floor(diffHr / 24)
  return `Acum ${diffDays} ${diffDays === 1 ? "zi" : "zile"}`
}

export default function ActivityPage() {
  const [data, setData] = useState<ActivityData | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionFilter, setActionFilter] = useState("all")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")

  const fetchActivity = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (actionFilter !== "all") params.set("action", actionFilter)
      if (fromDate) params.set("from", fromDate)
      if (toDate) params.set("to", toDate)
      const res = await fetch(`/api/activity${params.size ? `?${params}` : ""}`)
      const json = await res.json()
      setData(json)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [actionFilter, fromDate, toDate])

  useEffect(() => {
    fetchActivity()
  }, [fetchActivity])

  const hasFilters = actionFilter !== "all" || fromDate || toDate

  const clearFilters = () => {
    setActionFilter("all")
    setFromDate("")
    setToDate("")
  }

  const activities = data?.activities ?? []

  return (
    <>
      <div className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-[1600px] mx-auto">
          <div className="mb-10 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="rounded-full px-3 py-1 border-indigo-200 bg-indigo-50 text-indigo-600 dark:border-indigo-900/30 dark:bg-indigo-900/20 font-bold text-[10px] tracking-widest uppercase">
                  Audit & Logs
                </Badge>
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight text-foreground">Activitate Sistem</h1>
              <p className="text-muted-foreground font-medium">Monitorizarea în timp real a tuturor acțiunilor din platformă.</p>
            </div>
            <div className="hidden lg:block text-right">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Ultima actualizare</p>
              <p className="text-sm font-bold text-foreground">Chiar acum</p>
            </div>
          </div>

          {/* Activity Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
            <Card className="relative overflow-hidden group border-none shadow-sm hover:shadow-md transition-all duration-300 bg-white dark:bg-card/50 backdrop-blur-sm p-6">
              <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 opacity-10 rounded-full blur-3xl group-hover:opacity-20 transition-opacity bg-gradient-to-br from-blue-500 to-indigo-600" />
              <div className="flex items-center gap-5 relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <Clock className="w-7 h-7" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 mb-1">Activități Astăzi</p>
                  <div className="flex items-baseline gap-2">
                    {loading ? (
                      <div className="h-8 w-16 bg-muted animate-pulse rounded-lg" />
                    ) : (
                      <span className="text-3xl font-extrabold tracking-tight text-foreground">{data?.todayCount ?? 0}</span>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            <Card className="relative overflow-hidden group border-none shadow-sm hover:shadow-md transition-all duration-300 bg-white dark:bg-card/50 backdrop-blur-sm p-6">
              <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 opacity-10 rounded-full blur-3xl group-hover:opacity-20 transition-opacity bg-gradient-to-br from-emerald-500 to-teal-600" />
              <div className="flex items-center gap-5 relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <Calendar className="w-7 h-7" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 mb-1">Săptămâna Aceasta</p>
                  <div className="flex items-baseline gap-2">
                    {loading ? (
                      <div className="h-8 w-16 bg-muted animate-pulse rounded-lg" />
                    ) : (
                      <span className="text-3xl font-extrabold tracking-tight text-foreground">{data?.weekCount ?? 0}</span>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            <Card className="relative overflow-hidden group border-none shadow-sm hover:shadow-md transition-all duration-300 bg-white dark:bg-card/50 backdrop-blur-sm p-6">
              <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 opacity-10 rounded-full blur-3xl group-hover:opacity-20 transition-opacity bg-gradient-to-br from-purple-500 to-fuchsia-600" />
              <div className="flex items-center gap-5 relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-fuchsia-600 text-white flex items-center justify-center shadow-lg shadow-purple-500/20">
                  <Users className="w-7 h-7" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 mb-1">Utilizatori Activi</p>
                  <div className="flex items-baseline gap-2">
                    {loading ? (
                      <div className="h-8 w-16 bg-muted animate-pulse rounded-lg" />
                    ) : (
                      <span className="text-3xl font-extrabold tracking-tight text-foreground">{data?.activeUsers ?? 0}</span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Activity Feed */}
          <Card className="border-none shadow-sm overflow-hidden bg-white dark:bg-card/50 backdrop-blur-sm">
            <div className="p-6 border-b border-muted/30 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold tracking-tight text-foreground/90">Feed Activitate</h2>
                <Badge variant="outline" className="rounded-lg text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-2 py-1">
                  Real-time
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger className="h-9 w-36 text-xs rounded-xl border-border/50">
                    <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                    <SelectValue placeholder="Acțiune" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toate acțiunile</SelectItem>
                    <SelectItem value="CREATE">Creare</SelectItem>
                    <SelectItem value="UPDATE">Actualizare</SelectItem>
                    <SelectItem value="DELETE">Ștergere</SelectItem>
                    <SelectItem value="LOGIN">Autentificare</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="h-9 w-36 text-xs rounded-xl border-border/50"
                  placeholder="De la"
                />
                <Input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="h-9 w-36 text-xs rounded-xl border-border/50"
                  placeholder="Până la"
                />
                {hasFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 px-3 rounded-xl text-muted-foreground hover:text-foreground">
                    <X className="h-3.5 w-3.5 mr-1" />
                    Resetează
                  </Button>
                )}
              </div>
            </div>

            {loading ? (
              <div className="p-20 text-center">
                <Loader2 className="h-10 w-10 animate-spin mx-auto text-blue-500 mb-4" />
                <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Se încarcă jurnalul de activitate...</p>
              </div>
            ) : activities.length === 0 ? (
              <div className="p-20 text-center">
                <div className="w-20 h-20 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-6 text-muted-foreground/30">
                  <Activity className="w-10 h-10" />
                </div>
                <p className="text-lg font-bold text-foreground/70">Nu există activitate pentru filtrele selectate.</p>
                <p className="text-sm font-medium text-muted-foreground mt-2">Toate acțiunile vor fi listate aici cronologic.</p>
                {hasFilters && (
                  <Button variant="outline" onClick={clearFilters} className="mt-6 rounded-xl">Resetează filtrele</Button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-muted/30">
                {activities.map((activity) => {
                  const Icon = getEntityIcon(activity.entity)
                  const colors = getEntityColor(activity.entity)
                  return (
                    <div key={activity.id} className="group p-6 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-all duration-300 relative overflow-hidden">
                      <div className="flex items-start gap-5 relative z-10">
                        <div className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border transition-transform duration-300 group-hover:scale-110 shadow-sm",
                          colors.bg, colors.icon, colors.border
                        )}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <span className="text-sm font-bold text-foreground group-hover:text-blue-600 transition-colors uppercase tracking-tight">
                              {activity.user?.name ?? "Sistem"}
                            </span>
                            <span className="text-sm font-medium text-muted-foreground">
                              {activity.description}
                            </span>
                            {activity.entityId && (
                              <Badge variant="outline" className={cn(
                                "rounded-lg text-[10px] font-bold uppercase tracking-widest py-0.5",
                                colors.bg, colors.icon, colors.border
                              )}>
                                {activity.entity}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4">
                            <p className="text-xs font-bold text-muted-foreground/60 flex items-center gap-1.5 uppercase tracking-widest">
                              <Clock className="w-3.5 h-3.5" />
                              {formatRelativeTime(activity.createdAt)}
                            </p>
                            <div className="h-1 w-1 rounded-full bg-slate-300" />
                            <p className="text-xs font-bold text-muted-foreground/40 uppercase tracking-widest">
                               ID: {activity.id.slice(0, 8)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  )
}
