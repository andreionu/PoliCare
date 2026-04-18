"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { BookingWizard } from "@/components/booking-wizard"
import {
  Calendar,
  Heart,
  Clock,
  Users,
  Phone,
  Mail,
  Ear,
  Eye,
  Baby,
  HeartPulse,
  Sparkles,
  Stethoscope,
  Smile,
  Flower2,
  ChevronRight,
  ShieldCheck,
  Zap,
  Star,
  ArrowRight,
  Menu,
  X,
} from "lucide-react"
import { Preloader } from "@/components/preloader"
import { Logo } from "@/components/logo"
import { cn } from "@/lib/utils"
import { AnimatePresence } from "framer-motion"
import { AnimatedCounter } from "@/components/animated-counter"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel"

interface Department {
  id: string
  name: string
  description: string | null
  color: string | null
}

interface Stats {
  totalPatients: number
  totalDoctors: number
  totalDepartments: number
}

const departmentStyles: Record<string, { icon: any; color: string; bg: string; border: string }> = {
  Cardiologie:  { icon: HeartPulse,  color: "text-rose-600",    bg: "bg-rose-50",    border: "border-rose-100"    },
  Dermatologie: { icon: Sparkles,    color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
  Oftalmologie: { icon: Eye,         color: "text-blue-600",    bg: "bg-blue-50",    border: "border-blue-100"    },
  ORL:          { icon: Ear,         color: "text-amber-600",   bg: "bg-amber-50",   border: "border-amber-100"   },
  Pediatrie:    { icon: Baby,        color: "text-purple-600",  bg: "bg-purple-50",  border: "border-purple-100"  },
  Ginecologie:  { icon: Flower2,     color: "text-pink-600",    bg: "bg-pink-50",    border: "border-pink-100"    },
  Stomatologie: { icon: Smile,       color: "text-cyan-600",    bg: "bg-cyan-50",    border: "border-cyan-100"    },
  default:      { icon: Stethoscope, color: "text-slate-600",   bg: "bg-slate-50",   border: "border-slate-100"   },
}

export default function LandingPage() {
  const [showBooking, setShowBooking]       = useState(false)
  const [preselectedDept, setPreselectedDept] = useState<string | null>(null)
  const [departments, setDepartments]       = useState<Department[]>([])
  const [stats, setStats]                   = useState<Stats>({ totalPatients: 0, totalDoctors: 0, totalDepartments: 0 })
  const [settings, setSettings]             = useState<any>(null)
  const [loading, setLoading]               = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const openBooking = (deptId?: string) => {
    setPreselectedDept(deptId ?? null)
    setShowBooking(true)
    setMobileMenuOpen(false)
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [deptRes, patRes, docRes, settingsRes] = await Promise.all([
          fetch("/api/departments"), fetch("/api/patients"), fetch("/api/doctors"), fetch("/api/settings")
        ])
        const [depts, pats, docs, sett] = await Promise.all([
          deptRes.json(), patRes.json(), docRes.json(), settingsRes.json()
        ])
        setDepartments(depts)
        setStats({ totalPatients: pats.length, totalDoctors: docs.length, totalDepartments: depts.length })
        setSettings(sett)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    document.body.style.overflow = (showBooking || mobileMenuOpen) ? "hidden" : "unset"
    return () => { document.body.style.overflow = "unset" }
  }, [showBooking, mobileMenuOpen])

  return (
    <div className="min-h-screen bg-white">
      <AnimatePresence>{loading && <Preloader />}</AnimatePresence>

      {/* ── Navigation ── */}
      <header className="border-b border-slate-100 bg-white/95 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-5 h-16 flex items-center justify-between">
          <Logo size="md" />

          {/* Desktop */}
          <div className="hidden lg:flex items-center gap-6">
            <nav className="flex items-center gap-7">
              <a href="#services" className="text-sm font-medium text-slate-500 hover:text-[#206070] transition-colors">Servicii</a>
              <a href="#about"    className="text-sm font-medium text-slate-500 hover:text-[#206070] transition-colors">Despre Noi</a>
              <a href="#contact"  className="text-sm font-medium text-slate-500 hover:text-[#206070] transition-colors">Contact</a>
            </nav>
            <div className="w-px h-5 bg-slate-200" />
            <Button className="bg-[#206070] hover:bg-[#1a4d5a] rounded-xl px-5 h-9 font-semibold text-sm shadow-sm" onClick={() => openBooking()}>
              <Calendar className="mr-1.5 h-3.5 w-3.5" />Programare
            </Button>
          </div>

          {/* Mobile menu toggle */}
          <button
            className="lg:hidden p-2 rounded-xl hover:bg-slate-100 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5 text-slate-700" /> : <Menu className="h-5 w-5 text-slate-700" />}
          </button>
        </div>

        {/* Mobile menu drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-100 bg-white px-5 py-5 space-y-1">
            {[["#services","Servicii"],["#about","Despre Noi"],["#contact","Contact"]].map(([href, label]) => (
              <a
                key={href}
                href={href}
                onClick={() => setMobileMenuOpen(false)}
                className="block py-3 px-2 text-sm font-medium text-slate-600 hover:text-[#206070] hover:bg-slate-50 rounded-xl transition-colors"
              >
                {label}
              </a>
            ))}
            <div className="pt-3">
              <Button className="w-full bg-[#206070] hover:bg-[#1a4d5a] rounded-xl h-11 font-semibold text-sm" onClick={() => openBooking()}>
                <Calendar className="mr-2 h-4 w-4" />Programare Rapidă
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-white">
        {/* Background blobs */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#40A0D0]/6 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[280px] h-[280px] bg-[#206070]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="container mx-auto px-5">
          {/* Desktop: split-screen with image filling right column */}
          <div className="hidden lg:grid lg:grid-cols-2 lg:min-h-[88vh] lg:items-center lg:gap-10">
            <div className="py-20 space-y-7 animate-in fade-in slide-in-from-left-6 duration-700">
              <HeroText stats={stats} loading={loading} onBook={() => openBooking()} />
            </div>
            <div className="relative h-full">
              <div className="absolute inset-y-8 left-4 right-0 rounded-3xl overflow-hidden shadow-2xl shadow-slate-300/40">
                <img src="/modern-medical-clinic-reception-with-friendly-staf.jpg" alt="PoliCare" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 to-transparent" />
              </div>
              <div className="absolute top-12 right-0 z-10 bg-white shadow-lg border border-slate-100 px-3 py-2.5 rounded-2xl flex items-center gap-2.5">
                <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center"><ShieldCheck className="w-4 h-4 text-emerald-600" /></div>
                <div><p className="text-[9px] font-semibold uppercase tracking-wider text-emerald-600 leading-none mb-0.5">Certificat ISO</p><p className="text-xs font-bold text-slate-800 leading-none">Standarde Înalte</p></div>
              </div>
              <div className="absolute bottom-12 left-8 z-10 bg-white shadow-lg border border-slate-100 px-3 py-2.5 rounded-2xl flex items-center gap-2.5">
                <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center"><Clock className="w-4 h-4 text-blue-600" /></div>
                {loading ? (
                   <div className="w-20 h-8 bg-slate-50 animate-pulse rounded-lg" />
                ) : (
                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-wider text-blue-600 leading-none mb-0.5">Program Lucru</p>
                    <p className="text-xs font-bold text-slate-800 leading-none">
                      {settings?.workdayStart} - {settings?.workdayEnd}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile: stacked */}
          <div className="lg:hidden py-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <HeroText stats={stats} loading={loading} onBook={() => openBooking()} />
            {/* Mobile image */}
            <div className="relative rounded-2xl overflow-hidden aspect-[4/3] shadow-xl shadow-slate-200/60">
              <img src="/modern-medical-clinic-reception-with-friendly-staf.jpg" alt="PoliCare" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 to-transparent" />
              {/* Mobile badges */}
              <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm shadow-md px-2.5 py-2 rounded-xl flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-[10px] font-bold text-slate-800">Certificat ISO</span>
              </div>
              <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm shadow-md px-2.5 py-2 rounded-xl flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span className="text-[10px] font-bold text-slate-800">
                  {loading ? "Program: --" : `L-V: ${settings?.workdayStart}-${settings?.workdayEnd}`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Services ── */}
      <section id="services" className="py-16 lg:py-20 bg-slate-50/70 border-t border-slate-100">
        <div className="container mx-auto px-5">
          <Carousel opts={{ align: "start", loop: true }} className="w-full">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-8">
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-[#206070] uppercase tracking-widest">Specializările Noastre</p>
                <h2 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
                  Servicii medicale <span className="text-[#40A0D0]">complete</span>
                </h2>
              </div>
              <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                <p className="text-xs text-slate-400 sm:text-right max-w-[200px] hidden sm:block">
                  Expertiză în {stats.totalDepartments} arii medicale.
                </p>
                <div className="flex gap-2">
                  <CarouselPrevious className="static translate-y-0 h-8 w-8 rounded-xl border-slate-200 bg-white text-[#206070] hover:bg-[#206070] hover:text-white transition-all shadow-sm" />
                  <CarouselNext    className="static translate-y-0 h-8 w-8 rounded-xl border-slate-200 bg-white text-[#206070] hover:bg-[#206070] hover:text-white transition-all shadow-sm" />
                </div>
              </div>
            </div>

            <CarouselContent className="-ml-3">
              {loading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <CarouselItem key={i} className="pl-3 basis-4/5 sm:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                      <div className="h-44 bg-white rounded-2xl animate-pulse border border-slate-100" />
                    </CarouselItem>
                  ))
                : departments.map((dept) => {
                    const s = departmentStyles[dept.name] || departmentStyles.default
                    const Icon = s.icon
                    return (
                      <CarouselItem key={dept.id} className="pl-3 basis-4/5 sm:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                        <div className="group bg-white p-5 h-full rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all duration-300 overflow-hidden relative select-none">
                          <div className={cn("absolute top-0 right-0 w-20 h-20 -mr-10 -mt-10 rounded-full blur-2xl opacity-0 group-hover:opacity-20 transition-opacity", s.bg)} />
                          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-4 border", s.bg, s.border)}>
                            <Icon className={cn("w-5 h-5", s.color)} />
                          </div>
                          <h4 className="text-sm font-bold text-slate-800 mb-1.5 group-hover:text-[#206070] transition-colors">{dept.name}</h4>
                          <p className="text-slate-400 text-xs leading-relaxed mb-4 line-clamp-2">
                            {dept.description || "Îngrijire specializată cu echipamente moderne."}
                          </p>
                          <button onClick={() => openBooking(dept.id)} className={cn("flex items-center gap-1 text-xs font-semibold hover:opacity-70 transition-opacity", s.color)}>
                            Programează-te <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      </CarouselItem>
                    )
                  })}
            </CarouselContent>
          </Carousel>
        </div>
      </section>

      {/* ── About ── */}
      <section id="about" className="bg-white border-t border-slate-100">
        <div className="container mx-auto px-5">
          {/* Desktop: split-screen */}
          <div className="hidden lg:grid lg:grid-cols-2 lg:min-h-[70vh] lg:items-center lg:gap-10">
            <div className="relative h-full">
              <div className="absolute inset-y-8 left-0 right-4 rounded-3xl overflow-hidden shadow-2xl shadow-slate-300/40">
                <img src="/happy-patient-consultation-with-doctor.jpg" alt="Consultație PoliCare" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/15 to-transparent" />
              </div>
              <div className="absolute bottom-12 right-8 z-10 bg-[#206070] text-white px-5 py-3.5 rounded-2xl shadow-xl">
                <p className="text-3xl font-black leading-none">99%</p>
                <p className="text-[9px] font-semibold uppercase tracking-widest opacity-75 mt-1">Rată Satisfacție</p>
              </div>
            </div>
            <div className="py-20 space-y-7">
              <AboutText onBook={() => openBooking()} />
            </div>
          </div>

          {/* Mobile: stacked */}
          <div className="lg:hidden py-10 space-y-8">
            {/* Image first on mobile */}
            <div className="relative rounded-2xl overflow-hidden aspect-[4/3] shadow-xl shadow-slate-200/60">
              <img src="/happy-patient-consultation-with-doctor.jpg" alt="Consultație PoliCare" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 to-transparent" />
              <div className="absolute bottom-3 right-3 bg-[#206070] text-white px-4 py-2.5 rounded-xl shadow-lg">
                <p className="text-xl font-black leading-none">99%</p>
                <p className="text-[9px] font-semibold uppercase tracking-wider opacity-75">Rată Satisfacție</p>
              </div>
            </div>
            <AboutText onBook={() => openBooking()} />
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-12 lg:py-16 bg-slate-50/70 border-t border-slate-100">
        <div className="container mx-auto px-5">
          <div className="relative overflow-hidden bg-gradient-to-br from-[#206070] via-[#206070] to-[#2a7d92] rounded-3xl px-7 py-10 lg:px-16 lg:py-12 flex flex-col lg:flex-row items-center justify-between gap-7">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-2xl -mr-20 -mt-20 pointer-events-none" />
            <div className="relative z-10 text-center lg:text-left space-y-2">
              <h2 className="text-2xl lg:text-3xl font-black text-white tracking-tight">Pregătit pentru un control?</h2>
              <p className="text-blue-100/80 text-sm font-medium max-w-sm">Programează-te online în mai puțin de 2 minute.</p>
            </div>
            <div className="relative z-10 flex flex-col sm:flex-row gap-3 w-full lg:w-auto shrink-0">
              <Button size="lg" className="h-11 px-7 bg-white text-[#206070] hover:bg-blue-50 rounded-xl font-bold text-sm shadow-xl w-full sm:w-auto" onClick={() => openBooking()}>
                Programează Acum
              </Button>
              <a href="tel:+40770166201" className="flex items-center justify-center h-11 px-7 border border-white/25 text-white rounded-xl font-semibold text-sm hover:bg-white/10 transition-all w-full sm:w-auto">
                <Phone className="mr-2 h-4 w-4" />Sună-ne
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-slate-900 pt-12 pb-7 relative border-t border-slate-800">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#40A0D0]/50 to-transparent" />
        <div className="container mx-auto px-5">
          <div className="grid sm:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10 mb-10">
            <div className="sm:col-span-2 lg:col-span-4 space-y-4">
              <Logo size="sm" />
              <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
                Lideri în servicii medicale de specialitate, dedicați comunității prin excelență.
              </p>
              <div className="flex gap-2">
                {[Heart, Star].map((Icon, i) => (
                  <div key={i} className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700/60 flex items-center justify-center text-slate-500 hover:bg-[#206070] hover:text-white hover:border-[#206070] transition-all cursor-pointer">
                    <Icon className="w-4 h-4" />
                  </div>
                ))}
              </div>
            </div>
            <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-7">
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-widest text-white">Servicii</h4>
                <ul className="space-y-2.5 text-sm text-slate-400">
                  {["Cardiologie","Pediatrie","Oftalmologie","ORL"].map(s => (
                    <li key={s}><a href="#services" onClick={e => { e.preventDefault(); document.getElementById("services")?.scrollIntoView({ behavior: "smooth" }) }} className="hover:text-white transition-colors">{s}</a></li>
                  ))}
                </ul>
              </div>
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-widest text-white">Comunitate</h4>
                <ul className="space-y-2.5 text-sm text-slate-400">
                  {[["Echipa","/echipa"],["Cariere","/cariere"],["Blog","/blog"]].map(([l,h]) => (
                    <li key={h}><a href={h} className="hover:text-white transition-colors">{l}</a></li>
                  ))}
                </ul>
              </div>
              <div className="space-y-4 col-span-2 sm:col-span-1" id="contact">
                <h4 className="text-xs font-bold uppercase tracking-widest text-white">Contact & Program</h4>
                <ul className="space-y-3">
                  {[{icon:Phone,label:"Telefon",value:settings?.clinicPhone || "+40 770 166 201"},{icon:Mail,label:"Email",value:settings?.clinicEmail || "contact@policare.ro"}].map(({icon:Icon,label,value}) => (
                    <li key={label} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700/60 flex items-center justify-center shrink-0 mt-0.5">
                        <Icon className="h-3.5 w-3.5 text-[#40A0D0]" />
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 mb-0.5">{label}</p>
                        <p className="text-sm text-white font-medium break-all">{value}</p>
                      </div>
                    </li>
                  ))}
                  <li className="flex items-start gap-3 pt-1 border-t border-slate-800/50">
                    <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700/60 flex items-center justify-center shrink-0 mt-0.5">
                      <Clock className="h-3.5 w-3.5 text-amber-500" />
                    </div>
                    {!loading && settings && (
                      <div>
                        <p className="text-[10px] text-slate-500 mb-0.5">Program Lucru</p>
                        <div className="space-y-0.5">
                          <p className="text-xs text-white font-medium">Luni - Vineri: {settings.workdayStart} - {settings.workdayEnd}</p>
                          <p className="text-xs text-slate-500 font-medium">
                            {settings.workingDays.split(",").includes("5") || settings.workingDays.split(",").includes("6") 
                              ? "Sâmbătă - Duminică: Consultă booking" 
                              : "Sâmbătă - Duminică: Închis"}
                          </p>
                        </div>
                      </div>
                    )}
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-500 text-xs">
            <p>© 2025 PoliCare Clinic. Toate drepturile rezervate.</p>
            <div className="flex gap-5">
              {[["Termeni","/termeni"],["Confidențialitate","/confidentialitate"],["Cookies","/cookies"]].map(([l,h]) => (
                <a key={h} href={h} className="hover:text-white transition-colors">{l}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {showBooking && (
        <BookingWizard onClose={() => { setShowBooking(false); setPreselectedDept(null) }} initialDepartmentId={preselectedDept} />
      )}
    </div>
  )
}

/* ── Shared sub-components to avoid repetition ── */

function HeroText({ stats, loading, onBook }: { stats: Stats; loading: boolean; onBook: () => void }) {
  return (
    <>
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#206070]/8 border border-[#206070]/12">
        <span className="h-1.5 w-1.5 rounded-full bg-[#206070] animate-pulse" />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#206070]">Excelență în Medicină</span>
      </div>

      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.05] tracking-tight text-slate-900">
        Sănătatea ta,<br />
        <span className="text-[#40A0D0]">Misiunea</span> Noastră.
      </h1>

      <p className="text-base text-slate-500 leading-relaxed max-w-md">
        Descoperă o nouă eră a îngrijirii medicale la{" "}
        <span className="font-semibold text-slate-700">PoliCare</span>. Combinăm tehnologia de
        ultimă oră cu o echipă de experți dedicați stării tale de bine.
      </p>

      <div className="flex flex-wrap gap-3">
        <Button size="lg" className="h-11 px-7 bg-[#206070] hover:bg-[#1a4d5a] rounded-xl font-semibold text-sm shadow-lg shadow-[#206070]/25 group" onClick={onBook}>
          Programează-te <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
        </Button>
        <Button variant="outline" size="lg" className="h-11 px-7 rounded-xl border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50"
          onClick={() => document.getElementById("services")?.scrollIntoView({ behavior: "smooth" })}>
          Serviciile Noastre
        </Button>
      </div>

      <div className="flex gap-6 sm:gap-10 pt-4 border-t border-slate-100">
        {[
          { label: "Pacienți", val: stats.totalPatients, suffix: "+", color: "text-[#206070]" },
          { label: "Medici",   val: stats.totalDoctors,  suffix: "",  color: "text-[#40A0D0]" },
          { label: "Specialități", val: stats.totalDepartments, suffix: "", color: "text-indigo-600" },
        ].map((s, i) => (
          <div key={i}>
            <p className={`text-2xl font-black tracking-tight ${s.color}`}>
              {loading ? "—" : <AnimatedCounter value={s.val} suffix={s.suffix} />}
            </p>
            <p className="text-xs text-slate-400 font-medium mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>
    </>
  )
}

function AboutText({ onBook }: { onBook: () => void }) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs font-semibold text-[#40A0D0] uppercase tracking-widest">Standardul Nostru</p>
        <h2 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
          De ce <span className="text-[#206070]">PoliCare</span>?
        </h2>
      </div>

      <div className="grid gap-2">
        {[
          { title: "Personal de Vârf",        desc: "Medici cu acreditări internaționale și experiență vastă.",      icon: Users,  bg: "bg-blue-50",  border: "border-blue-100",  text: "text-blue-600"  },
          { title: "Tehnologie Avansată",      desc: "Sisteme de diagnosticare și tratament de ultimă generație.",   icon: Zap,    bg: "bg-amber-50", border: "border-amber-100", text: "text-amber-600" },
          { title: "Îngrijire Personalizată",  desc: "Fiecare pacient beneficiază de un plan terapeutic dedicat.",   icon: Heart,  bg: "bg-rose-50",  border: "border-rose-100",  text: "text-rose-600"  },
        ].map((feat, i) => (
          <div key={i} className="flex gap-4 items-start p-3.5 rounded-2xl hover:bg-slate-50 transition-colors group cursor-default">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border group-hover:scale-105 transition-transform", feat.bg, feat.border)}>
              <feat.icon className={cn("w-5 h-5", feat.text)} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800 mb-0.5">{feat.title}</h4>
              <p className="text-slate-400 text-sm leading-relaxed">{feat.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <Button className="h-10 px-6 bg-[#206070] hover:bg-[#1a4d5a] rounded-xl font-semibold text-sm shadow-md shadow-[#206070]/20" onClick={onBook}>
        Programează-te acum <ArrowRight className="ml-2 h-3.5 w-3.5" />
      </Button>
    </div>
  )
}
