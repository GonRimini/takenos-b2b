"use client"

import type React from "react"

import { useEffect, useState, createContext, useContext } from "react"
import { useRouter, usePathname } from "next/navigation"
import { getUserSession, updateUserSession, type User } from "@/lib/auth"
import { getReceiverByEmail } from "@/lib/blindpay-api"
import { toast } from "@/hooks/use-toast"

interface AuthContextType {
  user: User | null
  updateUser: (updates: Partial<User>) => void
  refreshSession: () => Promise<void>
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthWrapper")
  }
  return context
}

interface AuthWrapperProps {
  children: React.ReactNode
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates }
      setUser(updatedUser)
      updateUserSession(updates)
    }
  }

  const refreshSession = async () => {
    const currentUser = getUserSession()
    if (currentUser && !currentUser.receiverId) {
      try {
        const { receiverId } = await getReceiverByEmail(currentUser.email)
        updateUser({ receiverId })
      } catch (error) {
        console.error("Error refreshing session:", error)
        toast({
          title: "Error de sesión",
          description: "No se pudo validar tu cuenta. Por favor, inicia sesión nuevamente.",
          variant: "destructive",
        })
      }
    }
  }

  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = getUserSession()
      setUser(currentUser)

      if (currentUser) {
        await refreshSession()
      }

      setIsLoading(false)

      if (!currentUser && pathname !== "/login") {
        router.push("/login")
      } else if (currentUser && pathname === "/login") {
        router.push("/dashboard")
      }
    }

    checkAuth()
  }, [pathname, router])

  useEffect(() => {
    if (!user) return

    const handleActivity = () => {
      updateUser({ lastActivity: Date.now() })
    }

    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart", "click"]
    events.forEach((event) => {
      document.addEventListener(event, handleActivity, true)
    })

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity, true)
      })
    }
  }, [user])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6d37d5] mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!user && pathname !== "/login") {
    return null // Will redirect to login
  }

  const contextValue: AuthContextType = {
    user,
    updateUser,
    refreshSession,
    isLoading,
  }

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}
