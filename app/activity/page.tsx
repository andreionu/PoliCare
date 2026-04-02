"use client"

import { useState, useEffect } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Calendar, FileText, Settings, UserPlus, Trash2, Clock, Loader2, Activity } from "lucide-react"

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
  const map: Record<string, { bg: string; icon: string }> = {
    appointment: { bg: "bg-blue-100", icon: "text-blue-600" },
    patient: { bg: "bg-green-100", icon: "text-green-600" },
    medicalrecord: { bg: "bg-purple-100", icon: "text-purple-600" },
    doctor: { bg: "bg-teal-100", icon: "text-teal-600" },
    department: { bg: "bg-gray-100", icon: "text-gray-600" },
    user: { bg: "bg-orange-100", icon: "text-orange-600" },
    report: { bg: "bg-pink-100", icon: "text-pink-600" },
  }
  return map[entity.toLowerCase()] ?? { bg: "bg-gray-100", icon: "text-gray-600" }
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

  useEffect(() => {
    fetch("/api/activity")
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const activities = data?.activities ?? []

  return (
    <AdminLayout>
      <div className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-[1600px] mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-foreground mb-2">Activitate</h1>
            <p className="text-muted-foreground">Monitorizează activitatea din sistem</p>
          </div>

          {/* Activity Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Activități Astăzi</p>
                  <p className="text-2xl font-semibold">
                    {loading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : data?.todayCount ?? 0}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Activități Săptămâna Aceasta</p>
                  <p className="text-2xl font-semibold">
                    {loading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : data?.weekCount ?? 0}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Utilizatori Activi</p>
                  <p className="text-2xl font-semibold">
                    {loading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : data?.activeUsers ?? 0}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Activity Feed */}
          <Card>
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Feed Activitate</h2>
            </div>

            {loading ? (
              <div className="p-12 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                <p className="mt-2 text-muted-foreground">Se încarcă activitatea...</p>
              </div>
            ) : activities.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-muted-foreground">Nu există activitate înregistrată.</p>
              </div>
            ) : (
              <div className="divide-y">
                {activities.map((activity) => {
                  const Icon = getEntityIcon(activity.entity)
                  const colors = getEntityColor(activity.entity)
                  return (
                    <div key={activity.id} className="p-6 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start gap-4">
                        <div className={`w-10 h-10 rounded-lg ${colors.bg} flex items-center justify-center flex-shrink-0`}>
                          <Icon className={`w-5 h-5 ${colors.icon}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-semibold">{activity.user?.name ?? "Sistem"}</span>
                            <span className="text-muted-foreground">{activity.description}</span>
                            {activity.entityId && (
                              <Badge variant="outline" className="ml-1">
                                {activity.entity}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatRelativeTime(activity.createdAt)}
                          </p>
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
    </AdminLayout>
  )
}
