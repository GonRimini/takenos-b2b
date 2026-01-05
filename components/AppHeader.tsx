"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { CircleHelp, LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth";
import { toast } from "@/hooks/use-toast";
import { clearUserSession } from "@/lib/auth";
import { useIsMobile } from "@/components/ui/use-mobile";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function AppHeader() {
  const router = useRouter();
  const { signOut } = useAuth();
  const isMobile = useIsMobile();

  const handleLogout = async () => {
    try {
      await signOut();
      clearUserSession();

      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión exitosamente",
      });

      // Forzar recarga completa
      window.location.href = "/login";
    } catch (error) {
      // Fallback al método antiguo
      clearUserSession();
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión exitosamente",
      });
      router.push("/login");
    }
  };

  const handleHelp = () => {
    router.push("/ayuda");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        {/* Left Section: Toggle Button */}
        <div className="flex items-center">
          <SidebarTrigger className="hover:bg-violet-100 text-[#6d37d5]" />
        </div>
        {/* Center Section: Logo (absolutely centered) */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          {/* Desktop Logo */}
          <div className="hidden md:block">
            <Link href="/dashboard">
            <Image
              src="/logo-takenos-transparent.png"
              alt="Takenos"
              width={120}
              height={36}
              priority
              className="h-6 w-auto"
            />
            </Link>
          </div>
          {/* Mobile Logo (Isologo) */}
          <div className="block md:hidden">
            <Link href="/dashboard">
            <Image
              src="/isotipo_color_takenos.png"
              alt="Takenos"
              width={32}
              height={32}
              priority
              className="h-8 w-8"
            />
            </Link>
          </div>
        </div>

        {/* Right Section: Action Buttons (solo en desktop) */}
        <div className="flex items-center gap-2">
          {!isMobile && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleHelp}
                aria-label="Ayuda"
                className="text-[#6d37d5] hover:bg-[#6d37d5]/10 hover:text-[#6d37d5]"
              >
                <CircleHelp className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                aria-label="Cerrar sesión"
                className="text-[#6d37d5] hover:bg-[#6d37d5]/10 hover:text-[#6d37d5]"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

