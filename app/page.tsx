"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { getUserSession } from "@/lib/auth"

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    const user = getUserSession()
    if (user) {
      router.replace("/dashboard")
    } else {
      router.replace("/login")
    }
  }, [router])

  // Show loading while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6d37d5]"></div>
    </div>
  )
}
