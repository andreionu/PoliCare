"use client"

import { Logo } from "@/components/logo"
import { ArrowLeft, Clock, ChevronRight } from "lucide-react"
import Link from "next/link"

const articles = [
  {
    tag: "Cardiologie",
    title: "Cum să îți menții inima sănătoasă după 40 de ani",
    excerpt: "Factorii de risc cardiovascular cresc după vârsta de 40 de ani. Iată ce poți face preventiv pentru a-ți proteja inima pe termen lung.",
    date: "20 Martie 2026",
    readTime: "5 min",
    color: "bg-rose-50 text-rose-600",
  },
  {
    tag: "Pediatrie",
    title: "Schema de vaccinare 2026 pentru copii — ce trebuie să știi",
    excerpt: "Ministerul Sănătății a actualizat schema națională de vaccinare. Află ce vaccinuri sunt recomandate și la ce vârstă.",
    date: "14 Martie 2026",
    readTime: "4 min",
    color: "bg-purple-50 text-purple-600",
  },
  {
    tag: "Oftalmologie",
    title: "Sindromul ochiului uscat — cauze, simptome și tratament",
    excerpt: "Munca prelungită în fața ecranelor afectează tot mai mulți adulți. Descoperă cum să recunoști și să tratezi ochiul uscat.",
    date: "5 Martie 2026",
    readTime: "6 min",
    color: "bg-blue-50 text-blue-600",
  },
  {
    tag: "Dermatologie",
    title: "Protecția solară — de ce SPF 50 nu e exagerat",
    excerpt: "Radiațiile UV sunt principala cauză a îmbătrânirii premature a pielii și a cancerului cutanat. Un dermatolog PoliCare explică.",
    date: "25 Februarie 2026",
    readTime: "3 min",
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    tag: "General",
    title: "Analizele de sânge de rutină — ce presupun și cât de des le faci",
    excerpt: "Hemoleucograma, glicemia, colesterolul — cum interpretezi rezultatele și de ce contează controalele anuale.",
    date: "10 Februarie 2026",
    readTime: "7 min",
    color: "bg-amber-50 text-amber-600",
  },
  {
    tag: "ORL",
    title: "Sinuzita cronică: cum o deosebești de o răceală obișnuită",
    excerpt: "Durerea de cap, congestia nazală și presiunea facială pot fi semne ale sinuzitei. Află când e momentul să consulți un specialist.",
    date: "1 Februarie 2026",
    readTime: "5 min",
    color: "bg-cyan-50 text-cyan-600",
  },
]

export default function BlogPage() {
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

      <section className="bg-white border-b py-16">
        <div className="container mx-auto px-6 text-center space-y-4">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#206070]">Sănătate & Informare</p>
          <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
            Blog <span className="text-[#40A0D0]">Medical</span>
          </h1>
          <p className="text-lg text-slate-500 max-w-xl mx-auto font-medium">
            Articole scrise de medicii PoliCare pentru a te menține informat și sănătos.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((a) => (
              <div key={a.title} className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
                <div className={`h-2 w-full ${a.color.split(" ")[0]}`} />
                <div className="p-6 flex flex-col flex-1">
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full self-start mb-3 ${a.color}`}>
                    {a.tag}
                  </span>
                  <h3 className="font-black text-slate-900 leading-snug mb-3">{a.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed flex-1">{a.excerpt}</p>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-50">
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <Clock className="w-3 h-3" /> {a.readTime} · {a.date}
                    </span>
                    <span className="text-xs font-black text-[#206070] flex items-center gap-0.5 cursor-default">
                      Citește <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p className="text-center text-sm text-slate-400 mt-12">
            Articole noi în curând. Urmărește-ne pentru actualizări.
          </p>
        </div>
      </section>
    </div>
  )
}
