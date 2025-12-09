"use client"

import { Activity } from 'lucide-react'

export function Preloader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Activity className="h-8 w-8" />
          </div>
          <div className="absolute inset-0 rounded-2xl bg-primary animate-ping opacity-20" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <h2 className="text-xl font-semibold">Loading Dashboard</h2>
          <div className="flex gap-1">
            <div className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
            <div className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
            <div className="h-2 w-2 rounded-full bg-primary animate-bounce" />
          </div>
        </div>
      </div>
    </div>
  )
}
