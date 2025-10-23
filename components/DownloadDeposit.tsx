"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download, Loader2 } from "lucide-react"
import { useAuth } from "@/components/auth"
import { useToast } from "@/hooks/use-toast"
import { useAuthenticatedFetch } from "@/hooks/use-authenticated-fetch"

interface DepositPdfButtonProps {
  depositId: string
}

export function DepositPdfButton({ depositId }: DepositPdfButtonProps) {
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()
  const { authenticatedFetch } = useAuthenticatedFetch()

  const handleOpenPDF = async () => {
    if (!user?.email) {
      toast({
        title: "Error",
        description: "Usuario no autenticado",
        variant: "destructive"
      })
      return
    }

    try {
      setLoading(true)
      console.log("🔍 [DepositPdfButton] Buscando comprobante para depósito:", depositId)
      
      // Llamar a la API para obtener la URL del depósito
      const response = await authenticatedFetch(`/api/deposits/${depositId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ depositId })
      })

      const { data } = await response.json()
      if (!response.ok) throw new Error(data.error || "Error al obtener el comprobante")

      const fileUrl = data[0]?.file_url

      if (!fileUrl) throw new Error("No se encontró la URL del comprobante")

      // 🚀 Abre el PDF en una nueva pestaña
      window.open(fileUrl, "_blank")

      toast({
        title: "Comprobante abierto",
        description: "El comprobante se abrió en una nueva pestaña.",
      })
    } catch (error) {
      console.error("❌ [DepositPdfButton] Error:", error)
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Error desconocido al abrir el comprobante",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleOpenPDF}
      variant="link"
      size="sm"
      disabled={loading}
      className="h-8 px-2 text-blue-600 hover:text-blue-800"
      title="Abrir comprobante de depósito"
    >
      {loading ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : (
        <Download className="w-3 h-3" />
      )}
    </Button>
  )
}

export default DepositPdfButton