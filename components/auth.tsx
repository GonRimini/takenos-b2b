"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { User, Session, AuthError } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase-client"

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<{ error: AuthError | null }>
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Obtener sesión inicial SOLO si no estamos haciendo logout
    const getInitialSession = async () => {
      if (isSigningOut) {
        console.log("🚫 Saltando getInitialSession porque estamos haciendo logout")
        return
      }
      
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) {
        console.error("Error getting initial session:", error)
      } else {
        console.log("📱 Sesión inicial obtenida:", session?.user?.email || "null")
        setSession(session)
        setUser(session?.user ?? null)
      }
      setLoading(false)
    }

    getInitialSession()

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("🔐 Auth state change - Event:", event, "Session:", session?.user?.email || "null")
        
        // Si estamos haciendo logout, ignorar cambios de sesión temporales
        if (isSigningOut && event !== 'SIGNED_OUT') {
          console.log("🚫 Ignorando cambio de auth durante logout")
          return
        }
        
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
        
        // Limpiar flag de logout cuando se complete
        if (event === 'SIGNED_OUT') {
          setIsSigningOut(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [isSigningOut])

  // Manejo de rutas protegidas
  useEffect(() => {
    console.log("🔒 Auth route check - Loading:", loading, "User:", user?.email || "null", "Pathname:", pathname)
    
    if (loading) {
      console.log("🔒 Still loading, skipping route check")
      return
    }

    // Rutas públicas que no requieren autenticación
    const publicRoutes = ["/login", "/auth/callback"]
    
    // Si no hay usuario Y no estamos en una ruta pública
    if (!user && !publicRoutes.includes(pathname)) {
      console.log("🔒 No user and not on public route, redirecting to login")
      router.push("/login")
      return
    }
    
    // Si hay usuario Y estamos en login, redirigir al dashboard
    if (user && pathname === "/login") {
      console.log("🔒 User exists and on login page, redirecting to dashboard")
      router.push("/dashboard")
      return
    }
    
    console.log("🔒 Route check passed, staying on", pathname)
  }, [user, loading, pathname, router])

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })
    return { error }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  const signOut = async () => {
    console.log("🚪🚪🚪 SIGNOUT FUNCTION CALLED!")
    console.log("🚪 Current user before signout:", user?.email)
    console.log("🚪 Current session before signout:", session?.user?.email)
    
    // Marcar que estamos haciendo logout para evitar consultas de sesión
    console.log("🔥 Setting isSigningOut = true")
    setIsSigningOut(true)
    
    // Forzar limpieza inmediata del estado
    console.log("🔥 Clearing user and session state")
    setUser(null)
    setSession(null)
    setLoading(false)
    
    // Limpiar TODO el localStorage y sessionStorage
    console.log("🧹 Limpiando TODO el storage...")
    localStorage.clear()
    sessionStorage.clear()
    
    // Hacer signOut de Supabase DESPUÉS de limpiar el estado local
    try {
      console.log("📤 Enviando signOut a Supabase...")
      await supabase.auth.signOut({ scope: 'global' })
      console.log("✅ Supabase signOut completado")
    } catch (err) {
      console.log("⚠️ Supabase signOut falló, pero continuando:", err)
    }
    
    console.log("🎯 SignOut controlado completado - estado limpiado")
    console.log("🎯 User after signout:", user?.email)
    return { error: null }
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    return { error }
  }

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
  }

  // Mostrar loading mientras se inicializa la autenticación
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

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
