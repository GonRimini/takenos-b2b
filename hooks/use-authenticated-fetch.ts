import { useAuth } from "@/components/auth-provider"
import { useCallback } from "react"

export function useAuthenticatedFetch() {
  const { session } = useAuth()

  const authenticatedFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    if (!session?.access_token) {
      throw new Error("No authentication token available")
    }

    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    }

    return fetch(url, {
      ...options,
      headers,
    })
  }, [session?.access_token])

  return { authenticatedFetch, isAuthenticated: !!session?.access_token }
}
