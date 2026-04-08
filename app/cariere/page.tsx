"use client"

import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Briefcase, MapPin, Clock, ChevronRight } from "lucide-react"
import Link from "next/link"

const openings = [
  {
    title: "Medic Specialist Cardiologie",
    dept: "Cardiologie",
    type: "Full-time",
    location: "București",
    desc: "Căutăm un cardiolog cu experiență de minim 3 ani, cu abilități de comunicare excelente și orientare spre pacient.",
  },
  {
    title: "Asistent Medical Generalist",
    dept: "Recepție & Îngrijire",
    type: "Full-time",
    location: "București",
    desc: "Rol de asistent medical cu atribuții de monitorizare și îngrijire a pacienților în regim ambulator.",
  },
  {
    title: "Recepționer / Front Desk",
    dept: "Administrație",
    type: "Part-time / Full-time",
    location: "București",
    desc: "Persoană organizată, cu abilități de comunicare și cunoștințe de bază în utilizarea calculatorului.",
  },
  {
    title: "Medic Oftalmolog",
    dept: "Oftalmologie",
    type: "Full-time",
    location: "București",
    desc: "Specialist în patologia oculară, cu experiență în utilizarea echipamentelor de diagnostic modern.",
  },
]

export default function CarierePage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <header className="border-b bg-white/70 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/"><Logo size="md" /></Link>
          <Link href="/" className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Înapoi
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-white border-b py-16">
        <div className="container mx-auto px-6 text-center space-y-4">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#206070]">Alătură-te echipei</p>
          <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
            Cariere la <span className="text-[#40A0D0]">PoliCare</span>
          </h1>
          <p className="text-lg text-slate-500 max-w-xl mx-auto font-medium">
            Construim împreună viitorul medicinei. Dacă ești pasionat de sănătate și vrei să faci diferența, vino în echipa noastră.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="py-12 bg-white border-b">
        <div className="container mx-auto px-6">
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { title: "Dezvoltare continuă", desc: "Cursuri, conferințe și programe de formare finanțate de clinică." },
              { title: "Mediu de lucru modern", desc: "Echipamente de ultimă generație și spații ergonomice de lucru." },
              { title: "Echipă unită", desc: "O cultură organizațională bazată pe respect, colaborare și empatie." },
            ].map((v) => (
              <div key={v.title} className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
                <h3 className="font-black text-slate-900 mb-2">{v.title}</h3>
                <p className="text-sm text-slate-500">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Openings */}
      <section className="py-16">
        <div className="container mx-auto px-6 space-y-4 max-w-3xl">
          <h2 className="text-2xl font-black text-slate-900 mb-8">Poziții deschise</h2>
          {openings.map((job) => (
            <div key={job.title} className="bg-white rounded-2xl border border-slate-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="space-y-1">
                  <h3 className="font-black text-slate-900 text-lg">{job.title}</h3>
                  <div className="flex flex-wrap gap-3 text-xs font-bold text-slate-400">
                    <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />{job.dept}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{job.type}</span>
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>
                  </div>
                </div>
                <a
                  href="mailto:hr@policare.ro"
                  className="flex items-center gap-1 text-sm font-black text-[#206070] hover:underline shrink-0"
                >
                  Aplică <ChevronRight className="w-4 h-4" />
                </a>
              </div>
              <p className="mt-3 text-sm text-slate-500">{job.desc}</p>
            </div>
          ))}

          <div className="pt-6 text-center text-sm text-slate-500">
            Nu găsești poziția potrivită?{" "}
            <a href="mailto:hr@policare.ro" className="font-bold text-[#206070] hover:underline">
              Trimite-ne CV-ul tău
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
