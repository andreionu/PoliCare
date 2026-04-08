"use client"

import { useState, useEffect } from "react"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { BookingWizard } from "@/components/booking-wizard"
import { Calendar, ArrowLeft, Star } from "lucide-react"
import Link from "next/link"

interface Doctor {
  id: string
  name: string
  specialty: string
  experience: string
  rating: number
  bio: string | null
  status: string
  department: { name: string; color: string | null }
}

const statusLabel: Record<string, { label: string; color: string }> = {
  ACTIV: { label: "Disponibil", color: "bg-emerald-100 text-emerald-700" },
  IN_CONCEDIU: { label: "În concediu", color: "bg-amber-100 text-amber-700" },
  INDISPONIBIL: { label: "Indisponibil", color: "bg-red-100 text-red-700" },
}

export default function EchipaPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)
  const [showBooking, setShowBooking] = useState(false)
  const [bookingDoctorDept, setBookingDoctorDept] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/doctors")
      .then((r) => r.json())
      .then(setDoctors)
      .finally(() => setLoading(false))
  }, [])

  const grouped = doctors.reduce<Record<string, Doctor[]>>((acc, doc) => {
    const dept = doc.department?.name ?? "Altele"
    if (!acc[dept]) acc[dept] = []
    acc[dept].push(doc)
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Nav */}
      <header className="border-b bg-white/70 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/"><Logo size="md" /></Link>
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Înapoi
            </Link>
            <Button
              className="bg-[#206070] hover:bg-[#1a4d5a] rounded-xl px-6 h-10 font-bold text-sm"
              onClick={() => { setBookingDoctorDept(null); setShowBooking(true) }}
            >
              <Calendar className="mr-2 h-4 w-4" /> Programare
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-white border-b py-16">
        <div className="container mx-auto px-6 text-center space-y-4">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#206070]">Specialiștii Noștri</p>
          <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
            Echipa <span className="text-[#40A0D0]">PoliCare</span>
          </h1>
          <p className="text-lg text-slate-500 max-w-xl mx-auto font-medium">
            Medici cu acreditări internaționale, dedicați sănătății tale.
          </p>
        </div>
      </section>

      {/* Doctors grouped by department */}
      <section className="py-16">
        <div className="container mx-auto px-6 space-y-16">
          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-56 rounded-2xl bg-white animate-pulse border border-slate-100" />
              ))}
            </div>
          ) : Object.keys(grouped).length === 0 ? (
            <p className="text-center text-slate-400 py-24">Niciun medic înregistrat momentan.</p>
          ) : (
            Object.entries(grouped).map(([dept, docs]) => (
              <div key={dept}>
                <h2 className="text-xl font-black uppercase tracking-widest text-slate-900 mb-6 pb-3 border-b border-slate-100">
                  {dept}
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {docs.map((doc) => {
                    const st = statusLabel[doc.status] ?? statusLabel.ACTIV
                    return (
                      <div
                        key={doc.id}
                        className="bg-white rounded-2xl border border-slate-100 p-6 flex flex-col gap-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-14 h-14 rounded-xl bg-gradient-to-tr from-[#206070] to-[#40A0D0] flex items-center justify-center text-white text-xl font-black shrink-0">
                            {doc.name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-black text-slate-900 truncate">{doc.name}</h3>
                            <p className="text-xs font-bold text-[#206070] uppercase tracking-wide">{doc.specialty}</p>
                            <span className={`inline-block mt-1 text-[10px] font-black px-2 py-0.5 rounded-full ${st.color}`}>
                              {st.label}
                            </span>
                          </div>
                        </div>

                        {doc.bio && (
                          <p className="text-sm text-slate-500 leading-relaxed line-clamp-2">{doc.bio}</p>
                        )}

                        <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-50">
                          <div className="flex items-center gap-1 text-amber-500">
                            <Star className="w-3.5 h-3.5 fill-current" />
                            <span className="text-xs font-bold text-slate-700">{doc.rating.toFixed(1)}</span>
                            <span className="text-xs text-slate-400">· {doc.experience}</span>
                          </div>
                          {doc.status === "ACTIV" && (
                            <button
                              onClick={() => { setBookingDoctorDept(null); setShowBooking(true) }}
                              className="text-xs font-black text-[#206070] hover:underline"
                            >
                              Programează-te →
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {showBooking && (
        <BookingWizard
          onClose={() => { setShowBooking(false); setBookingDoctorDept(null) }}
          initialDepartmentId={bookingDoctorDept}
        />
      )}
    </div>
  )
}
