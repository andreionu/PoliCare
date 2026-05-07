"use client"

import { motion } from "framer-motion"
import { useEffect, useState } from "react"

export function Preloader() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const steps = [
      { from: 0, target: 35, delay: 0, duration: 400 },
      { from: 35, target: 65, delay: 400, duration: 350 },
      { from: 65, target: 85, delay: 750, duration: 300 },
      { from: 85, target: 100, delay: 1050, duration: 250 },
    ]
    const timers: ReturnType<typeof setTimeout>[] = []
    steps.forEach(({ from, target, delay, duration }) => {
      timers.push(
        setTimeout(() => {
          const start = Date.now()
          const tick = () => {
            const elapsed = Date.now() - start
            const p = Math.min(elapsed / duration, 1)
            const eased = 1 - Math.pow(1 - p, 3)
            setProgress(Math.round(from + (target - from) * eased))
            if (p < 1) requestAnimationFrame(tick)
          }
          requestAnimationFrame(tick)
        }, delay)
      )
    })
    return () => timers.forEach(clearTimeout)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.02 }}
      transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
      style={{ background: "linear-gradient(135deg, #0a1628 0%, #0d2137 40%, #0f2d3a 70%, #0a1628 100%)" }}
    >
      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: "linear-gradient(#40A0D0 1px, transparent 1px), linear-gradient(90deg, #40A0D0 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Radial glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="w-[600px] h-[600px] rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #206070 0%, transparent 70%)" }}
        />
      </div>

      {/* Floating orbs */}
      <motion.div
        className="absolute w-72 h-72 rounded-full opacity-10 blur-3xl"
        style={{ background: "#40A0D0", top: "15%", right: "20%" }}
        animate={{ y: [0, -30, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute w-56 h-56 rounded-full opacity-8 blur-3xl"
        style={{ background: "#206070", bottom: "20%", left: "15%" }}
        animate={{ y: [0, 25, 0], scale: [1, 1.15, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-12">

        {/* Logo area */}
        <motion.div
          className="flex flex-col items-center gap-6"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
        >
          {/* Animated ring + logo */}
          <div className="relative flex items-center justify-center">
            {/* Outer spinning ring */}
            <motion.div
              className="absolute w-32 h-32 rounded-full"
              style={{
                border: "1.5px solid transparent",
                backgroundImage: "linear-gradient(#0a1628, #0a1628), conic-gradient(from 0deg, #40A0D0, #206070, transparent 60%)",
                backgroundOrigin: "border-box",
                backgroundClip: "padding-box, border-box",
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
            />
            {/* Inner pulse ring */}
            <motion.div
              className="absolute w-24 h-24 rounded-full"
              style={{ border: "1px solid #206070" }}
              animate={{ scale: [1, 1.08, 1], opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
            {/* Logo icon */}
            <div className="w-16 h-16 relative z-10">
              <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-lg">
                <circle cx="50" cy="50" r="40" stroke="#40A0D0" strokeWidth="10" fill="none" strokeOpacity="0.9" />
                <path d="M42 30V70 M42 30H58C68 30 68 45 58 45H42" stroke="#40A0D0" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          {/* Wordmark */}
          <div className="flex flex-col items-center gap-1">
            <div className="text-4xl font-black tracking-tight">
              <span className="text-white/90">Poli</span>
              <span style={{ color: "#40A0D0" }}>Care</span>
            </div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/30">
              Sistem Administrativ
            </div>
          </div>
        </motion.div>

        {/* Progress section */}
        <motion.div
          className="flex flex-col items-center gap-4 w-64"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          {/* Status text */}
          <div className="flex items-center gap-2">
            <motion.div
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: "#40A0D0" }}
              animate={{ opacity: [1, 0.2, 1] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
            />
            <span className="text-[11px] font-medium tracking-widest uppercase text-white/40">
              {progress < 40 ? "Inițializare" : progress < 75 ? "Încărcare Date" : progress < 100 ? "Pregătire UI" : "Gata"}
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-[2px] rounded-full bg-white/10 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{
                background: "linear-gradient(90deg, #206070, #40A0D0)",
                width: `${progress}%`,
                boxShadow: "0 0 12px #40A0D0aa",
              }}
              transition={{ ease: "easeOut" }}
            />
          </div>

          {/* Percentage */}
          <span className="text-[11px] font-bold tabular-nums" style={{ color: "#40A0D0" }}>
            {progress}%
          </span>
        </motion.div>
      </div>

      {/* Bottom branding */}
      <motion.div
        className="absolute bottom-8 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.6 }}
      >
        <p className="text-[10px] font-medium tracking-widest uppercase text-white/20">
          © {new Date().getFullYear()} PoliCare · Toate drepturile rezervate
        </p>
      </motion.div>
    </motion.div>
  )
}
