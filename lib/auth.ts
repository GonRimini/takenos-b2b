export interface User {
  email: string
  receiverId?: string
  loginTime?: number
  lastActivity?: number
}

export const STATIC_PASSWORD = "12345678"
export const SESSION_TIMEOUT = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

export function validateLogin(email: string, password: string): boolean {
  return password === STATIC_PASSWORD && email.includes("@")
}

export function setUserSession(user: User): void {
  if (typeof window !== "undefined") {
    const sessionData = {
      ...user,
      loginTime: Date.now(),
      lastActivity: Date.now(),
    }
    localStorage.setItem("takenos_user", JSON.stringify(sessionData))
  }
}

export function getUserSession(): User | null {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("takenos_user")
    if (!stored) return null

    try {
      const user = JSON.parse(stored)

      if (isSessionExpired(user)) {
        clearUserSession()
        return null
      }

      updateLastActivity(user)
      return user
    } catch (error) {
      console.error("Error parsing user session:", error)
      clearUserSession()
      return null
    }
  }
  return null
}

export function updateUserSession(updates: Partial<User>): void {
  if (typeof window !== "undefined") {
    const currentUser = getUserSession()
    if (currentUser) {
      const updatedUser = {
        ...currentUser,
        ...updates,
        lastActivity: Date.now(),
      }
      localStorage.setItem("takenos_user", JSON.stringify(updatedUser))
    }
  }
}

export function updateLastActivity(user: User): void {
  if (typeof window !== "undefined") {
    const updatedUser = {
      ...user,
      lastActivity: Date.now(),
    }
    localStorage.setItem("takenos_user", JSON.stringify(updatedUser))
  }
}

export function isSessionExpired(user: User): boolean {
  if (!user.loginTime) return true

  const now = Date.now()
  const sessionAge = now - user.loginTime

  return sessionAge > SESSION_TIMEOUT
}

export function getSessionTimeRemaining(user: User): number {
  if (!user.loginTime) return 0

  const now = Date.now()
  const sessionAge = now - user.loginTime
  const remaining = SESSION_TIMEOUT - sessionAge

  return Math.max(0, remaining)
}

export function clearUserSession(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("takenos_user")
  }
}
