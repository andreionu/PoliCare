"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Loader2, Save, Clock, Moon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

const DAY_NAMES = ["Duminică", "Luni", "Marți", "Miercuri", "Joi", "Vineri", "Sâmbătă"]
const DAY_SHORT = ["DUM", "LUN", "MAR", "MIE", "JOI", "VIN", "SÂM"]
const WEEKEND = [0, 6]

const DEFAULT_SCHEDULE = [0, 1, 2, 3, 4, 5, 6].map((day) => ({
  dayOfWeek: day,
  startTime: "08:00",
  endTime: "17:00",
  isActive: day >= 1 && day <= 5,
}))

interface ScheduleRow {
  dayOfWeek: number
  startTime: string
  endTime: string
  isActive: boolean
}

export default function DoctorSchedulePage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [schedules, setSchedules] = useState<ScheduleRow[]>(DEFAULT_SCHEDULE)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const doctorId = session?.user?.doctorId

  useEffect(() => {
    if (!doctorId) return
    fetch(`/api/doctors/${doctorId}/schedules`)
      .then((r) => r.json())
      .then((data: ScheduleRow[]) => {
        if (data.length > 0) {
          const map = new Map(data.map((s) => [s.dayOfWeek, s]))
          setSchedules(DEFAULT_SCHEDULE.map((d) => map.get(d.dayOfWeek) ?? d))
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [doctorId])

  const update = (day: number, field: keyof ScheduleRow, value: any) =>
    setSchedules((prev) => prev.map((s) => (s.dayOfWeek === day ? { ...s, [field]: value } : s)))

  const handleSave = async () => {
    if (!doctorId) return
    setSaving(true)
    try {
      const res = await fetch(`/api/doctors/${doctorId}/schedules`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schedules }),
      })
      if (!res.ok) throw new Error()
      toast({ title: "Program salvat" })
    } catch {
      toast({ title: "Eroare", description: "Nu s-a putut salva programul.", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const activeCount = schedules.filter((s) => s.isActive).length

  return (
    <main className="flex-1 p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-foreground">Programul Meu</h1>
          <p className="text-muted-foreground text-sm">
            {activeCount} {activeCount === 1 ? "zi activă" : "zile active"} pe săptămână
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving || loading}
          className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white gap-2 shrink-0 shadow-md shadow-blue-600/20"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvează
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* ── Desktop: 7-column grid ── */}
          <div className="hidden md:grid grid-cols-7 gap-3">
            {schedules.map((s) => {
              const isWeekend = WEEKEND.includes(s.dayOfWeek)
              return (
                <div
                  key={s.dayOfWeek}
                  className={cn(
                    "relative rounded-2xl border-2 p-4 flex flex-col gap-3 transition-all duration-200",
                    s.isActive
                      ? "bg-white border-blue-200 shadow-md shadow-blue-600/5"
                      : "bg-slate-50 border-slate-100"
                  )}
                >
                  {/* Day header */}
                  <div className="flex flex-col items-center gap-1 pb-3 border-b border-border/50">
                    <span
                      className={cn(
                        "text-[11px] font-black uppercase tracking-widest",
                        s.isActive ? "text-blue-600" : "text-muted-foreground/50"
                      )}
                    >
                      {DAY_SHORT[s.dayOfWeek]}
                    </span>
                    <span
                      className={cn(
                        "text-xs font-semibold",
                        s.isActive ? "text-foreground" : "text-muted-foreground/50",
                        isWeekend && s.isActive && "text-amber-600"
                      )}
                    >
                      {DAY_NAMES[s.dayOfWeek]}
                    </span>
                  </div>

                  {/* Toggle */}
                  <div className="flex items-center justify-between gap-2">
                    <span className={cn("text-[10px] font-bold uppercase tracking-wider", s.isActive ? "text-foreground" : "text-muted-foreground/50")}>
                      {s.isActive ? "Activ" : "Liber"}
                    </span>
                    <Switch
                      checked={s.isActive}
                      onCheckedChange={(v) => update(s.dayOfWeek, "isActive", v)}
                      className="data-[state=checked]:bg-blue-600 scale-90"
                    />
                  </div>

                  {/* Time inputs or rest indicator */}
                  {s.isActive ? (
                    <div className="flex flex-col gap-2 mt-1">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3 text-blue-400 shrink-0" />
                        <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Start</span>
                      </div>
                      <Input
                        type="time"
                        value={s.startTime}
                        onChange={(e) => update(s.dayOfWeek, "startTime", e.target.value)}
                        className="h-8 rounded-xl text-xs px-2 bg-blue-50/50 border-blue-100 focus:border-blue-400 text-center"
                      />
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3 text-blue-400 shrink-0" />
                        <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Sfârșit</span>
                      </div>
                      <Input
                        type="time"
                        value={s.endTime}
                        onChange={(e) => update(s.dayOfWeek, "endTime", e.target.value)}
                        className="h-8 rounded-xl text-xs px-2 bg-blue-50/50 border-blue-100 focus:border-blue-400 text-center"
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center flex-1 py-4 gap-2 text-muted-foreground/40">
                      <Moon className="h-6 w-6" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Zi liberă</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* ── Mobile: list view ── */}
          <Card className="md:hidden rounded-2xl border-slate-100 shadow-sm overflow-hidden">
            <div className="divide-y divide-border/50">
              {schedules.map((s) => (
                <div
                  key={s.dayOfWeek}
                  className={cn(
                    "px-4 py-4 transition-colors",
                    s.isActive ? "bg-white" : "bg-slate-50/60"
                  )}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Switch
                      checked={s.isActive}
                      onCheckedChange={(v) => update(s.dayOfWeek, "isActive", v)}
                      className="data-[state=checked]:bg-blue-600"
                    />
                    <span className={cn("text-sm font-bold", s.isActive ? "text-foreground" : "text-muted-foreground")}>
                      {DAY_NAMES[s.dayOfWeek]}
                    </span>
                  </div>
                  {s.isActive ? (
                    <div className="flex items-center gap-2 pl-11">
                      <Input
                        type="time"
                        value={s.startTime}
                        onChange={(e) => update(s.dayOfWeek, "startTime", e.target.value)}
                        className="h-9 flex-1 rounded-xl text-sm"
                      />
                      <span className="text-muted-foreground text-sm shrink-0">–</span>
                      <Input
                        type="time"
                        value={s.endTime}
                        onChange={(e) => update(s.dayOfWeek, "endTime", e.target.value)}
                        className="h-9 flex-1 rounded-xl text-sm"
                      />
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground italic pl-11">Zi liberă</span>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </main>
  )
}
