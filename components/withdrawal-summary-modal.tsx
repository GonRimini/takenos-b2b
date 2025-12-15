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
import { Badge } from "@/components/ui/badge"

interface WithdrawalSummaryModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  data: WithdrawalFormData
  selectedAccount: any
  isSubmitting: boolean
}

export function WithdrawalSummaryModal({
  isOpen,
  onClose,
  onConfirm,
  data,
  selectedAccount,
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

  const getRailLabel = (rail: string) => {
    const labels: Record<string, string> = {
      ach: "ACH/Wire",
      swift: "SWIFT",
      crypto: "Criptomonedas",
      local: "Moneda Local",
    }
    return labels[rail] || rail
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
            {/* Información del retiro */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Detalles del retiro</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Monto a retirar</div>
                  <div className="text-xl font-bold text-primary">{formatAmount(data.amount)}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Moneda</div>
                  <div className="text-sm">{selectedAccount?.currency_code || "USD"}</div>
                </div>
              </div>
            </div>

            {/* Información de la cuenta destino */}
            <div className="pt-4 border-t">
              <h3 className="text-sm font-semibold mb-3">Cuenta destino</h3>
              <div className="space-y-3">

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Alias de cuenta</div>
                    <div className="text-sm font-semibold">{selectedAccount?.nickname || "Sin nombre"}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Tipo</div>
                    <Badge variant="outline">{getRailLabel(selectedAccount?.rail)}</Badge>
                  </div>
                </div>

                {/* ACH */}
                {selectedAccount?.rail === "ach" && selectedAccount?.ach && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">Beneficiario</div>
                        <div className="text-sm">{selectedAccount.ach.beneficiary_name}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">Banco</div>
                        <div className="text-sm">{selectedAccount.ach.receiver_bank}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">Cuenta</div>
                        <div className="text-sm font-mono">****{selectedAccount.ach.account_number?.slice(-4)}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">Routing</div>
                        <div className="text-sm font-mono">{selectedAccount.ach.routing_number}</div>
                      </div>
                    </div>
                  </>
                )}

                {/* SWIFT */}
                {selectedAccount?.rail === "swift" && selectedAccount?.swift && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">Beneficiario</div>
                        <div className="text-sm">{selectedAccount.swift.beneficiary_name}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">Banco</div>
                        <div className="text-sm">{selectedAccount.swift.receiver_bank}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">SWIFT/BIC</div>
                        <div className="text-sm font-mono">{selectedAccount.swift.swift_bic}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">Cuenta</div>
                        <div className="text-sm font-mono">****{selectedAccount.swift.account_number?.slice(-4)}</div>
                      </div>
                    </div>
                  </>
                )}

                {/* Crypto */}
                {selectedAccount?.rail === "crypto" && selectedAccount?.crypto && (
                  <>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Red</div>
                      <div className="text-sm">{selectedAccount.crypto.wallet_network}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Dirección</div>
                      <div className="text-xs font-mono break-all bg-muted p-2 rounded">{selectedAccount.crypto.wallet_address}</div>
                    </div>
                  </>
                )}

                {/* Local */}
                {selectedAccount?.rail === "local" && selectedAccount?.local && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">País</div>
                        <div className="text-sm">{selectedAccount.local.country_code}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">Banco</div>
                        <div className="text-sm">{selectedAccount.local.bank_name}</div>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Beneficiario</div>
                      <div className="text-sm">{selectedAccount.local.beneficiary_name}</div>
                    </div>
                    {selectedAccount.local.identifier_primary && (
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">
                          {selectedAccount.local.identifier_primary_type || "Identificador"}
                        </div>
                        <div className="text-sm font-mono">{selectedAccount.local.identifier_primary}</div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Información adicional */}
            {(data.reference || data.receiptFile || (data.receiptFiles && data.receiptFiles.length > 0)) && (
              <div className="pt-4 border-t">
                <h3 className="text-sm font-semibold mb-3">Información adicional</h3>
                <div className="space-y-3">
                  {data.reference && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Concepto / Referencia</div>
                      <div className="text-sm">{data.reference}</div>
                    </div>
                  )}
                  
                  {/* Múltiples comprobantes */}
                  {data.receiptFiles && Array.isArray(data.receiptFiles) && data.receiptFiles.length > 0 ? (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-2">
                        Comprobantes PDF ({data.receiptFiles.length})
                      </div>
                      <div className="space-y-2">
                        {data.receiptFiles.map((file: File, index: number) => (
                          <div key={`${file.name}-${index}`} className="text-sm flex items-center gap-2">
                            <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">
                              📄 {file.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              ({(file.size / 1024 / 1024).toFixed(2)} MB)
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    /* Comprobante único (legacy) */
                    data.receiptFile && data.receiptFile instanceof File && (
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
                    )
                  )}
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
