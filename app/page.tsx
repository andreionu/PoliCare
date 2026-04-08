"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { BookingWizard } from "@/components/booking-wizard"
import { 
  Calendar, 
  Heart, 
  Clock, 
  Users, 
  Star, 
  Phone, 
  Mail, 
  MapPin, 
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
  ArrowLeft,
  ArrowRight
} from "lucide-react"
import { Preloader } from "@/components/preloader"
import { Logo } from "@/components/logo"
import { cn } from "@/lib/utils"
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  CarouselPrevious, 
  CarouselNext 
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

// Premium Icon & Theme mapping for departments
const departmentStyles: Record<string, { icon: any; color: string; bg: string }> = {
  Cardiologie: { icon: HeartPulse, color: "text-rose-600", bg: "bg-rose-50" },
  Dermatologie: { icon: Sparkles, color: "text-emerald-600", bg: "bg-emerald-50" },
  Oftalmologie: { icon: Eye, color: "text-blue-600", bg: "bg-blue-50" },
  ORL: { icon: Ear, color: "text-amber-600", bg: "bg-amber-50" },
  Pediatrie: { icon: Baby, color: "text-purple-600", bg: "bg-purple-50" },
  Ginecologie: { icon: Flower2, color: "text-pink-600", bg: "bg-pink-50" },
  Stomatologie: { icon: Smile, color: "text-cyan-600", bg: "bg-cyan-50" },
  default: { icon: Stethoscope, color: "text-slate-600", bg: "bg-slate-50" },
}

export default function LandingPage() {
  const [showBooking, setShowBooking] = useState(false)
  const [preselectedDept, setPreselectedDept] = useState<string | null>(null)
  const [departments, setDepartments] = useState<Department[]>([])
  const [stats, setStats] = useState<Stats>({ totalPatients: 0, totalDoctors: 0, totalDepartments: 0 })
  const [loading, setLoading] = useState(true)

  const openBooking = (deptId?: string) => {
    setPreselectedDept(deptId ?? null)
    setShowBooking(true)
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [departmentsRes, patientsRes, doctorsRes] = await Promise.all([
          fetch("/api/departments"),
          fetch("/api/patients"),
          fetch("/api/doctors"),
        ])

        const [departmentsData, patientsData, doctorsData] = await Promise.all([
          departmentsRes.json(),
          patientsRes.json(),
          doctorsRes.json(),
        ])

        setDepartments(departmentsData)
        setStats({
          totalPatients: patientsData.length,
          totalDoctors: doctorsData.length,
          totalDepartments: departmentsData.length,
        })
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    if (showBooking) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [showBooking])

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
        {loading && <Preloader />}
        
        {/* Navigation */}
        <header className="border-b bg-white/70 backdrop-blur-xl sticky top-0 z-50 transition-all duration-300">
          <div className="container mx-auto px-6 h-20 flex items-center justify-between">
            <Logo size="md" />
            
            <nav className="hidden lg:flex items-center gap-10">
              <a href="#services" className="text-sm font-bold text-slate-600 hover:text-[#206070] transition-colors uppercase tracking-widest">Servicii</a>
              <a href="#about" className="text-sm font-bold text-slate-600 hover:text-[#206070] transition-colors uppercase tracking-widest">Despre Noi</a>
              <a href="#contact" className="text-sm font-bold text-slate-600 hover:text-[#206070] transition-colors uppercase tracking-widest">Contact</a>
            </nav>

            <div className="flex items-center gap-4">
              <Button 
                className="bg-[#206070] hover:bg-[#1a4d5a] shadow-lg shadow-[#206070]/20 rounded-xl px-8 h-12 font-bold text-sm tracking-wide transition-all hover:scale-105 active:scale-95"
                onClick={() => openBooking()}
              >
                <Calendar className="mr-2 h-4 w-4" />
                Programare Rapidă
              </Button>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="relative overflow-hidden pt-12 pb-24 lg:pt-24 lg:pb-32 bg-white">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-[#40A0D0]/10 to-transparent rounded-full blur-3xl -mr-64 -mt-64" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-[#206070]/5 to-transparent rounded-full blur-3xl -ml-32 -mb-32" />
          
          <div className="container mx-auto px-6 relative z-10">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-10 animate-in fade-in slide-in-from-left-8 duration-1000">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#206070]/5 rounded-2xl border border-[#206070]/10">
                  <span className="flex h-2 w-2 rounded-full bg-[#206070] animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#206070]">Excelență în Medicină</span>
                </div>
                
                <h1 className="text-5xl lg:text-7xl font-black leading-[1.1] text-slate-900 tracking-tight">
                  Sănătatea ta, <br />
                  <span className="text-[#40A0D0]">Misiunea</span> Noastră.
                </h1>
                
                <p className="text-xl text-slate-600 leading-relaxed font-medium max-w-xl">
                  Descoperă o nouă eră a îngrijirii medicale la <strong>PoliCare</strong>. 
                  Combinăm tehnologia de ultimă oră cu o echipă de experți dedicați stării tale de bine.
                </p>
                
                <div className="flex flex-wrap gap-5">
                  <Button 
                    size="lg" 
                    className="h-14 px-10 bg-[#206070] hover:bg-[#1a4d5a] shadow-xl shadow-[#206070]/20 rounded-2xl font-bold text-lg transition-all group"
                    onClick={() => openBooking()}
                  >
                    Programează-te
                    <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="h-14 px-10 rounded-2xl border-slate-200 hover:bg-slate-50 font-bold text-lg text-slate-700"
                    onClick={() => document.getElementById("services")?.scrollIntoView({ behavior: "smooth" })}
                  >
                    Serviciile Noastre
                  </Button>
                </div>

                <div className="grid grid-cols-3 gap-8 pt-6 border-t border-slate-100">
                  {[
                    { label: "Pacienți Mulțumiți", val: loading ? "..." : `${stats.totalPatients}+`, color: "text-[#206070]" },
                    { label: "Medici Experți", val: loading ? "..." : `${stats.totalDoctors}`, color: "text-[#40A0D0]" },
                    { label: "Specialități", val: loading ? "..." : `${stats.totalDepartments}`, color: "text-indigo-600" },
                  ].map((s, idx) => (
                    <div key={idx} className="space-y-1">
                      <p className={`text-3xl font-black tracking-tight ${s.color}`}>{s.val}</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative animate-in fade-in zoom-in duration-1000 p-8">
                <div className="relative z-10 aspect-[4/5] rounded-[48px] overflow-hidden shadow-2xl shadow-slate-200 border-8 border-white">
                  <img
                    src="/modern-medical-clinic-reception-with-friendly-staf.jpg"
                    alt="PoliCare Medical Team"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                </div>
                
                {/* Floating elements */}
                <div className="absolute top-0 right-0 z-20 bg-white/90 backdrop-blur-lg p-6 rounded-[32px] shadow-2xl border border-white flex items-center gap-4 animate-bounce-slow">
                  <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Certificat ISO</p>
                    <p className="font-bold text-slate-900">Standarde Înalte</p>
                  </div>
                </div>

                <div className="absolute bottom-0 left-0 z-20 bg-white/90 backdrop-blur-lg p-6 rounded-[32px] shadow-2xl border border-white flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                    <Clock className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">Disponibilitate</p>
                    <p className="font-bold text-slate-900">Suport 24/7</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section id="services" className="py-32 bg-[#F8FAFC]">
          <div className="container mx-auto px-6">
            <Carousel
              opts={{
                align: "start",
                loop: true,
              }}
              className="w-full"
            >
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-20 text-center md:text-left">
                <div className="space-y-4">
                  <h3 className="text-[12px] font-black text-[#206070] uppercase tracking-[0.3em]">Specializările Noastre</h3>
                  <h2 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">O gamă completă de <br /> <span className="text-[#40A0D0]">servicii medicale</span></h2>
                </div>
                <div className="flex flex-col md:items-end gap-6">
                  <p className="text-lg text-slate-500 max-w-sm font-medium">
                    PoliCare oferă expertiză în peste {stats.totalDepartments} arii medicale, utilizând cele mai noi protocoale internaționale.
                  </p>
                  <div className="flex items-center gap-3">
                    <CarouselPrevious className="static translate-y-0 h-12 w-12 rounded-2xl border-slate-200 bg-white text-[#206070] hover:bg-[#206070] hover:text-white transition-all shadow-sm" />
                    <CarouselNext className="static translate-y-0 h-12 w-12 rounded-2xl border-slate-200 bg-white text-[#206070] hover:bg-[#206070] hover:text-white transition-all shadow-sm" />
                  </div>
                </div>
              </div>

              <CarouselContent className="-ml-4">
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <CarouselItem key={i} className="pl-4 basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                      <div className="h-64 bg-white rounded-3xl animate-pulse border border-slate-100" />
                    </CarouselItem>
                  ))
                ) : (
                  departments.map((dept) => {
                    const style = departmentStyles[dept.name] || departmentStyles.default
                    const Icon = style.icon
                    return (
                      <CarouselItem key={dept.id} className="pl-4 basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                        <div
                          className="group bg-white p-10 h-full rounded-[40px] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-[#206070]/5 transition-all duration-500 hover:-translate-y-2 relative overflow-hidden"
                        >
                          <div className={cn("absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 rounded-full blur-3xl opacity-0 group-hover:opacity-40 transition-opacity", style.bg)} />
                          
                          <div className={cn("w-16 h-16 rounded-[24px] flex items-center justify-center mb-10 transition-all duration-500 group-hover:rotate-6", style.bg)}>
                            <Icon className={cn("w-8 h-8", style.color)} />
                          </div>
                          
                          <h4 className="text-xl font-black italic text-slate-900 mb-4 group-hover:text-[#206070] transition-colors">{dept.name}</h4>
                          <p className="text-slate-500 text-sm leading-relaxed font-medium mb-8">
                            {dept.description || "Îngrijire specializată de top cu echipamente moderne."}
                          </p>
                          
                          <div
                            onClick={() => openBooking(dept.id)}
                            className="flex items-center text-xs font-black uppercase tracking-widest text-[#40A0D0] group-hover:gap-2 transition-all cursor-pointer"
                          >
                            Programează-te <ChevronRight className="w-4 h-4" />
                          </div>
                        </div>
                      </CarouselItem>
                    )
                  })
                )}
              </CarouselContent>
            </Carousel>
          </div>
        </section>

        {/* Why PoliCare */}
        <section id="about" className="py-32 bg-white relative overflow-hidden">
          <div className="container mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-20 items-center">
              <div className="order-2 lg:order-1 relative">
                <div className="aspect-square rounded-[64px] overflow-hidden shadow-2xl">
                  <img
                    src="/happy-patient-consultation-with-doctor.jpg"
                    alt="Doctor with patient"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-10 -right-10 bg-[#206070] text-white p-10 rounded-[40px] shadow-2xl hidden md:block">
                  <p className="text-5xl font-black mb-2">99%</p>
                  <p className="text-sm font-bold uppercase tracking-widest opacity-80">Rată Satisfacție</p>
                </div>
              </div>

              <div className="order-1 lg:order-2 space-y-12">
                <div className="space-y-4">
                  <h3 className="text-[12px] font-black text-[#40A0D0] uppercase tracking-[0.3em]">Criteriile Noastre</h3>
                  <h2 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight text-balance">
                    Standardul <span className="text-[#206070]">PoliCare</span> în sănătate.
                  </h2>
                </div>

                <div className="grid gap-8">
                  {[
                    { title: "Personal Vârf de Gamă", desc: "Medici cu acreditări internaționale și experiență vastă.", icon: Users, bg: "bg-blue-50", text: "text-blue-600" },
                    { title: "Tehnologie Nouă", desc: "Sisteme de diagnosticare și tratament de ultimă generație.", icon: Zap, bg: "bg-amber-50", text: "text-amber-600" },
                    { title: "Atenție la Detalii", desc: "Fiecare pacient beneficiază de un plan terapeutic personalizat.", icon: Heart, bg: "bg-rose-50", text: "text-rose-600" },
                  ].map((feat, i) => (
                    <div key={i} className="flex gap-6 items-start group p-6 rounded-3xl hover:bg-slate-50 transition-colors">
                      <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform", feat.bg)}>
                        <feat.icon className={cn("w-7 h-7", feat.text)} />
                      </div>
                      <div>
                        <h4 className="text-xl font-black italic uppercase italic text-slate-800 mb-2">{feat.title}</h4>
                        <p className="text-slate-500 font-medium leading-relaxed">{feat.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Action Banner */}
        <section className="py-20">
          <div className="container mx-auto px-6">
            <div className="bg-gradient-to-r from-[#206070] to-[#40A0D0] rounded-[48px] p-12 lg:p-24 relative overflow-hidden text-center lg:text-left flex flex-col lg:flex-row items-center justify-between gap-12 group">
              <div className="absolute top-0 right-0 w-96 h-96 bg-white shadow-sm opacity-10 rounded-full blur-3xl -mr-32 -mt-32 group-hover:scale-125 transition-transform duration-1000" />
              
              <div className="relative z-10 space-y-6">
                <h2 className="text-4xl lg:text-6xl font-black text-white tracking-tight">Pregătit pentru <br /> un control?</h2>
                <p className="text-blue-100 text-lg font-medium max-w-md">Sănătatea nu așteaptă. Programează-te online în mai puțin de 2 minute.</p>
              </div>

              <div className="relative z-10 flex flex-col sm:flex-row gap-6">
                <Button 
                  size="lg" 
                  className="h-16 px-12 bg-white text-[#206070] hover:bg-blue-50 rounded-2xl font-black text-xl shadow-2xl transition-all hover:scale-105 active:scale-95"
                  onClick={() => openBooking()}
                >
                  Programează Acum
                </Button>
                <a 
                  href="tel:+40123456789" 
                  className="flex items-center justify-center h-16 px-12 border-2 border-white/30 text-white rounded-2xl font-black text-xl hover:bg-white/10 transition-all"
                >
                  <Phone className="mr-3 h-6 w-6" />
                  Sună-ne
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-slate-900 pt-32 pb-16 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#206070] via-[#40A0D0] to-[#206070]" />
          
          <div className="container mx-auto px-6">
            <div className="grid lg:grid-cols-12 gap-16 mb-24">
              <div className="lg:col-span-4 space-y-8">
                <Logo size="lg" />
                <p className="text-slate-400 font-medium leading-relaxed text-lg">
                  Lideri în servicii medicale de specialitate, dedicați comunității noastre prin excelență clinică și empatie necondiționată.
                </p>
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 hover:bg-[#206070] hover:text-white transition-all cursor-pointer">
                    <Heart className="w-6 h-6" />
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 hover:bg-[#40A0D0] hover:text-white transition-all cursor-pointer">
                    <Star className="w-6 h-6" />
                  </div>
                </div>
              </div>

              <div className="lg:col-span-8 grid sm:grid-cols-3 gap-12">
                <div className="space-y-8">
                  <h4 className="text-lg font-black uppercase tracking-widest text-white">Servicii</h4>
                  <ul className="space-y-4 font-medium text-slate-400">
                    {[
                      "Cardiologie de top",
                      "Pediatrie preventivă",
                      "Oftalmologie avansată",
                      "ORL & Recuperare",
                    ].map((s) => (
                      <li key={s}>
                        <a
                          href="#services"
                          onClick={(e) => { e.preventDefault(); document.getElementById("services")?.scrollIntoView({ behavior: "smooth" }) }}
                          className="hover:text-white transition-colors cursor-pointer"
                        >
                          {s}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-8">
                  <h4 className="text-lg font-black uppercase tracking-widest text-white">Comunitate</h4>
                  <ul className="space-y-4 font-medium text-slate-400">
                    <li><a href="/echipa" className="hover:text-white transition-colors">Echipa Noastră</a></li>
                    <li><a href="/cariere" className="hover:text-white transition-colors">Cariere</a></li>
                    <li><a href="/programe-sociale" className="hover:text-white transition-colors">Programe Sociale</a></li>
                    <li><a href="/blog" className="hover:text-white transition-colors">Blog Medical</a></li>
                  </ul>
                </div>
                <div className="space-y-8" id="contact">
                  <h4 className="text-lg font-black uppercase tracking-widest text-white">Contact</h4>
                  <ul className="grid gap-6">
                    <li className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center shrink-0">
                        <Phone className="h-5 w-5 text-[#40A0D0]" />
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1">Apel rapid</p>
                        <p className="text-white font-bold">+40 123 456 789</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center shrink-0">
                        <Mail className="h-5 w-5 text-[#40A0D0]" />
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1">Scrie-ne la</p>
                        <p className="text-white font-bold">hello@policare.ro</p>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="pt-12 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-8 text-slate-500 font-bold text-sm tracking-wide">
              <p>&copy; 2025 POLICARE CLINIQUE. TOATE DREPTURILE REZERVATE.</p>
              <div className="flex gap-10">
                <a href="/termeni" className="hover:text-white transition-colors uppercase">Termeni</a>
                <a href="/confidentialitate" className="hover:text-white transition-colors uppercase">Confidențialitate</a>
                <a href="/cookies" className="hover:text-white transition-colors uppercase">Cookies</a>
              </div>
            </div>
          </div>
        </footer>

      {/* Booking Wizard Modal */}
      {showBooking && <BookingWizard onClose={() => { setShowBooking(false); setPreselectedDept(null) }} initialDepartmentId={preselectedDept} />}
    </div>
  )
}
