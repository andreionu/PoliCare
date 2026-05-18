"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Users, Loader2, Search, ChevronRight } from "lucide-react"

interface Patient {
  id: string
  name: string
  phone: string | null
  email: string | null
  status: string
  gender: string | null
  _count: { appointments: number; medicalRecords: number }
}

const statusLabels: Record<string, string> = {
  NOU: "Nou",
  ACTIV: "Activ",
  PROGRAMAT: "Programat",
  INACTIV: "Inactiv",
}

const statusColors: Record<string, string> = {
  NOU: "bg-blue-100 text-blue-700",
  ACTIV: "bg-green-100 text-green-700",
  PROGRAMAT: "bg-amber-100 text-amber-700",
  INACTIV: "bg-gray-100 text-gray-700",
}

export default function DoctorPatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    fetch("/api/doctor/patients")
      .then((r) => r.json())
      .then(setPatients)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filtered = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.phone && p.phone.includes(search)) ||
      (p.email && p.email.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <main className="flex-1 p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl font-black text-foreground">Pacienții Mei</h1>
        <p className="text-muted-foreground">{patients.length} pacienți</p>
      </div>

      <div className="relative w-full sm:max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Caută după nume, telefon..."
          className="pl-9 h-10 rounded-xl"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card className="rounded-2xl border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
            <Users className="h-10 w-10 opacity-30" />
            <p className="font-semibold text-sm">Niciun pacient găsit</p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {filtered.map((patient) => (
              <Link
                key={patient.id}
                href={`/doctor/patients/${patient.id}`}
                className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-slate-600">
                    {patient.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-bold text-sm text-foreground truncate">{patient.name}</p>
                    <Badge className={statusColors[patient.status] ?? "bg-gray-100 text-gray-700"}>
                      {statusLabels[patient.status] ?? patient.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {patient.phone ?? "—"} · {patient._count.appointments} programări · {patient._count.medicalRecords} fișe
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </Card>
    </main>
  )
}
