"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Loader2, Save, Moon, Clock, Sun } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

const DAYS = [
  { short: "LUN", full: "Luni",      index: 1, weekend: false },
  { short: "MAR", full: "Marți",     index: 2, weekend: false },
  { short: "MIE", full: "Miercuri",  index: 3, weekend: false },
  { short: "JOI", full: "Joi",       index: 4, weekend: false },
  { short: "VIN", full: "Vineri",    index: 5, weekend: false },
  { short: "SÂM", full: "Sâmbătă",  index: 6, weekend: true  },
  { short: "DUM", full: "Duminică",  index: 0, weekend: true  },
]

const DEFAULT_SCHEDULE = DAYS.map((d) => ({
  dayOfWeek: d.index,
  startTime: "08:00",
  endTime: "17:00",
  isActive: !d.weekend,
}))

interface ScheduleRow {
  dayOfWeek: number
  startTime: string
  endTime: string
  isActive: boolean
}

function hoursLabel(start: string, end: string) {
  const [sh, sm] = start.split(":").map(Number)
  const [eh, em] = end.split(":").map(Number)
  const mins = eh * 60 + em - (sh * 60 + sm)
  if (mins <= 0) return null
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m === 0 ? `${h}h` : `${h}h ${m}m`
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

  const activeDays = schedules.filter((s) => s.isActive)
  const totalHours = activeDays.reduce((sum, s) => {
    const [sh, sm] = s.startTime.split(":").map(Number)
    const [eh, em] = s.endTime.split(":").map(Number)
    return sum + Math.max(0, eh * 60 + em - (sh * 60 + sm))
  }, 0)

  return (
    <main className="flex-1 p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground">Programul Meu</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {activeDays.length} {activeDays.length === 1 ? "zi activă" : "zile active"} ·{" "}
            {Math.floor(totalHours / 60)}h {totalHours % 60 > 0 ? `${totalHours % 60}m` : ""} / săptămână
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
        <div className="space-y-2">
          {DAYS.map((day) => {
            const s = schedules.find((r) => r.dayOfWeek === day.index)!
            const duration = s.isActive ? hoursLabel(s.startTime, s.endTime) : null

            return (
              <div
                key={day.index}
                className={cn(
                  "rounded-2xl border-2 transition-all duration-200",
                  s.isActive
                    ? day.weekend
                      ? "bg-white border-amber-200 shadow-sm shadow-amber-500/5"
                      : "bg-white border-blue-200 shadow-sm shadow-blue-500/5"
                    : "bg-slate-50 border-slate-100"
                )}
              >
                <div className="px-4 sm:px-5 py-4 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-4">
                  {/* Day label + toggle (always in one row) */}
                  <div className="flex items-center justify-between sm:justify-start sm:w-28 sm:flex-col sm:items-start sm:gap-0.5 shrink-0">
                    <div>
                      <p className={cn(
                        "font-bold text-sm",
                        s.isActive ? (day.weekend ? "text-amber-600" : "text-blue-700") : "text-muted-foreground/50"
                      )}>
                        {day.full}
                      </p>
                      <p className={cn(
                        "text-[10px] font-semibold uppercase tracking-widest",
                        s.isActive ? "text-muted-foreground" : "text-muted-foreground/40"
                      )}>
                        {day.short}
                      </p>
                    </div>
                    {/* Toggle visible on mobile inside the label row */}
                    <Switch
                      checked={s.isActive}
                      onCheckedChange={(v) => update(s.dayOfWeek, "isActive", v)}
                      className={cn(
                        "sm:hidden shrink-0",
                        day.weekend ? "data-[state=checked]:bg-amber-500" : "data-[state=checked]:bg-blue-600"
                      )}
                    />
                  </div>

                  {/* Time inputs or rest */}
                  <div className="flex-1 min-w-0">
                    {s.isActive ? (
                      <div className="flex items-center gap-2 sm:gap-3 max-w-sm">
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-1">
                          <Clock className={cn("h-4 w-4 shrink-0 hidden sm:block", day.weekend ? "text-amber-400" : "text-blue-400")} />
                          <Input
                            type="time"
                            value={s.startTime}
                            onChange={(e) => update(s.dayOfWeek, "startTime", e.target.value)}
                            className={cn(
                              "h-10 rounded-xl text-sm font-medium text-center flex-1 min-w-0",
                              day.weekend
                                ? "bg-amber-50/60 border-amber-100 focus:border-amber-400"
                                : "bg-blue-50/60 border-blue-100 focus:border-blue-400"
                            )}
                          />
                        </div>
                        <span className="text-muted-foreground/60 text-sm font-medium shrink-0">—</span>
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-1">
                          <Input
                            type="time"
                            value={s.endTime}
                            onChange={(e) => update(s.dayOfWeek, "endTime", e.target.value)}
                            className={cn(
                              "h-10 rounded-xl text-sm font-medium text-center flex-1 min-w-0",
                              day.weekend
                                ? "bg-amber-50/60 border-amber-100 focus:border-amber-400"
                                : "bg-blue-50/60 border-blue-100 focus:border-blue-400"
                            )}
                          />
                          <Sun className={cn("h-4 w-4 shrink-0 hidden sm:block", day.weekend ? "text-amber-400" : "text-blue-400")} />
                        </div>
                        {duration && (
                          <span className={cn(
                            "text-xs font-bold px-2 sm:px-2.5 py-1 rounded-lg shrink-0",
                            day.weekend ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                          )}>
                            {duration}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-muted-foreground/40">
                        <Moon className="h-4 w-4" />
                        <span className="text-sm font-medium">Zi liberă</span>
                      </div>
                    )}
                  </div>

                  {/* Toggle — desktop only (mobile toggle is in the label row) */}
                  <Switch
                    checked={s.isActive}
                    onCheckedChange={(v) => update(s.dayOfWeek, "isActive", v)}
                    className={cn(
                      "hidden sm:flex shrink-0",
                      day.weekend ? "data-[state=checked]:bg-amber-500" : "data-[state=checked]:bg-blue-600"
                    )}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}
