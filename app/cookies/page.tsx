"use client"

import { Logo } from "@/components/logo"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

const cookieTypes = [
  {
    name: "Cookie-uri esențiale",
    required: true,
    desc: "Necesare pentru funcționarea de bază a platformei (sesiune, autentificare). Nu pot fi dezactivate.",
    examples: "session_token, csrf_token",
  },
  {
    name: "Cookie-uri de preferințe",
    required: false,
    desc: "Memorează preferințele utilizatorului (limbă, setări de afișare) pentru o experiență personalizată.",
    examples: "user_prefs, locale",
  },
  {
    name: "Cookie-uri analitice",
    required: false,
    desc: "Ne ajută să înțelegem cum este utilizată platforma, pentru a o îmbunătăți continuu. Datele sunt anonimizate.",
    examples: "analytics_id, page_views",
  },
]

export default function CookiesPage() {
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

      <section className="bg-white border-b py-12">
        <div className="container mx-auto px-6">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#206070] mb-2">Legal</p>
          <h1 className="text-3xl font-black text-slate-900">Politica de Cookies</h1>
          <p className="text-slate-500 mt-2 text-sm">Ultima actualizare: Aprilie 2026</p>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-6 max-w-3xl space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 p-8 text-slate-600 text-sm leading-relaxed space-y-4">
            <h2 className="text-lg font-black text-slate-900">Ce sunt cookie-urile?</h2>
            <p>Cookie-urile sunt fișiere text mici stocate în browserul dvs. atunci când vizitați un site web. Ele ajută site-ul să vă recunoască la vizitele ulterioare și să ofere funcționalități personalizate.</p>
            <p>PoliCare utilizează cookie-uri strict necesare funcționării platformei și, cu acordul dvs., cookie-uri pentru îmbunătățirea experienței.</p>
          </div>

          <div className="space-y-4">
            {cookieTypes.map((ct) => (
              <div key={ct.name} className="bg-white rounded-2xl border border-slate-100 p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-black text-slate-900">{ct.name}</h3>
                  <span className={`text-[10px] font-black px-2 py-1 rounded-full ${ct.required ? "bg-[#206070]/10 text-[#206070]" : "bg-slate-100 text-slate-500"}`}>
                    {ct.required ? "Obligatorii" : "Opționale"}
                  </span>
                </div>
                <p className="text-sm text-slate-500 mb-2">{ct.desc}</p>
                <p className="text-xs text-slate-400 font-mono">{ct.examples}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-6 text-sm text-slate-600">
            <h3 className="font-black text-slate-900 mb-2">Controlul cookie-urilor</h3>
            <p>Puteți controla și/sau șterge cookie-urile din setările browserului dvs. Dezactivarea anumitor cookie-uri poate afecta funcționalitatea platformei. Pentru mai multe informații, consultați <a href="/confidentialitate" className="text-[#206070] font-bold hover:underline">Politica de Confidențialitate</a>.</p>
          </div>
        </div>
      </section>
    </div>
  )
}
