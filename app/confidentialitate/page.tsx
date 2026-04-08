"use client"

import { Logo } from "@/components/logo"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function ConfidentialitatePage() {
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
          <h1 className="text-3xl font-black text-slate-900">Politica de Confidențialitate</h1>
          <p className="text-slate-500 mt-2 text-sm">Ultima actualizare: Aprilie 2026</p>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-6 max-w-3xl">
          <div className="bg-white rounded-2xl border border-slate-100 p-8 space-y-8 text-slate-600 text-sm leading-relaxed">
            <div>
              <h2 className="text-lg font-black text-slate-900 mb-3">1. Date colectate</h2>
              <p>Colectăm datele furnizate de dvs. la momentul programării: nume, număr de telefon, adresă de email. De asemenea, înregistrăm istoricul programărilor și comunicările realizate prin platformă.</p>
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 mb-3">2. Scopul prelucrării</h2>
              <p>Datele sunt utilizate exclusiv pentru: gestionarea programărilor, trimiterea de notificări legate de programări (confirmare, reminder, anulare) și îmbunătățirea calității serviciilor. Nu utilizăm datele în scop de marketing fără acordul explicit al pacientului.</p>
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 mb-3">3. Temeiul legal (GDPR)</h2>
              <p>Prelucrăm datele cu caracter personal în baza art. 6 alin. (1) lit. b) din Regulamentul (UE) 2016/679 (GDPR) — executarea unui contract la care persoana vizată este parte — și, după caz, în baza consimțământului explicit.</p>
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 mb-3">4. Partajarea datelor</h2>
              <p>Nu vindem și nu cedăm datele dvs. unor terțe părți în scop comercial. Datele pot fi partajate cu medicii parteneri exclusiv în scopul furnizării serviciilor medicale. Utilizăm furnizori de servicii (email, SMS) care respectă standardele GDPR.</p>
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 mb-3">5. Drepturile dvs.</h2>
              <p>Aveți dreptul la: acces la datele personale, rectificarea datelor incorecte, ștergerea datelor (dreptul de a fi uitat), restricționarea prelucrării și portabilitatea datelor. Pentru exercitarea acestor drepturi, contactați-ne la <a href="mailto:gdpr@policare.ro" className="text-[#206070] font-bold">gdpr@policare.ro</a>.</p>
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 mb-3">6. Retenția datelor</h2>
              <p>Datele sunt păstrate pe durata relației contractuale și ulterior conform obligațiilor legale (ex. documente medicale — minim 10 ani conform legislației române). La cerere, datele non-medicale pot fi șterse mai devreme.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
