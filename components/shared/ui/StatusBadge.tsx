"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export type StatusType = 
  | "completed" 
  | "pending" 
  | "awaiting" 
  | "cancelled" 
  | "failed"

interface StatusBadgeProps {
  status: StatusType
  variant?: "default" | "compact"
  className?: string
}

export function StatusBadge({ status, variant = "default", className }: StatusBadgeProps) {
  const getStatusConfig = (status: StatusType) => {
    switch (status) {
      case "completed":
        return { 
          variant: "default" as const, 
          className: "bg-green-100 text-green-800", 
          label: "Completado" 
        }
      case "pending":
        return { 
          variant: "secondary" as const, 
          className: "bg-yellow-100 text-yellow-800", 
          label: "Pendiente" 
        }
      case "awaiting":
        return { 
          variant: "secondary" as const, 
          className: "bg-blue-100 text-blue-800", 
          label: "Esperando Pago" 
        }
      case "cancelled":
        return { 
          variant: "secondary" as const, 
          className: "bg-gray-100 text-gray-800", 
          label: "Cancelado" 
        }
      case "failed":
        return { 
          variant: "destructive" as const, 
          className: "", 
          label: "Fallido" 
        }
    }
  }

  const config = getStatusConfig(status)
  
  return (
    <Badge 
      variant={config.variant} 
      className={cn(
        config.className,
        variant === "compact" && "px-2 py-0.5 text-xs",
        className
      )}
    >
      {config.label}
    </Badge>
  )
}

// Export tipo para TypeScript
export type { StatusBadgeProps }