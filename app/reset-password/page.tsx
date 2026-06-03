"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Lock, Eye, EyeOff, Loader2, CheckCircle2, ArrowLeft } from "lucide-react"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token") ?? ""

  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!token) setError("Link invalid. Solicită un nou email de resetare.")
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password.length < 8) {
      setError("Parola trebuie să aibă cel puțin 8 caractere.")
      return
    }
    if (password !== confirm) {
      setError("Parolele nu coincid.")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Eroare la resetarea parolei.")
      } else {
        setDone(true)
        setTimeout(() => router.push("/login"), 3000)
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

        {done ? (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-10 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Parolă actualizată!</h2>
            <p className="text-slate-500 text-sm leading-relaxed">
              Parola ta a fost resetată cu succes. Vei fi redirecționat la pagina de autentificare.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm font-bold text-[#206070] hover:underline"
            >
              <ArrowLeft className="h-4 w-4" />
              Mergi la autentificare
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-10 space-y-8">
            <div className="space-y-2">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight italic">Parolă nouă</h2>
              <p className="text-slate-500 text-sm">Alege o parolă sigură pentru contul tău.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2 group">
                <Label htmlFor="password" className="text-xs font-black uppercase tracking-widest text-[#206070] opacity-70">
                  Parolă nouă
                </Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-[#206070] transition-colors" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Minimum 8 caractere"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading || !token}
                    className="h-14 pl-12 pr-12 bg-white border-slate-200 focus:border-[#206070] focus:ring-[#206070]/10 rounded-[20px] transition-all text-slate-900 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#206070] transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2 group">
                <Label htmlFor="confirm" className="text-xs font-black uppercase tracking-widest text-[#206070] opacity-70">
                  Confirmă parola
                </Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-[#206070] transition-colors" />
                  <Input
                    id="confirm"
                    type={showConfirm ? "text" : "password"}
                    placeholder="Repetă parola"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    disabled={loading || !token}
                    className="h-14 pl-12 pr-12 bg-white border-slate-200 focus:border-[#206070] focus:ring-[#206070]/10 rounded-[20px] transition-all text-slate-900 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#206070] transition-colors"
                  >
                    {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
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
                disabled={loading || !token}
                className="w-full h-14 bg-[#206070] hover:bg-[#1a4d5a] text-white font-black rounded-[20px] shadow-xl shadow-[#206070]/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Se salvează...
                  </span>
                ) : (
                  "Salvează parola nouă"
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

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  )
}
