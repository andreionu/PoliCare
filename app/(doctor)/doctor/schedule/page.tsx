"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Loader2, Save, Clock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

const DAY_NAMES = ["Duminică", "Luni", "Marți", "Miercuri", "Joi", "Vineri", "Sâmbătă"]
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

  const update = (day: number, field: keyof ScheduleRow, value: any) => {
    setSchedules((prev) => prev.map((s) => s.dayOfWeek === day ? { ...s, [field]: value } : s))
  }

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

  return (
    <main className="flex-1 p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-foreground">Programul Meu</h1>
          <p className="text-muted-foreground text-sm">Setați zilele și orele de lucru</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving || loading}
          className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white gap-2 shrink-0"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          <span className="hidden sm:inline">Salvează</span>
        </Button>
      </div>

      <Card className="rounded-2xl border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {schedules.map((s) => (
              <div
                key={s.dayOfWeek}
                className={cn(
                  "px-4 sm:px-6 py-3 sm:py-4 transition-colors",
                  s.isActive ? "bg-white" : "bg-slate-50/60"
                )}
              >
                {/* Top row: toggle + day name */}
                <div className="flex items-center gap-3 mb-2 sm:mb-0 sm:hidden">
                  <Switch
                    checked={s.isActive}
                    onCheckedChange={(v) => update(s.dayOfWeek, "isActive", v)}
                    className="data-[state=checked]:bg-blue-600"
                  />
                  <span className={cn("text-sm font-bold", s.isActive ? "text-foreground" : "text-muted-foreground")}>
                    {DAY_NAMES[s.dayOfWeek]}
                  </span>
                </div>
                {/* Time inputs on mobile second row, single row on desktop */}
                <div className="hidden sm:flex items-center gap-4">
                  <Switch
                    checked={s.isActive}
                    onCheckedChange={(v) => update(s.dayOfWeek, "isActive", v)}
                    className="data-[state=checked]:bg-blue-600"
                  />
                  <span className={cn("w-24 text-sm font-bold shrink-0", s.isActive ? "text-foreground" : "text-muted-foreground")}>
                    {DAY_NAMES[s.dayOfWeek]}
                  </span>
                  {s.isActive ? (
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                      <Input type="time" value={s.startTime} onChange={(e) => update(s.dayOfWeek, "startTime", e.target.value)} className="h-9 w-32 rounded-xl text-sm" />
                      <span className="text-muted-foreground text-sm">–</span>
                      <Input type="time" value={s.endTime} onChange={(e) => update(s.dayOfWeek, "endTime", e.target.value)} className="h-9 w-32 rounded-xl text-sm" />
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">Zi liberă</span>
                  )}
                </div>
                {/* Mobile time row */}
                <div className="sm:hidden">
                  {s.isActive ? (
                    <div className="flex items-center gap-2 pl-11">
                      <Input type="time" value={s.startTime} onChange={(e) => update(s.dayOfWeek, "startTime", e.target.value)} className="h-9 flex-1 rounded-xl text-sm" />
                      <span className="text-muted-foreground text-sm shrink-0">–</span>
                      <Input type="time" value={s.endTime} onChange={(e) => update(s.dayOfWeek, "endTime", e.target.value)} className="h-9 flex-1 rounded-xl text-sm" />
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground italic pl-11">Zi liberă</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </main>
  )
}
