"use client"

import { useState } from "react"
import Link from "next/link"
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Eroare la trimiterea emailului")
      } else {
        setSent(true)
      }
    } catch {
      setError("Eroare de rețea. Încearcă din nou.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-6">
      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="mb-8">
          <Logo size="lg" />
        </div>

        {sent ? (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-10 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Email trimis!</h2>
            <p className="text-slate-500 text-sm leading-relaxed">
              Dacă există un cont asociat cu <strong className="text-slate-700">{email}</strong>,
              vei primi un email cu instrucțiuni de resetare a parolei în câteva minute.
            </p>
            <p className="text-xs text-slate-400">Linkul este valabil 1 oră. Verifică și folderul Spam.</p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm font-bold text-[#206070] hover:underline mt-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Înapoi la autentificare
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-10 space-y-8">
            <div className="space-y-2">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight italic">Ai uitat parola?</h2>
              <p className="text-slate-500 text-sm leading-relaxed">
                Introdu adresa de email și îți trimitem un link de resetare a parolei.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2 group">
                <Label htmlFor="email" className="text-xs font-black uppercase tracking-widest text-[#206070] opacity-70">
                  Adresă Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-[#206070] transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="nume@exemplu.ro"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="h-14 pl-12 bg-white border-slate-200 focus:border-[#206070] focus:ring-[#206070]/10 rounded-[20px] transition-all text-slate-900 font-medium"
                  />
                </div>
              </div>

              {error && (
                <div className="flex gap-3 p-4 bg-rose-50 border border-rose-100 rounded-2xl animate-in slide-in-from-top-2">
                  <div className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0 text-[10px] font-bold">!</div>
                  <p className="text-sm font-bold text-rose-600">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-14 bg-[#206070] hover:bg-[#1a4d5a] text-white font-black rounded-[20px] shadow-xl shadow-[#206070]/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Se trimite...
                  </span>
                ) : (
                  "Trimite link de resetare"
                )}
              </Button>
            </form>

            <Link
              href="/login"
              className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[#206070] transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Înapoi la autentificare
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
