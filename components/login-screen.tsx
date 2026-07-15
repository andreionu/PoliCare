"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { signIn, getSession } from "next-auth/react"
import { Eye, EyeOff, Loader2, ShieldCheck, Mail, Lock, ArrowRight, ArrowLeft } from "lucide-react"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

async function getSessionRole(retries = 5, delayMs = 100) {
  for (let attempt = 0; attempt < retries; attempt++) {
    const session = await getSession()
    const role = session?.user?.role
    if (role) return role
    await new Promise((resolve) => setTimeout(resolve, delayMs))
  }

  return null
}

export function LoginScreen() {
  const { toast } = useToast()
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [loginAttempts, setLoginAttempts] = useState(0)
  const [lockoutTime, setLockoutTime] = useState<number | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (lockoutTime && Date.now() < lockoutTime) {
      const remainingMinutes = Math.ceil((lockoutTime - Date.now()) / 60000)
      setError(`Prea multe încercări. Încearcă din nou în ${remainingMinutes} minut(e).`)
      return
    }

    const sanitizedEmail = email.trim().toLowerCase()
    setIsLoading(true)

    const result = await signIn("credentials", {
      email: sanitizedEmail,
      password,
      surface: "staff",
      redirect: false,
    })

    if (result?.error) {
      const newAttempts = loginAttempts + 1
      setLoginAttempts(newAttempts)

      if (newAttempts >= 5) {
        const lockout = Date.now() + 5 * 60 * 1000
        setLockoutTime(lockout)
        setError("Cont blocat temporar. Prea multe încercări eșuate.")
      } else {
        setError(result.error === "CredentialsSignin" ? `Date de acces invalide. ${5 - newAttempts} încercări rămase.` : result.error)
      }
      setIsLoading(false)
    } else {
      const role = await getSessionRole()

      toast({
        title: "Autentificare reușită",
        description: "Bine ai venit în PoliCare!",
      })

      if (role === "DOCTOR") router.push("/doctor/dashboard")
      else if (role === "PATIENT") router.push("/patient/dashboard")
      else router.push("/admin")
    }
  }

  const isLocked = !!(lockoutTime && Date.now() < lockoutTime)

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-white overflow-hidden">
      {/* Left Panel: Hero Image & Branding */}
      <div className="relative hidden lg:flex flex-col justify-between p-16 overflow-hidden bg-slate-900 text-white">
        <div className="absolute inset-0 z-0">
          <img 
            src="/modern-medical-clinic-reception-with-friendly-staf.jpg" 
            alt="PoliCare Hero" 
            className="w-full h-full object-cover opacity-60 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-[#206070] via-[#206070]/40 to-transparent" />
        </div>

        <div className="relative z-10">
          <Logo size="xl" className="text-white" />
          <div className="mt-20 max-w-lg space-y-6 animate-in slide-in-from-left-8 duration-700">
            <h1 className="text-6xl font-black leading-[1.1] tracking-tight">
              Excelență <br />
              Digitală în <br />
              <span className="text-[#40A0D0]">Sănătate</span>.
            </h1>
            <p className="text-xl text-blue-50/80 font-medium leading-relaxed">
              Platforma inteligentă de management medical care simplifică interacțiunea dintre medic și pacient.
            </p>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-12 text-blue-50/60 font-bold text-sm tracking-widest uppercase">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5" />
            Standard ISO 27001
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Sistem Stabil
          </div>
        </div>
      </div>

      {/* Right Panel: Login Form */}
      <div className="flex items-center justify-center p-8 lg:p-24 bg-[#F8FAFC]">
        <div className="w-full max-w-md space-y-10 animate-in fade-in slide-in-from-right-8 duration-700">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-[#206070] font-semibold transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Pagina principală
          </Link>

          <div className="space-y-4">
            <div className="lg:hidden mb-8">
              <Logo size="lg" />
            </div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tight italic">Autentificare</h2>
            <p className="text-lg text-slate-500 font-medium">Bine ai venit la <span className="text-[#206070] font-bold">PoliCare Management</span></p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2 group">
              <Label htmlFor="email" className="text-xs font-black uppercase tracking-widest text-[#206070] ml-1 opacity-70">Adresă Email</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-[#206070] transition-colors" />
                <Input
                  id="email"
                  type="email"
                  placeholder="nume@policare.ro"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading || isLocked}
                  className="h-14 pl-12 bg-white border-slate-200 focus:border-[#206070] focus:ring-[#206070]/10 rounded-[20px] transition-all text-slate-900 font-medium"
                />
              </div>
            </div>

            <div className="space-y-2 group">
              <div className="flex items-center justify-between ml-1">
                <Label htmlFor="password" className="text-xs font-black uppercase tracking-widest text-[#206070] opacity-70">Parolă</Label>
                <Link href="/forgot-password" className="text-xs text-[#40A0D0] hover:text-[#206070] font-bold transition-colors">Ai uitat parola?</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-[#206070] transition-colors" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading || isLocked}
                  className="h-14 pl-12 pr-12 bg-white border-slate-200 focus:border-[#206070] focus:ring-[#206070]/10 rounded-[20px] transition-all text-slate-900 font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#206070] transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex gap-3 p-4 bg-rose-50 border border-rose-100 rounded-2xl animate-in slide-in-from-top-2">
                <div className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0 text-[10px] font-bold">!</div>
                <p className="text-sm font-bold text-rose-600">{error}</p>
              </div>
            )}

            <p className="text-center text-sm text-slate-500">
              Ești pacient?{" "}
              <Link href="/" className="text-[#206070] font-bold hover:underline">
                Autentifică-te de pe pagina principală
              </Link>
            </p>

            <Button
              type="submit"
              className="w-full h-14 bg-[#206070] hover:bg-[#1a4d5a] text-white font-black rounded-[20px] shadow-xl shadow-[#206070]/20 transition-all hover:scale-[1.02] active:scale-[0.98] group"
              disabled={isLoading || isLocked}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Se procesează...</span>
                </div>
              ) : (
                <span className="flex items-center gap-2">
                  Conectare <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </Button>
          </form>

          <div className="pt-10 border-t border-slate-100">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 text-center">Conturi Demonstrative</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {setEmail("admin@policare.ro"); setPassword("admin123")}}
                className="flex flex-col items-start p-4 rounded-[20px] bg-white border border-slate-100 hover:border-[#206070]/30 hover:shadow-lg hover:shadow-[#206070]/5 transition-all"
              >
                <div className="px-2.5 py-1 rounded-full bg-[#206070]/10 text-[#206070] text-[9px] font-black uppercase tracking-widest mb-2">Administrator</div>
                <div className="text-xs font-bold text-slate-800">admin@policare.ro</div>
                <div className="text-[10px] text-slate-400 font-medium">admin123</div>
              </button>

              <button
                onClick={() => {setEmail("receptie@policare.ro"); setPassword("receptie123")}}
                className="flex flex-col items-start p-4 rounded-[20px] bg-white border border-slate-100 hover:border-[#40A0D0]/30 hover:shadow-lg hover:shadow-[#40A0D0]/5 transition-all"
              >
                <div className="px-2.5 py-1 rounded-full bg-[#40A0D0]/10 text-[#40A0D0] text-[9px] font-black uppercase tracking-widest mb-2">Recepție</div>
                <div className="text-xs font-bold text-slate-800">receptie@policare.ro</div>
                <div className="text-[10px] text-slate-400 font-medium">receptie123</div>
              </button>

              <button
                onClick={() => {setEmail("demo.doctor@policare.ro"); setPassword("Demo2026!")}}
                className="flex flex-col items-start p-4 rounded-[20px] bg-white border border-slate-100 hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-500/5 transition-all"
              >
                <div className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[9px] font-black uppercase tracking-widest mb-2">Medic</div>
                <div className="text-xs font-bold text-slate-800">demo.doctor@policare.ro</div>
                <div className="text-[10px] text-slate-400 font-medium">Demo2026!</div>
              </button>

              <button
                onClick={() => {setEmail("marketing@policare.ro"); setPassword("Demo2026!")}}
                className="flex flex-col items-start p-4 rounded-[20px] bg-white border border-slate-100 hover:border-pink-300 hover:shadow-lg hover:shadow-pink-500/5 transition-all"
              >
                <div className="px-2.5 py-1 rounded-full bg-pink-50 text-pink-700 text-[9px] font-black uppercase tracking-widest mb-2">Marketing</div>
                <div className="text-xs font-bold text-slate-800">marketing@policare.ro</div>
                <div className="text-[10px] text-slate-400 font-medium">Demo2026!</div>
              </button>

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
