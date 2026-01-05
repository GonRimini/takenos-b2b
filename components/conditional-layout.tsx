"use client"

import type React from "react"
import { usePathname } from "next/navigation"
import { SidebarProvider, SidebarInset, useSidebar } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/AppHeader"
import { useIsMobile } from "@/components/ui/use-mobile"

interface ConditionalLayoutProps {
  children: React.ReactNode
}

function LayoutContent({ children }: { children: React.ReactNode }) {
  const { open, setOpen } = useSidebar()
  const isMobile = useIsMobile()

  return (
    <div className="relative flex h-screen w-full">
      {/* Overlay para desktop cuando sidebar está abierta */}
      {!isMobile && open && (
        <div
          className="fixed top-16 left-0 right-0 bottom-0 z-30 bg-black/40 transition-opacity cursor-pointer"
          onClick={() => setOpen(false)}
        />
      )}
      
      <AppSidebar />
      <SidebarInset className="flex flex-1 flex-col">
        <AppHeader />
        <main className="flex-1 overflow-auto bg-gray-50">
          <div className="p-4 md:p-8">{children}</div>
        </main>
      </SidebarInset>
    </div>
  )
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname()

  if (pathname === "/login" || pathname === "/forgot-password" || pathname === "/auth/reset-password") {
    return <>{children}</>
  }

  return (
    <SidebarProvider defaultOpen={false}>
      <LayoutContent>{children}</LayoutContent>
    </SidebarProvider>
  )
}
