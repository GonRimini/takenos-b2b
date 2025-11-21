"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { useWithdrawalRepository } from "@/hooks/withdrawal/repository"
import { useAuth } from "@/components/auth"
import { pdf } from "@react-pdf/renderer"
import { TransactionReceiptPDF } from "./TransactionReceiptPDF"

interface WithdrawalPDFButtonProps {
  withdrawalId: string
  transaction: any
}

export function WithdrawalPDFButton({ withdrawalId, transaction }: WithdrawalPDFButtonProps) {
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()
  const companyName = user?.dbUser?.company?.name
  const { loadWithdrawalDetailByExternalId } = useWithdrawalRepository()

  const handleDownloadPDF = async () => {
    if (!user?.email) {
      console.error("Usuario no autenticado")
      return
    }

    try {
      setLoading(true)

      // Llamar directamente al repositorio para obtener los datos
      const withdrawalDetail = await loadWithdrawalDetailByExternalId(withdrawalId)

      if (!withdrawalDetail) {
        throw new Error("No se pudieron obtener los datos del retiro")
      }

      console.log("📄 Datos del retiro:", withdrawalDetail)

      // Extraer datos de la respuesta según la estructura proporcionada
      const { company, requested_by, external_account, withdrawal_request } = withdrawalDetail

      // Mapear los datos al formato esperado por TransactionReceiptPDF
      const enrichedData: any = {
        withdraw_id: withdrawal_request.id,
        nickname: external_account.base.nickname,
        category: external_account.base.rail,
        method: external_account.base.rail,
      }

      // Agregar datos específicos según el rail
      if (external_account.ach) {
        enrichedData.beneficiary_name = external_account.ach.beneficiary_name
        enrichedData.beneficiary_bank = external_account.ach.receiver_bank
        enrichedData.account_number = external_account.ach.account_number
        enrichedData.routing_number = external_account.ach.routing_number
        enrichedData.account_type = external_account.ach.account_type
      } else if (external_account.swift) {
        enrichedData.beneficiary_name = external_account.swift.beneficiary_name
        enrichedData.beneficiary_bank = external_account.swift.receiver_bank
        enrichedData.account_number = external_account.swift.account_number
        enrichedData.swift_bic = external_account.swift.swift_bic
        enrichedData.account_type = external_account.swift.account_type
      } else if (external_account.crypto) {
        enrichedData.wallet_alias = external_account.base.nickname
        enrichedData.wallet_address = external_account.crypto.wallet_address
        enrichedData.wallet_network = external_account.crypto.network
      } else if (external_account.local) {
        enrichedData.beneficiary_name = external_account.local.beneficiary_name
        enrichedData.local_bank = external_account.local.bank_name
        enrichedData.local_account_number = external_account.local.account_number
      }

      // Construir objeto transaction manteniendo fee y final_amount de la transacción original
      const pdfData = {
        transaction: {
          ...transaction,
          id: withdrawal_request.id,
          initial_amount: withdrawal_request.initial_amount,
          // Mantener fee y final_amount del transaction original si existen
          final_amount: transaction?.final_amount,
          currency: withdrawal_request.currency_code,
          date: withdrawal_request.created_at,
          description: withdrawal_request.external_reference || transaction?.description || "Retiro",
        },
        enrichedData,
        companyName: company?.name || companyName || "Mi Empresa",
        userEmail: requested_by?.email || user.email,
      }

      console.log("📄 Datos para PDF:", pdfData)

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