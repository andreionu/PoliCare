"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { AdminLayout } from "@/components/admin-layout"
import { Preloader } from "@/components/preloader"
import { AnimatePresence } from "framer-motion"

interface LayoutProps {
  children: React.ReactNode
}

export default function AppLayout({ children }: LayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    const role = localStorage.getItem("userRole")
    if (!role) {
      router.push("/login")
    } else {
      setIsAuthorized(true)
    }
  }, [router, pathname])

  if (!isAuthorized) {
    return (
      <AnimatePresence>
        <Preloader />
      </AnimatePresence>
    )
  }

  return <AdminLayout>{children}</AdminLayout>
}
