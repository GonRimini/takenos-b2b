"use client"

import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pathname = usePathname()

  const isActive = (path: string) => pathname === path

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
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
