"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Home, ArrowDownToLine, ArrowUpFromLine, HelpCircle, LogOut } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth"
import { clearUserSession } from "@/lib/auth"
import { toast } from "@/hooks/use-toast"
import { useIsMobile } from "@/components/ui/use-mobile"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Depositar", href: "/depositar", icon: ArrowDownToLine },
  { name: "Retirar", href: "/retirar", icon: ArrowUpFromLine },
  { name: "Ayuda", href: "/ayuda", icon: HelpCircle },
]

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { signOut, user } = useAuth()
  const isMobile = useIsMobile()
  const { setOpenMobile } = useSidebar()

  const userName = `${user?.dbUser?.name || ""} ${user?.dbUser?.last_name || ""}`.trim()
  const userEmail = user?.email || ""

  const handleLogout = async () => {
    try {
      await signOut()
      clearUserSession()

      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión exitosamente",
      })

      window.location.href = "/login"
    } catch (error) {
      clearUserSession()
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión exitosamente",
      })
      router.push("/login")
    }
  }

  const handleNavigation = (href: string) => {
    if (isMobile) {
      setOpenMobile(false)
    }
    router.push(href)
  }

  return (
    <Sidebar className="bg-white border-r shadow-lg z-40">
      <SidebarContent className="bg-white">
        <SidebarGroup className="px-3 py-4">
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className={isActive ? "bg-[#6d37d5] text-white hover:bg-[#6d37d5] hover:text-white h-12 text-base" : "hover:bg-[#6d37d5]/10 hover:text-[#6d37d5] h-12 text-base"}
                    >
                      <button onClick={() => handleNavigation(item.href)} className="w-full">
                        <Icon className="h-6 w-6 mr-1" />
                        <span className="font-medium text-md">{item.name}</span>
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer - diferente para mobile y desktop */}
      {isMobile ? (
        <SidebarFooter className="border-t border-gray-200 p-4 bg-white">
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full justify-start text-[#6d37d5] hover:bg-[#6d37d5]/10 hover:text-[#6d37d5] h-12 text-base"
          >
            <LogOut className="mr-3 h-6 w-6" />
            <span className="font-medium">Cerrar sesión</span>
          </Button>
        </SidebarFooter>
      ) : (
        <SidebarFooter className="border-t border-gray-200 p-6 bg-white">
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Usuario conectado</p>
            <p className="text-sm font-semibold text-gray-900 truncate">
               {userName || userEmail}
            </p>
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="w-full justify-start text-[#6d37d5] hover:bg-[#6d37d5]/10 hover:text-[#6d37d5] h-10 text-sm"
            >
              <LogOut className="h-5 w-5" />
              Cerrar sesión
            </Button>
          </div>
        </SidebarFooter>
      )}
    </Sidebar>
  )
}

