"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { BookingWizard } from "@/components/booking-wizard"
import { Calendar, Heart, Clock, Users, Star, Phone, Mail, MapPin } from "lucide-react"

export default function LandingPage() {
  const [showBooking, setShowBooking] = useState(false)

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
    <>
      <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-50">
        {/* Header */}
        <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-40">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <span className="font-bold text-xl">PoliCare</span>
            </div>
            <nav className="hidden md:flex items-center gap-6">
              <a href="#services" className="text-sm font-medium hover:text-primary transition-colors">
                Servicii
              </a>
              <a href="#about" className="text-sm font-medium hover:text-primary transition-colors">
                Despre Noi
              </a>
              <a href="#contact" className="text-sm font-medium hover:text-primary transition-colors">
                Contact
              </a>
            </nav>
          </div>
        </header>

        {/* Hero Section */}
        <section className="container mx-auto px-4 py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-block px-4 py-2 bg-blue-100 text-primary rounded-full text-sm font-medium">
                Îngrijire medicală de încredere
              </div>
              <h1 className="text-4xl lg:text-6xl font-bold leading-tight text-balance">
                Sănătatea ta este prioritatea noastră
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed text-pretty">
                Programează-te rapid și simplu la cei mai buni specialiști medicali. Echipa noastră de doctori
                experimentați este aici pentru tine.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" className="text-lg h-12 px-8" onClick={() => setShowBooking(true)}>
                  <Calendar className="mr-2 h-5 w-5" />
                  Programează-te Acum
                </Button>
                <Button size="lg" variant="outline" className="text-lg h-12 px-8 bg-transparent">
                  <Phone className="mr-2 h-5 w-5" />
                  Sună-ne
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 pt-8">
                <div className="space-y-1">
                  <div className="text-3xl font-bold text-primary">15K+</div>
                  <div className="text-sm text-muted-foreground">Pacienți</div>
                </div>
                <div className="space-y-1">
                  <div className="text-3xl font-bold text-primary">50+</div>
                  <div className="text-sm text-muted-foreground">Medici</div>
                </div>
                <div className="space-y-1">
                  <div className="text-3xl font-bold text-primary">98%</div>
                  <div className="text-sm text-muted-foreground">Satisfacție</div>
                </div>
              </div>
            </div>

            {/* Hero Image */}
            <div className="relative">
              <div className="aspect-square rounded-3xl overflow-hidden bg-gradient-to-br from-blue-100 to-blue-200">
                <img src="/modern-medical-clinic-reception-with-friendly-staf.jpg" alt="Medical Clinic" className="w-full h-full object-cover" />
              </div>
              {/* Floating Card */}
              <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-xl p-4 flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <div className="font-bold">24/7 Disponibili</div>
                  <div className="text-sm text-muted-foreground">Suport medical</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section id="services" className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">Serviciile Noastre</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Oferim o gamă completă de servicii medicale de specialitate
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: Heart, name: "Cardiologie", desc: "Îngrijire cardiacă avansată" },
                { icon: Users, name: "Pediatrie", desc: "Grija pentru copiii tăi" },
                { icon: Calendar, name: "ORL", desc: "Specialiști urechi, nas, gât" },
                { icon: Star, name: "Oftalmologie", desc: "Sănătatea ochilor" },
                { icon: Clock, name: "Dermatologie", desc: "Îngrijirea pielii" },
                { icon: Heart, name: "Medicina Generală", desc: "Consultații complete" },
              ].map((service, i) => (
                <div
                  key={i}
                  className="group p-6 rounded-2xl border hover:border-primary hover:shadow-lg transition-all duration-300"
                >
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary group-hover:scale-110 transition-all duration-300">
                    <service.icon className="w-6 h-6 text-primary group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{service.name}</h3>
                  <p className="text-muted-foreground">{service.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <h2 className="text-3xl lg:text-4xl font-bold">De ce să ne alegi?</h2>
                <div className="space-y-4">
                  {[
                    {
                      icon: Users,
                      title: "Echipă Experimentată",
                      desc: "Medici cu ani de experiență și formare continuă",
                    },
                    { icon: Clock, title: "Programare Rapidă", desc: "Sistem de booking online simplu și eficient" },
                    {
                      icon: Heart,
                      title: "Îngrijire Personalizată",
                      desc: "Abordare individualizată pentru fiecare pacient",
                    },
                    { icon: Star, title: "Echipament Modern", desc: "Tehnologie medicală de ultimă generație" },
                  ].map((item, i) => (
                    <div key={i} className="flex gap-4 p-4 rounded-xl hover:bg-blue-50 transition-colors">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                        <item.icon className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">{item.title}</h3>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="aspect-square rounded-3xl overflow-hidden bg-gradient-to-br from-blue-100 to-blue-200">
                <img src="/happy-patient-consultation-with-doctor.jpg" alt="Patient Care" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">Contactează-ne</h2>
              <p className="text-lg text-muted-foreground">Suntem aici să te ajutăm</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center p-6">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Telefon</h3>
                <p className="text-muted-foreground">+40 123 456 789</p>
              </div>
              <div className="text-center p-6">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Email</h3>
                <p className="text-muted-foreground">contact@policare.ro</p>
              </div>
              <div className="text-center p-6">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Adresă</h3>
                <p className="text-muted-foreground">Str. Sănătății 123, București</p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-slate-900 text-white py-12">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-4 gap-8 mb-8">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                    <Heart className="w-5 h-5 text-primary" />
                  </div>
                  <span className="font-bold text-lg">PoliCare</span>
                </div>
                <p className="text-slate-400 text-sm">Îngrijire medicală de calitate pentru toată familia.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Servicii</h4>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li>Cardiologie</li>
                  <li>Pediatrie</li>
                  <li>ORL</li>
                  <li>Oftalmologie</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Informații</h4>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li>Despre Noi</li>
                  <li>Contact</li>
                  <li>Cariere</li>
                  <li>Blog</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Program</h4>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li>Luni - Vineri: 8:00 - 20:00</li>
                  <li>Sâmbătă: 9:00 - 16:00</li>
                  <li>Duminică: Închis</li>
                </ul>
              </div>
            </div>
            <div className="border-t border-slate-800 pt-8 text-center text-sm text-slate-400">
              <p>&copy; 2025 PoliCare. Toate drepturile rezervate.</p>
            </div>
          </div>
        </footer>
      </div>

      {/* Booking Wizard Modal */}
      {showBooking && <BookingWizard onClose={() => setShowBooking(false)} />}
    </>
  )
}
