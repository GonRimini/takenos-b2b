"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { clearUserSession, getUserSession } from "@/lib/auth";
import { useAuth } from "@/components/auth";
import { toast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const DepositIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
    />
  </svg>
);

const WithdrawIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M20 12H4"
    />
  </svg>
);

const HelpIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const LogoutIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
    />
  </svg>
);

const DashboardIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z"
    />
  </svg>
);

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: DashboardIcon },
  { name: "Depositar", href: "/depositar", icon: DepositIcon },
  { name: "Retirar", href: "/retirar", icon: WithdrawIcon },
  { name: "Ayuda", href: "/ayuda", icon: HelpIcon },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const isMobile = useIsMobile();
  const [userEmail, setUserEmail] = useState<string>("");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { signOut, user } = useAuth();
  const companyName = user?.dbUser?.company?.name
  const userName = `${user?.dbUser?.name || ""} ${user?.dbUser?.last_name || ""}`.trim();

  // En mobile, iniciar colapsado por defecto
  useEffect(() => {
    if (isMobile) {
      setIsCollapsed(true);
    }
  }, [isMobile]);

  useEffect(() => {
    const sessionUser = getUserSession();
    if (sessionUser) {
      setUserEmail(sessionUser.email);
    }
    // También usar el usuario del nuevo sistema si existe
    if (user?.email) {
      setUserEmail(user.email);
    }
  }, [user]);

  // Cerrar el sidebar en mobile al navegar
  useEffect(() => {
    if (isMobile && !isCollapsed) {
      setIsCollapsed(true);
    }
  }, [pathname, isMobile]);

  const handleLogout = async () => {

    try {
      await signOut();
      // También limpiar la sesión antigua por si acaso
      clearUserSession();

      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión exitosamente",
      });

      // Forzar recarga completa
      window.location.href = "/login";
    } catch (error) {
      alert("Error in logout: " + error);

      // Fallback al método antiguo
      clearUserSession();
      toast({
        title: "Sesión cerrada (fallback)",
        description: "Has cerrado sesión exitosamente",
      });
      router.push("/login");
    }
  };

  return (
    <>
      {/* Overlay para mobile cuando el sidebar está expandido */}
      {isMobile && !isCollapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsCollapsed(true)}
          aria-hidden="true"
        />
      )}

      <div className={cn(
        "flex h-screen flex-col bg-white border-r border-gray-200 transition-all duration-300 relative",
        // Desktop: tamaños normales
        !isMobile && (isCollapsed ? "w-20" : "w-64"),
        // Mobile: fixed positioning y ancho completo cuando expandido
        isMobile && "fixed left-0 top-0 z-50",
        isMobile && (isCollapsed ? "w-20" : "w-full")
      )}>
        {/* Toggle button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-20 z-50 flex h-6 w-6 items-center justify-center rounded-full bg-white border-2 border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors"
          aria-label={isCollapsed ? "Expandir sidebar" : "Colapsar sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>

      {/* Logo */}
      <div className="flex h-16 items-center justify-center px-4 border-b border-gray-200">
        <Link
          href="/dashboard"
          className="flex items-center justify-center py-2"
        >
          {isCollapsed ? (
            <Image
              src="/isotipo_color_takenos.png"
              alt="Takenos"
              width={32}
              height={32}
              priority
              className="h-8 w-8 cursor-pointer transition-opacity duration-200 hover:opacity-80"
            />
          ) : (
            <Image
              src="/logo-takenos-transparent.png"
              alt="Takenos"
              width={80}
              height={24}
              priority
              className="h-5 w-auto cursor-pointer transition-opacity duration-200 hover:opacity-80"
            />
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const IconComponent = item.icon;
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                    pathname === item.href
                      ? "bg-[#6d37d5] text-white shadow-sm"
                      : "text-gray-700 hover:bg-[#6d37d5]/10 hover:text-[#6d37d5]",
                    isCollapsed && "justify-center"
                  )}
                  title={isCollapsed ? item.name : undefined}
                >
                  <span className={cn(isCollapsed ? "" : "mr-3")}>
                    <IconComponent />
                  </span>
                  {!isCollapsed && item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User info and logout section */}
      <div className="border-t border-gray-200 p-4">
        {!isCollapsed && (
          <div className="mb-3">
            <p className="text-xs text-gray-500 mb-1">Usuario conectado:</p>
            <p className="text-sm font-medium text-gray-900 truncate">
              {userName || userEmail}
            </p>
          </div>
        )}
        <Button 
          onClick={handleLogout} 
          variant="logout" 
          size="sm"
          className={cn(
            "w-full",
            isCollapsed && "justify-center px-2"
          )}
          title={isCollapsed ? "Cerrar sesión" : undefined}
        >
          <LogoutIcon />
          {!isCollapsed && <span className="ml-2">Cerrar sesión</span>}
        </Button>
      </div>
    </div>
    </>
  );
}
