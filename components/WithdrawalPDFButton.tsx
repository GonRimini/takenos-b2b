"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { useEnrichedWithdrawals } from "@/lib/supabase-helper"
import { useAuth } from "@/components/auth"
import { pdf } from "@react-pdf/renderer"
import { TransactionReceiptPDF } from "./TransactionReceiptPDF"
import { useCompanyName } from "@/hooks/use-company-name"

interface WithdrawalPDFButtonProps {
  withdrawalId: string
  transaction: any
}

export function WithdrawalPDFButton({ withdrawalId, transaction }: WithdrawalPDFButtonProps) {
  const [loading, setLoading] = useState(false)
  const { fetchEnrichedWithdrawal } = useEnrichedWithdrawals()
  const { user } = useAuth()
  const { companyName } = useCompanyName()

  const handleDownloadPDF = async () => {
    if (!user?.email) {
      console.error("Usuario no autenticado")
      return
    }

    try {
      setLoading(true)
      console.log("🔍 [WithdrawalPDFButton] Descargando PDF para withdrawal:", withdrawalId)
      console.log("🔍 [WithdrawalPDFButton] Transacción:", transaction)
      
      // Llamar al hook con el ID específico del withdrawal
      const enrichedData = await fetchEnrichedWithdrawal(withdrawalId)

      
      console.log("✅ [WithdrawalPDFButton] Respuesta enriquecida:", enrichedData)
      console.log("✅ [WithdrawalPDFButton] Datos completos:", {
        withdrawalId,
        enrichedData,
        originalTransaction: transaction
      })

      console.log("🔍 [WithdrawalPDFButton] Datos de la transacción (API transactions):", transaction)

      // Generar PDF del comprobante individual - USANDO KEYS ORIGINALES
      const pdfData = {
        // Pasamos la transaction tal como viene, sin cambiar keys
        transaction: transaction,
        // Pasamos enrichedData tal como viene, sin cambiar keys  
        enrichedData: Array.isArray(enrichedData) ? enrichedData[0] : enrichedData,
        companyName: companyName || "Mi Empresa",
        userEmail: user.email,
      }

      console.log("📄 [WithdrawalPDFButton] PDF Data mapeado con nueva estructura:", pdfData)
      console.log("💰 [WithdrawalPDFButton] Montos - Amount:", transaction.amount, "Initial:", transaction.initial_amount, "Final:", transaction.final_amount)
      console.log("🏦 [WithdrawalPDFButton] Account Ref:", transaction.account_ref)
      console.log("💱 [WithdrawalPDFButton] Currency:", transaction.currency, "Rate:", transaction.conversion_rate)
      console.log("📊 [WithdrawalPDFButton] Status:", transaction.status, "Direction:", transaction.direction, "Type:", transaction.raw_type)
      console.log("💱 [WithdrawalPDFButton] Moneda:", transaction.moneda, "Tasa:", transaction.tasa_conversion)
      console.log("📊 [WithdrawalPDFButton] Estado:", transaction.estado, "Dirección:", transaction.direccion)

    //   console.log("📄 [WithdrawalPDFButton] Generando PDF con datos:", pdfData)
      console.log("PDF DATA PARA DESCARGAR COMPROBANTE", pdfData)
      // Generar el documento PDF
      const pdfDoc = <TransactionReceiptPDF data={pdfData} />
      const pdfBlob = await pdf(pdfDoc).toBlob()

      // Descargar el PDF
      const url = URL.createObjectURL(pdfBlob)
      const link = document.createElement("a")
      link.href = url
      link.download = `comprobante_${withdrawalId.slice(-8)}_${new Date().toISOString().slice(0, 10)}.pdf`
      link.click()

      // Limpiar la URL temporal
      URL.revokeObjectURL(url)

      console.log("✅ [WithdrawalPDFButton] PDF descargado correctamente")

      
    } catch (error) {
      console.error("❌ Error obteniendo datos enriquecidos:", error)
    } finally {
      setLoading(false)
    }
  }


  return (
    <Button
      onClick={handleDownloadPDF}
      variant="link"
      size="sm"
      disabled={loading}
      className="h-8 px-2"
    >
      <Download className="w-3 h-3 mr-1" />
    </Button>
  )
}