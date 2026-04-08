"use client"

import { Logo } from "@/components/logo"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function TermeniPage() {
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
          <h1 className="text-3xl font-black text-slate-900">Termeni și Condiții</h1>
          <p className="text-slate-500 mt-2 text-sm">Ultima actualizare: Aprilie 2026</p>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-6 max-w-3xl prose prose-slate prose-sm">
          <div className="bg-white rounded-2xl border border-slate-100 p-8 space-y-8 text-slate-600 text-sm leading-relaxed">
            <div>
              <h2 className="text-lg font-black text-slate-900 mb-3">1. Acceptarea termenilor</h2>
              <p>Prin utilizarea platformei PoliCare și a serviciilor asociate, acceptați în mod expres toți termenii și condițiile prezentului acord. Dacă nu sunteți de acord cu oricare dintre acești termeni, vă rugăm să nu utilizați serviciile noastre.</p>
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 mb-3">2. Descrierea serviciilor</h2>
              <p>PoliCare oferă o platformă de programare online la servicii medicale, facilitate de o rețea de medici specialiști. Platforma nu oferă consultații medicale de urgență — în caz de urgență, apelați 112.</p>
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 mb-3">3. Programări și anulări</h2>
              <p>Programările efectuate prin platformă sunt confirmate prin email. Anularea trebuie realizată cu minimum 24 de ore înainte de ora programată. Neprezentarea repetată poate duce la restricționarea accesului la platformă.</p>
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 mb-3">4. Răspundere</h2>
              <p>PoliCare acționează ca intermediar între pacienți și medicii parteneri. Responsabilitatea actului medical revine în totalitate medicului prestator. PoliCare nu este responsabilă pentru diagnostice, tratamente sau complicații medicale.</p>
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 mb-3">5. Modificarea termenilor</h2>
              <p>Ne rezervăm dreptul de a modifica acești termeni în orice moment. Modificările intră în vigoare la publicarea pe platformă. Continuarea utilizării serviciilor după modificare reprezintă acceptarea noilor termeni.</p>
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 mb-3">6. Contact</h2>
              <p>Pentru orice întrebări legate de acești termeni, ne puteți contacta la <a href="mailto:legal@policare.ro" className="text-[#206070] font-bold">legal@policare.ro</a>.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
