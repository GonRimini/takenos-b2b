"use client"

import type { WithdrawalFormData } from "@/lib/withdrawal-schema"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface WithdrawalSummaryModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  data: WithdrawalFormData
  isSubmitting: boolean
}

export function WithdrawalSummaryModal({
  isOpen,
  onClose,
  onConfirm,
  data,
  isSubmitting,
}: WithdrawalSummaryModalProps) {
  const formatAmount = (amount: string) => {
    if (!amount || typeof amount !== "string") {
      return "$0.00"
    }
    const num = Number.parseFloat(amount.replace(/[,$]/g, ""))
    if (isNaN(num)) {
      return "$0.00"
    }
    return new Intl.NumberFormat("es-US", {
      style: "currency",
      currency: "USD",
    }).format(num)
  }

  const getCategoryLabel = (category: string) => {
    const labels = {
      usd_bank: "USD - Cuenta bancaria",
      crypto: "Criptomonedas",
      local_currency: "Moneda local",
    }
    return labels[category as keyof typeof labels] || category
  }

  const getMethodLabel = (method: string) => {
    const labels = {
      ach: "ACH",
      wire: "Wire Transfer",
    }
    return labels[method as keyof typeof labels] || method
  }

  const getAccountOwnershipLabel = (ownership: string) => {
    const labels = {
      yo: "Yo mismo",
      otra_persona: "Otra persona",
      empresa: "Empresa",
    }
    return labels[ownership as keyof typeof labels] || ownership
  }

  const getAccountTypeLabel = (type: string) => {
    const labels = {
      checking: "Checking",
      saving: "Saving",
    }
    return labels[type as keyof typeof labels] || type
  }

  const getWalletNetworkLabel = (network: string) => {
    const labels = {
      BEP20: "Binance Smart Chain - BEP20",
      MATIC: "Polygon - MATIC",
      TRC20: "Tron - TRC20",
    }
    return labels[network as keyof typeof labels] || network
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-gray-50">
        <DialogHeader>
          <DialogTitle>Revisar y confirmar</DialogTitle>
          <DialogDescription>
            Verifica que toda la información sea correcta antes de enviar la solicitud
          </DialogDescription>
        </DialogHeader>

        <Card className="bg-gray-50 border-gray-200">
          <CardContent className="pt-6 space-y-4">
            {/* Información general */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground">Categoría</div>
                <div className="text-sm">{getCategoryLabel(data.category)}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Monto</div>
                <div className="text-lg font-semibold text-primary">{formatAmount(data.amount)}</div>
              </div>
            </div>

            {/* Campos específicos para USD Bank */}
            {data.category === "usd_bank" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Propietario</div>
                    <div className="text-sm">{getAccountOwnershipLabel(data.accountOwnership)}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Método</div>
                    <div className="text-sm">{getMethodLabel(data.method)}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Titular</div>
                    <div className="text-sm">{data.beneficiaryName}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Banco</div>
                    <div className="text-sm">{data.beneficiaryBank}</div>
                  </div>
                </div>

                {data.method === "ach" ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Tipo de cuenta</div>
                      <div className="text-sm">{getAccountTypeLabel(data.accountType)}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Número de cuenta</div>
                      <div className="text-sm font-mono">{data.accountNumber}</div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Número de cuenta / IBAN</div>
                    <div className="text-sm font-mono">{data.accountNumber}</div>
                  </div>
                )}

                {data.method === "ach" && data.routingNumber && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Routing Number</div>
                    <div className="text-sm font-mono">{data.routingNumber}</div>
                  </div>
                )}

                {data.method === "wire" && data.swiftBic && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">SWIFT/BIC</div>
                    <div className="text-sm font-mono">{data.swiftBic}</div>
                  </div>
                )}
              </>
            )}

            {/* Campos específicos para Crypto */}
            {data.category === "crypto" && (
              <>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Apodo de la billetera</div>
                  <div className="text-sm">{data.walletAlias}</div>
                </div>

                <div>
                  <div className="text-sm font-medium text-muted-foreground">Dirección</div>
                  <div className="text-sm font-mono break-all">{data.walletAddress}</div>
                </div>

                <div>
                  <div className="text-sm font-medium text-muted-foreground">Red</div>
                  <div className="text-sm">{getWalletNetworkLabel(data.walletNetwork)}</div>
                </div>
              </>
            )}

            {/* Campos específicos para Moneda Local */}
            {data.category === "local_currency" && (
              <>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">País</div>
                  <div className="text-sm">{data.country}</div>
                </div>

                <div>
                  <div className="text-sm font-medium text-muted-foreground">Nombre de la cuenta</div>
                  <div className="text-sm">{data.localAccountName}</div>
                </div>

                <div>
                  <div className="text-sm font-medium text-muted-foreground">Banco</div>
                  <div className="text-sm">{data.localBank}</div>
                </div>

                <div>
                  <div className="text-sm font-medium text-muted-foreground">Número de cuenta</div>
                  <div className="text-sm font-mono">{data.localAccountNumber}</div>
                </div>
              </>
            )}

            {/* Referencia (común a todas las categorías) */}
            {data.reference && (
              <div>
                <div className="text-sm font-medium text-muted-foreground">Referencia</div>
                <div className="text-sm">{data.reference}</div>
              </div>
            )}

            {/* Comprobante PDF */}
            {data.receiptFile && data.receiptFile instanceof File && (
              <div>
                <div className="text-sm font-medium text-muted-foreground">Comprobante PDF</div>
                <div className="text-sm flex items-center gap-2">
                  <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">
                    📄 {data.receiptFile.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({(data.receiptFile.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={onConfirm} disabled={isSubmitting}>
            {isSubmitting ? "Enviando..." : "Confirmar y enviar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
