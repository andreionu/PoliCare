"use client"

import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Heart, Users, Baby, ShieldCheck } from "lucide-react"
import Link from "next/link"
import { BookingWizard } from "@/components/booking-wizard"
import { useState } from "react"

const programs = [
  {
    icon: Baby,
    title: "Sănătatea Copilului",
    color: "bg-purple-50 text-purple-600",
    desc: "Consultații pediatrice gratuite pentru copii din familii cu venituri reduse, în parteneriat cu autoritățile locale.",
    badge: "Activ",
  },
  {
    icon: Users,
    title: "Vârstnici Activi",
    color: "bg-blue-50 text-blue-600",
    desc: "Controale medicale periodice gratuite pentru persoanele peste 65 de ani din cartierele partenere.",
    badge: "Activ",
  },
  {
    icon: Heart,
    title: "Inimă Sănătoasă",
    color: "bg-rose-50 text-rose-600",
    desc: "Screening cardiovascular gratuit pentru persoanele cu risc ridicat, o dată pe an.",
    badge: "Sezonier",
  },
  {
    icon: ShieldCheck,
    title: "Vaccinare Comunitate",
    color: "bg-emerald-50 text-emerald-600",
    desc: "Campanii de vaccinare cu acces extins în colaborare cu DSP și Ministerul Sănătății.",
    badge: "Periodic",
  },
]

export default function ProgrameSocialePage() {
  const [showBooking, setShowBooking] = useState(false)

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <header className="border-b bg-white/70 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/"><Logo size="md" /></Link>
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Înapoi
            </Link>
            <Button className="bg-[#206070] hover:bg-[#1a4d5a] rounded-xl px-6 h-10 font-bold text-sm" onClick={() => setShowBooking(true)}>
              Programare gratuită
            </Button>
          </div>
        </div>
      </header>

      <section className="bg-white border-b py-16">
        <div className="container mx-auto px-6 text-center space-y-4">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#206070]">Responsabilitate socială</p>
          <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
            Programe <span className="text-[#40A0D0]">Sociale</span>
          </h1>
          <p className="text-lg text-slate-500 max-w-xl mx-auto font-medium">
            La PoliCare credem că sănătatea de calitate trebuie să fie accesibilă tuturor. Programele noastre sociale susțin comunitatea.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="grid sm:grid-cols-2 gap-6">
            {programs.map((p) => (
              <div key={p.title} className="bg-white rounded-2xl border border-slate-100 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4 mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${p.color}`}>
                    <p.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900">{p.title}</h3>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">{p.badge}</span>
                  </div>
                </div>
                <p className="text-sm text-slate-500">{p.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 p-8 bg-[#206070] rounded-2xl text-white text-center space-y-4">
            <h2 className="text-2xl font-black">Beneficiezi de un program social?</h2>
            <p className="text-blue-100 text-sm">Contactează-ne pentru a verifica eligibilitatea și a face o programare gratuită.</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button className="bg-white text-[#206070] hover:bg-blue-50 font-black rounded-xl" onClick={() => setShowBooking(true)}>
                Programare gratuită
              </Button>
              <a href="tel:+40123456789" className="flex items-center h-10 px-6 border-2 border-white/30 rounded-xl text-sm font-black hover:bg-white/10 transition-colors">
                Sună-ne
              </a>
            </div>
          </div>
        </div>
      </section>

      {showBooking && <BookingWizard onClose={() => setShowBooking(false)} />}
    </div>
  )
}
