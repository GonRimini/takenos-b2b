"use client"

import { useState } from "react"
import { Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

interface CopyButtonProps {
  text: string
  label?: string
}

export function CopyButton({ text, label }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast({
        description: `${label || "Texto"} copiado al portapapeles`,
        duration: 2000,
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      try {
        const textArea = document.createElement("textarea")
        textArea.value = text
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand("copy")
        document.body.removeChild(textArea)

        setCopied(true)
        toast({
          description: `${label || "Texto"} copiado al portapapeles`,
          duration: 2000,
        })
        setTimeout(() => setCopied(false), 2000)
      } catch (fallbackErr) {
        toast({
          variant: "destructive",
          description: "Error al copiar al portapapeles",
          duration: 3000,
        })
      }
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleCopy}
      className="h-8 px-2 bg-transparent hover:bg-muted transition-colors"
      aria-label={`Copiar ${label || "texto"}`}
    >
      {copied ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
    </Button>
  )
}
