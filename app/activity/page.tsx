"use client"

import { AdminLayout } from "@/components/admin-layout"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Calendar, FileText, Settings, UserPlus, Trash2, Clock } from "lucide-react"

export default function ActivityPage() {
  const activities = [
    {
      id: 1,
      user: "Dr. Ana Popescu",
      action: "a adăugat o nouă programare",
      target: "Maria Ionescu",
      type: "appointment",
      time: "Acum 5 minute",
      icon: Calendar,
      color: "blue",
    },
    {
      id: 2,
      user: "Admin",
      action: "a actualizat informațiile pacientului",
      target: "Ion Vasile",
      type: "patient",
      time: "Acum 15 minute",
      icon: Users,
      color: "green",
    },
    {
      id: 3,
      user: "Dr. Mihai Dumitrescu",
      action: "a generat un raport medical pentru",
      target: "Elena Radu",
      type: "report",
      time: "Acum 32 minute",
      icon: FileText,
      color: "purple",
    },
    {
      id: 4,
      user: "Admin",
      action: "a adăugat un nou medic",
      target: "Dr. Carmen Silva",
      type: "doctor",
      time: "Acum 1 oră",
      icon: UserPlus,
      color: "teal",
    },
    {
      id: 5,
      user: "Dr. Ana Popescu",
      action: "a anulat programarea pentru",
      target: "Georgiana Matei",
      type: "cancelled",
      time: "Acum 2 ore",
      icon: Trash2,
      color: "red",
    },
    {
      id: 6,
      user: "Admin",
      action: "a modificat setările departamentului",
      target: "Cardiologie",
      type: "settings",
      time: "Acum 3 ore",
      icon: Settings,
      color: "gray",
    },
    {
      id: 7,
      user: "Dr. Mihai Dumitrescu",
      action: "a completat consultația pentru",
      target: "Alexandru Pop",
      type: "appointment",
      time: "Acum 4 ore",
      icon: Calendar,
      color: "blue",
    },
    {
      id: 8,
      user: "Admin",
      action: "a adăugat un nou pacient",
      target: "Cristina Marinescu",
      type: "patient",
      time: "Acum 5 ore",
      icon: UserPlus,
      color: "green",
    },
  ]

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; icon: string }> = {
      blue: { bg: "bg-blue-100", icon: "text-blue-600" },
      green: { bg: "bg-green-100", icon: "text-green-600" },
      purple: { bg: "bg-purple-100", icon: "text-purple-600" },
      teal: { bg: "bg-teal-100", icon: "text-teal-600" },
      red: { bg: "bg-red-100", icon: "text-red-600" },
      gray: { bg: "bg-gray-100", icon: "text-gray-600" },
    }
    return colors[color] || colors.gray
  }

  const todayCount = activities.filter((a) => a.time.includes("minute") || a.time.includes("oră")).length
  const weekCount = 47

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
                  <p className="text-2xl font-semibold">{todayCount}</p>
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
                  <p className="text-2xl font-semibold">{weekCount}</p>
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
                  <p className="text-2xl font-semibold">12</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Activity Feed */}
          <Card>
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Feed Activitate</h2>
            </div>
            <div className="divide-y">
              {activities.map((activity) => {
                const Icon = activity.icon
                const colorClasses = getColorClasses(activity.color)

                return (
                  <div key={activity.id} className="p-6 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-10 h-10 rounded-lg ${colorClasses.bg} flex items-center justify-center flex-shrink-0`}
                      >
                        <Icon className={`w-5 h-5 ${colorClasses.icon}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">{activity.user}</span>
                          <span className="text-muted-foreground">{activity.action}</span>
                          <Badge variant="outline" className="ml-1">
                            {activity.target}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {activity.time}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
