"use client"

import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CopyButton } from "./copy-button"

interface AccountFieldProps {
  label: string
  value: string
  maskable?: boolean
}

export function AccountField({ label, value, maskable = false }: AccountFieldProps) {
  const [isVisible, setIsVisible] = useState(false)

  const displayValue = maskable && !isVisible ? `*********${value.slice(-4)}` : value

  return (
    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border transition-colors hover:bg-muted/70">
      <div className="flex-1">
        <div className="text-sm font-medium text-foreground mb-1">{label}</div>
        <div className="text-sm text-muted-foreground font-mono select-all">{displayValue}</div>
      </div>
      <div className="flex items-center gap-2">
        {maskable && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsVisible(!isVisible)}
            className="h-8 px-2 hover:bg-muted transition-colors"
            aria-label={isVisible ? "Ocultar número" : "Mostrar número"}
          >
            {isVisible ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
          </Button>
        )}
        <CopyButton text={value} label={label} />
      </div>
    </div>
  )
}
