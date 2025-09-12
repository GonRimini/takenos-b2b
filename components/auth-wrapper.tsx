"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth as useSupabaseAuth } from "@/components/auth-provider"

interface AuthWrapperProps {
  children: React.ReactNode
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const { user, loading } = useSupabaseAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (loading) return

    // Rutas públicas que no requieren autenticación
    const publicRoutes = ["/login", "/auth/callback"]
    
    if (!user && !publicRoutes.includes(pathname)) {
      router.push("/login")
    } else if (user && pathname === "/login") {
      router.push("/dashboard")
    }
  }, [user, loading, pathname, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6d37d5] mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
