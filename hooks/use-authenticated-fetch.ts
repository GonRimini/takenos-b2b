import { useAuth } from "@/components/auth"
import { useCallback } from "react"
import { useRouter } from "next/navigation"

export function useAuthenticatedFetch() {
  const { session, signOut } = useAuth()
  const router = useRouter()

  const authenticatedFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    if (!session?.access_token) {
      throw new Error("No authentication token available")
    }

    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    // Detectar errores de autenticación (401, 403)
    if (response.status === 401 || response.status === 403) {
      console.error(`❌ Error de autenticación (${response.status}) detectado, limpiando sesión...`)
      
      // Forzar logout y limpiar sesión
      try {
        await signOut()
        // Limpiar localStorage y sessionStorage por si acaso
        if (typeof window !== "undefined") {
          localStorage.clear()
          sessionStorage.clear()
        }
        // Redirigir al login
        router.push("/login")
      } catch (error) {
        console.error("Error durante logout forzado:", error)
      }
      
      // Lanzar error para que el componente que hace la petición pueda manejarlo
      const errorText = await response.text().catch(() => "Error de autenticación")
      throw new Error(`Error de autenticación: ${errorText}`)
    }

    return response
  }, [session?.access_token, signOut, router])

  return { authenticatedFetch, isAuthenticated: !!session?.access_token }
}
