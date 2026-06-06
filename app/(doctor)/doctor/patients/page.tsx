"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Users, Loader2, Search, FileText, Phone, Mail, Calendar } from "lucide-react"
import { Pagination } from "@/components/ui/pagination"

interface Patient {
  id: string
  name: string
  phone: string | null
  email: string | null
  status: string
  gender: string | null
  _count: { appointments: number; medicalRecords: number }
}

interface PaginatedResponse {
  data: Patient[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

const STATUS_LABELS: Record<string, string> = {
  NOU: "Nou",
  ACTIV: "Activ",
  PROGRAMAT: "Programat",
  INACTIV: "Inactiv",
}

const STATUS_CLASSES: Record<string, string> = {
  ACTIV: "bg-emerald-50 text-emerald-700 border-emerald-100",
  PROGRAMAT: "bg-blue-50 text-blue-700 border-blue-100",
  NOU: "bg-slate-50 text-slate-700 border-slate-100",
  INACTIV: "bg-slate-50 text-slate-500 border-slate-100",
}

export default function DoctorPatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)
    return () => clearTimeout(t)
  }, [search])

  const fetchPatients = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
    if (debouncedSearch) params.set("search", debouncedSearch)

    fetch(`/api/doctor/patients?${params}`)
      .then((r) => r.json())
      .then((res: PaginatedResponse) => {
        setPatients(res.data)
        setTotal(res.total)
        setTotalPages(res.totalPages)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [page, debouncedSearch, pageSize])

  useEffect(() => {
    fetchPatients()
  }, [fetchPatients])

  return (
    <main className="flex-1 p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground">Pacienții Mei</h1>
          <p className="text-muted-foreground">{total} pacienți</p>
        </div>
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Caută după nume, telefon..."
            className="pl-11 h-11 rounded-xl bg-muted/50 border-none focus-visible:ring-2 focus-visible:ring-primary"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="p-20 text-center bg-white dark:bg-card/50 rounded-2xl border border-border/50">
          <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary mb-4" />
          <p className="text-muted-foreground font-medium animate-pulse">Se încarcă pacienții...</p>
        </div>
      ) : patients.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-card/50 rounded-2xl border border-border/50">
          <div className="w-20 h-20 rounded-full bg-primary/5 flex items-center justify-center mb-4">
            <Users className="h-10 w-10 text-primary/40" />
          </div>
          <h3 className="text-xl font-bold mb-1">Niciun pacient găsit</h3>
          <p className="text-muted-foreground text-sm">
            {debouncedSearch ? `Niciun rezultat pentru "${debouncedSearch}"` : "Nu aveți pacienți asignați."}
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4">
            {patients.map((patient) => (
              <Card
                key={patient.id}
                className="group relative bg-white dark:bg-card/50 rounded-2xl border border-border/50 p-4 sm:p-6 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/30 transition-all duration-300"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Left: avatar + name */}
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 sm:h-16 sm:w-16 border-2 border-background shadow-sm ring-2 ring-muted/50 group-hover:ring-primary/20 transition-all rounded-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10 text-primary font-bold text-lg sm:text-xl shrink-0">
                      {patient.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                    <div className="space-y-1 min-w-0">
                      <Link
                        href={`/doctor/patients/${patient.id}`}
                        className="text-base sm:text-xl font-bold text-foreground tracking-tight hover:text-primary transition-colors uppercase leading-none block truncate"
                      >
                        {patient.name}
                      </Link>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        {patient.phone && (
                          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 flex items-center gap-1.5">
                            <Phone className="w-3 h-3" /> {patient.phone}
                          </span>
                        )}
                        {patient.email && (
                          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 items-center gap-1.5 hidden sm:flex">
                            <Mail className="w-3 h-3" /> {patient.email}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: stats + status + action */}
                  <div className="flex flex-wrap items-center gap-4 sm:gap-6 lg:gap-8 pl-0 sm:pl-0">
                    <div className="flex items-center gap-3 sm:flex-col sm:items-start sm:gap-1">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 flex items-center gap-1.5">
                        <Calendar className="w-3 h-3" /> Programări
                      </span>
                      <span className="text-sm font-bold text-foreground/90">{patient._count.appointments}</span>
                    </div>

                    <div className="flex items-center gap-3 sm:flex-col sm:items-start sm:gap-1">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 flex items-center gap-1.5">
                        <FileText className="w-3 h-3" /> Fișe
                      </span>
                      <span className="text-sm font-bold text-foreground/90">{patient._count.medicalRecords}</span>
                    </div>

                    <Badge className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider border shadow-sm ${STATUS_CLASSES[patient.status] ?? "bg-slate-50 text-slate-700 border-slate-100"}`}>
                      {STATUS_LABELS[patient.status] ?? patient.status}
                    </Badge>

                    <Button variant="outline" size="sm" className="h-9 px-4 border-primary/10 text-primary font-bold hover:bg-primary/5 rounded-xl transition-all ml-auto sm:ml-0" asChild>
                      <Link href={`/doctor/patients/${patient.id}`}>Fișă</Link>
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Pagination page={page} pageCount={totalPages} total={total} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} />
        </>
      )}
    </main>
  )
}
