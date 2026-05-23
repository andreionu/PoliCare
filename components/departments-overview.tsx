"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Loader2, HeartPulse, Eye, Ear, Baby, Sparkles, Brain, Bone } from "lucide-react"
import { cn } from "@/lib/utils"

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

const getDepartmentStyle = (name: string) => {
  const n = name.toLowerCase()
  if (n.includes("cardio")) return { icon: HeartPulse, color: "text-rose-600", bg: "bg-rose-50 dark:bg-rose-900/20", bar: "from-rose-500 to-red-600" }
  if (n.includes("dermato")) return { icon: Sparkles, color: "text-fuchsia-600", bg: "bg-fuchsia-50 dark:bg-fuchsia-900/20", bar: "from-fuchsia-500 to-pink-600" }
  if (n.includes("oftalmo")) return { icon: Eye, color: "text-sky-600", bg: "bg-sky-50 dark:bg-sky-900/20", bar: "from-sky-500 to-blue-600" }
  if (n.includes("orl")) return { icon: Ear, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/20", bar: "from-amber-500 to-orange-600" }
  if (n.includes("pediatrie")) return { icon: Baby, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20", bar: "from-emerald-500 to-teal-600" }
  if (n.includes("neuro")) return { icon: Brain, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-900/20", bar: "from-purple-500 to-indigo-600" }
  if (n.includes("orto")) return { icon: Bone, color: "text-slate-600", bg: "bg-slate-50 dark:bg-slate-900/20", bar: "from-slate-500 to-slate-700" }
  return { icon: Building2, color: "text-primary", bg: "bg-primary/5 dark:bg-primary/10", bar: "from-primary to-primary/80" }
}

export function DepartmentsOverview({ departments, loading }: DepartmentsOverviewProps) {
  const maxAppointments = Math.max(...departments.map((d) => d.totalAppointments), 1)

  return (
    <Card className="border-none shadow-sm overflow-hidden bg-white dark:bg-card/50 backdrop-blur-sm h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-6 border-b border-muted/30">
        <div className="space-y-1">
          <CardTitle className="text-xl font-bold tracking-tight">Activitate Departamente</CardTitle>
          <p className="text-xs font-medium text-muted-foreground">Distribuția programărilor pe specialități</p>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="space-y-3 animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-muted rounded-xl" />
                    <div className="space-y-2">
                      <div className="h-4 w-24 bg-muted rounded" />
                      <div className="h-3 w-16 bg-muted/50 rounded" />
                    </div>
                  </div>
                  <div className="h-4 w-12 bg-muted rounded" />
                </div>
                <div className="h-2 w-full bg-muted rounded-full" />
              </div>
            ))}
          </div>
        ) : departments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <div className="w-12 h-12 rounded-full bg-muted/30 flex items-center justify-center text-muted-foreground/30">
              <Building2 className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">Nu există departamente active.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {departments.map((dept) => {
              const percentage = Math.round((dept.totalAppointments / maxAppointments) * 100)
              const style = getDepartmentStyle(dept.name)
              const Icon = style.icon
              
              return (
                <div key={dept.id} className="group p-4 rounded-2xl hover:bg-muted/40 transition-all duration-300 border border-transparent hover:border-muted/50">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "flex items-center justify-center w-11 h-11 rounded-xl transition-transform duration-300 group-hover:scale-110 shadow-sm border border-black/5 dark:border-white/5",
                          style.bg,
                          style.color
                        )}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-foreground/90 tracking-tight group-hover:text-foreground/100 transition-colors">{dept.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{dept.doctorCount} medici</span>
                            <span className="w-1 h-1 rounded-full bg-slate-200 dark:bg-slate-600" />
                            <span className={cn("text-[10px] font-bold uppercase tracking-widest", style.color)}>Activ</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={cn("text-sm font-extrabold tracking-tighter tabular-nums transition-colors", style.color)}>
                          {dept.totalAppointments.toLocaleString()}
                        </p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">programări</p>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                        <span>Încărcare Serviciu</span>
                        <span>{percentage}%</span>
                      </div>
                      <div className="relative h-2 w-full bg-muted/50 dark:bg-muted/10 rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "absolute inset-y-0 left-0 bg-gradient-to-r rounded-full transition-all duration-1000 ease-out group-hover:shadow-md",
                            style.bar
                          )}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
