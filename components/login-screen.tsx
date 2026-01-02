"use client"

import type React from "react"

import { useState } from "react"
import { Activity, Eye, EyeOff, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

interface LoginScreenProps {
  onLogin: () => void
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const { toast } = useToast()

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
      setError(`Too many failed attempts. Please try again in ${remainingMinutes} minute(s).`)
      toast({
        title: "Cont blocat",
        description: `Prea multe încercări eșuate. Încearcă din nou în ${remainingMinutes} minut(e).`,
        variant: "destructive",
      })
      return
    }

    const sanitizedEmail = email.trim().toLowerCase()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!emailRegex.test(sanitizedEmail)) {
      setError("Please enter a valid email address")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    setIsLoading(true)

    setTimeout(() => {
      if (sanitizedEmail === "admin@policare.ro" && password === "admin123") {
        setLoginAttempts(0)
        setLockoutTime(null)
        toast({
          title: "Autentificare reușită",
          description: "Bine ai venit în panoul de administrare PoliCare!",
        })
        onLogin()
      } else {
        const newAttempts = loginAttempts + 1
        setLoginAttempts(newAttempts)

        if (newAttempts >= 5) {
          const lockout = Date.now() + 5 * 60 * 1000
          setLockoutTime(lockout)
          setError("Too many failed attempts. Account locked for 5 minutes.")
          toast({
            title: "Cont blocat",
            description: "Prea multe încercări eșuate. Contul a fost blocat pentru 5 minute.",
            variant: "destructive",
          })
        } else {
          setError(`Invalid credentials. ${5 - newAttempts} attempt(s) remaining.`)
        }
        setIsLoading(false)
      }
    }, 1000)
  }

  const isLocked = lockoutTime !== null && Date.now() < lockoutTime

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-accent/20 to-background p-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground mb-4 shadow-lg">
            <Activity className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold text-balance">PoliCare Admin</h1>
          <p className="text-muted-foreground mt-2">Sign in to access your dashboard</p>
        </div>

        {/* Login Card */}
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle>Welcome back</CardTitle>
            <CardDescription>Enter your credentials to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@policare.ro"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading || isLocked}
                  autoComplete="email"
                  maxLength={254}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading || isLocked}
                    autoComplete="current-password"
                    maxLength={128}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    disabled={isLoading || isLocked}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isLoading || isLocked}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : isLocked ? (
                  "Account Locked"
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2 font-medium">Demo Credentials:</p>
              <p className="text-xs text-muted-foreground">Email: admin@policare.ro</p>
              <p className="text-xs text-muted-foreground">Password: admin123</p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Secure access to medical records and patient data
        </p>
      </div>
    </div>
  )
}
