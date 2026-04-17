import { Logo } from "./logo"
import { motion } from "framer-motion"

export function Preloader() {
  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900 overflow-hidden"
    >
      {/* Decorative pulse background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] animate-pulse" />
      
      <div className="flex flex-col items-center gap-8 relative z-10 scale-110">
        <Logo iconOnly size="lg" className="animate-bounce" />
        
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black text-white/20 tracking-tighter uppercase italic">Incarcare Sistem</span>
          </div>
          <div className="flex gap-2">
            <div className="h-2 w-2 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.3s]" />
            <div className="h-3 w-3 rounded-full bg-blue-400 animate-bounce [animation-delay:-0.15s]" />
            <div className="h-2 w-2 rounded-full bg-blue-300 animate-bounce" />
          </div>
        </div>
      </div>
    </motion.div>
  )
}
