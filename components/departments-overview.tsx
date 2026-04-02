"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Building2, Loader2 } from "lucide-react"

interface DepartmentStat {
  id: string
  name: string
  totalAppointments: number
  doctorCount: number
}

interface DepartmentsOverviewProps {
  departments: DepartmentStat[]
  loading: boolean
}

export function DepartmentsOverview({ departments, loading }: DepartmentsOverviewProps) {
  const maxAppointments = Math.max(...departments.map((d) => d.totalAppointments), 1)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activitate Departamente</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : departments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Nu există departamente active.</p>
        ) : (
          <div className="space-y-6">
            {departments.map((dept) => {
              const percentage = Math.round((dept.totalAppointments / maxAppointments) * 100)
              return (
                <div key={dept.id} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 text-primary">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="font-medium">{dept.name}</span>
                        <p className="text-xs text-muted-foreground">{dept.doctorCount} medici</p>
                      </div>
                    </div>
                    <span className="text-muted-foreground tabular-nums">
                      {dept.totalAppointments.toLocaleString()} prog.
                    </span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
