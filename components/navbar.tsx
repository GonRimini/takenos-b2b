"use client"

import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { Menu, X, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/components/auth"
import { toast } from "@/hooks/use-toast"

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { user, signOut, loading } = useAuth()

  // Debug logs
  console.log("🔍 Navbar render - User:", user?.email || "No user")
  console.log("🔍 Navbar render - SignOut function:", typeof signOut)
  console.log("🔍 Navbar render - Loading:", loading)

  const isActive = (path: string) => pathname === path

  const handleSignOut = async () => {
    console.log("🚪 Botón cerrar sesión clickeado")
    console.log("👤 Usuario actual:", user?.email)
    
    try {
      console.log("📞 Llamando a signOut()...")
      const { error } = await signOut()
      console.log("✅ signOut() completado, error:", error)
      
      if (error) {
        console.error("❌ Error en signOut:", error)
        toast({
          title: "Error al cerrar sesión",
          description: error.message,
          variant: "destructive",
        })
      } else {
        console.log("🎉 SignOut exitoso, mostrando toast y redirigiendo...")
        toast({
          title: "Sesión cerrada",
          description: "Has cerrado sesión correctamente",
        })
        // Pequeño delay para asegurar que Supabase procese el logout
        console.log("🔄 Esperando 200ms antes de redirigir...")
        setTimeout(() => {
          console.log("🔄 Forzando recarga completa a /login...")
          window.location.href = '/login'
        }, 200)
      }
    } catch (error) {
      console.error("💥 Excepción en handleSignOut:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al cerrar sesión",
        variant: "destructive",
      })
    }
  }

  return (
    <nav className="bg-white border-b border-border sticky top-0 z-50 backdrop-blur-sm bg-white/95">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 transition-opacity hover:opacity-80">
            <Image
              src="https://framerusercontent.com/images/cQOgg57b6R7sKFMJ4O3emsf1kw.png"
              alt="Takenos Logo"
              width={120}
              height={40}
              className="h-8 w-auto"
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/depositar"
              className={cn(
                "text-foreground hover:text-primary transition-colors font-medium relative py-2",
                isActive("/depositar") && "text-primary",
              )}
            >
              Depositar
              {isActive("/depositar") && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
              )}
            </Link>
            <Link
              href="/retirar"
              className={cn(
                "text-foreground hover:text-primary transition-colors font-medium relative py-2",
                isActive("/retirar") && "text-primary",
              )}
            >
              Retirar
              {isActive("/retirar") && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
              )}
            </Link>
            <Link
              href="/ayuda"
              className={cn(
                "text-foreground hover:text-primary transition-colors font-medium relative py-2",
                isActive("/ayuda") && "text-primary",
              )}
            >
              Ayuda
              {isActive("/ayuda") && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />}
            </Link>
            
            {/* DEBUG BUTTON - ALWAYS VISIBLE */}
            <div className="flex items-center space-x-4 bg-yellow-200 p-2 rounded border-4 border-red-500">
              <span className="text-sm font-bold text-black">Usuario: {user?.email || "NO USER"}</span>
              <span className="text-xs text-black">Loading: {loading ? "true" : "false"}</span>
              <button 
                className="px-4 py-2 bg-red-600 text-white font-bold rounded hover:bg-red-700 border-2 border-red-800"
                onClick={(e) => {
                  console.log("🖱️🖱️🖱️ SUPER LOGOUT BUTTON CLICKED!")
                  console.log("🖱️ Event:", e)
                  console.log("🖱️ Current user:", user?.email)
                  console.log("🖱️ SignOut function type:", typeof signOut)
                  console.log("🖱️ HandleSignOut function type:", typeof handleSignOut)
                  alert("LOGOUT BUTTON CLICKED! Check console for logs")
                  
                  // Llamar directamente a signOut sin pasar por handleSignOut
                  console.log("🖱️ Calling signOut directly...")
                  signOut().then(result => {
                    console.log("🖱️ SignOut result:", result)
                    alert("SignOut completed! Result: " + JSON.stringify(result))
                  }).catch(err => {
                    console.log("🖱️ SignOut error:", err)
                    alert("SignOut error: " + err)
                  })
                }}
                style={{ 
                  position: 'relative',
                  minWidth: '120px',
                  minHeight: '40px'
                }}
              >
                🚪 LOGOUT NOW!
              </button>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button variant="ghost" size="sm" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Abrir menú">
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border animate-in slide-in-from-top-2 duration-200">
            <div className="flex flex-col space-y-4">
              <Link
                href="/depositar"
                className={cn(
                  "text-foreground hover:text-primary transition-colors font-medium",
                  isActive("/depositar") && "text-primary",
                )}
                onClick={() => setIsMenuOpen(false)}
              >
                Depositar
              </Link>
              <Link
                href="/retirar"
                className={cn(
                  "text-foreground hover:text-primary transition-colors font-medium",
                  isActive("/retirar") && "text-primary",
                )}
                onClick={() => setIsMenuOpen(false)}
              >
                Retirar
              </Link>
              <Link
                href="/ayuda"
                className={cn(
                  "text-foreground hover:text-primary transition-colors font-medium",
                  isActive("/ayuda") && "text-primary",
                )}
                onClick={() => setIsMenuOpen(false)}
              >
                Ayuda
              </Link>
              
              {/* Mobile logout - SUPER VISIBLE */}
              <div className="pt-4 border-t border-border bg-yellow-200 p-3 rounded">
                <div className="text-sm font-bold text-black mb-2">Usuario: {user?.email || "NO USER"}</div>
                <button
                  className="w-full px-4 py-3 bg-red-600 text-white font-bold rounded hover:bg-red-700 border-2 border-red-800"
                  onClick={(e) => {
                    console.log("🖱️🖱️🖱️ MOBILE LOGOUT CLICKED!")
                    console.log("🖱️ Mobile Event:", e)
                    alert("MOBILE LOGOUT CLICKED! Check console")
                    setIsMenuOpen(false)
                    handleSignOut()
                  }}
                >
                  🚪 MOBILE LOGOUT NOW!
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
