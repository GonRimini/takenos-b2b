"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { AccountField } from "@/components/account-field"
import { downloadPDF } from "@/lib/pdf-generator"
import { Download, AlertCircle, Loader2, RefreshCw } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getDepositDataForUser, type BlindpayVirtualAccount } from "@/lib/blindpay-api"
import { getUserSession } from "@/lib/auth"
import { toast } from "@/hooks/use-toast"
import { useDataCache } from "@/hooks/use-data-cache"
import { useCacheInvalidation } from "@/hooks/use-cache-invalidation"

export type DepositMethod = "ach" | "wire" | "rtp" | "swift"

export default function DepositarPage() {
  const [selectedMethod, setSelectedMethod] = useState<DepositMethod | "">("")
  
  // Obtener usuario
  const user = getUserSession()
  
  // Función para obtener datos de depósito
  const fetchDepositData = async (): Promise<BlindpayVirtualAccount> => {
    if (!user?.email) {
      throw new Error("No se encontró información del usuario")
    }
    
    const data = await getDepositDataForUser(user.email)
    if (!data) {
      throw new Error("No se pudieron obtener los datos de depósito")
    }
    
    return data
  }

  // Usar el hook de caché para los datos de depósito
  const depositDataCache = useDataCache(
    `deposit-data-${user?.email}`,
    fetchDepositData,
    {
      ttl: 10 * 60 * 1000, // 10 minutos para datos de depósito
      immediate: !!user?.email
    }
  )

  // Hook para invalidar caché
  const { invalidateKeys } = useCacheInvalidation()

  // Función para actualizar datos
  const refreshDepositData = async () => {
    try {
      await depositDataCache.refresh()
      toast({
        title: "Datos actualizados",
        description: "La información de depósito se ha actualizado correctamente",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron actualizar los datos de depósito",
        variant: "destructive",
      })
    }
  }

  // Función para invalidar caché de depósito (útil para futuras operaciones)
  const invalidateDepositCache = () => {
    if (user?.email) {
      invalidateKeys([`deposit-data-${user.email}`])
    }
  }

  const handleDownloadPDF = () => {
    if (selectedMethod && depositDataCache.data) {
      downloadPDF(selectedMethod, depositDataCache.data)
    }
  }

  // Mostrar loading
  if (depositDataCache.loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[#6d37d5]" />
            <p className="text-muted-foreground">Cargando información de depósito...</p>
          </div>
        </div>
      </div>
    )
  }

  // Mostrar error
  if (depositDataCache.error || !depositDataCache.data) {
    return (
      <div className="max-w-2xl mx-auto">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {depositDataCache.error || "No se pudieron cargar los datos de depósito. Por favor, intenta nuevamente."}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const renderDepositInfo = () => {
    if (!selectedMethod) return null

    const isSwift = selectedMethod === "swift"
    const depositData = depositDataCache.data

    return (
      <Card className="rounded-lg shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Información para {selectedMethod.toUpperCase()}</CardTitle>
          <CardDescription>Utiliza estos datos para realizar tu depósito</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {isSwift ? (
            <>
              <AccountField label="SWIFT/BIC Code" value={depositData.us.swift_bic_code} />
              <AccountField label="Número de cuenta" value={depositData.us.wire.account_number} maskable />
            </>
          ) : (
            <>
              <AccountField label="Routing Number" value={depositData.us[selectedMethod].routing_number} />
              <AccountField label="Número de cuenta" value={depositData.us[selectedMethod].account_number} maskable />
            </>
          )}

          <AccountField label="Nombre del beneficiario" value={depositData.us.beneficiary.name} />
          <AccountField label="Banco receptor" value={depositData.us.receiving_bank.name} />
          <AccountField label="Tipo de cuenta" value={depositData.us.account_type} />

          <div className="grid md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="text-sm font-medium text-foreground">Dirección del beneficiario</div>
              <div className="p-2 bg-muted/50 rounded border text-xs">
                <div className="text-muted-foreground">{depositData.us.beneficiary.address_line_1}</div>
                <div className="text-muted-foreground">{depositData.us.beneficiary.address_line_2}</div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-sm font-medium text-foreground">Dirección del banco receptor</div>
              <div className="p-2 bg-muted/50 rounded border text-xs">
                <div className="text-muted-foreground">{depositData.us.receiving_bank.address_line_1}</div>
                <div className="text-muted-foreground">{depositData.us.receiving_bank.address_line_2}</div>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <Button onClick={handleDownloadPDF} className="w-full" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Descargar PDF
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Instrucciones de depósito</h1>
          <p className="text-muted-foreground">
            Selecciona el método de depósito para obtener la información bancaria necesaria
          </p>
        </div>
        
        {/* Botón de actualización */}
        <Button
          variant="outline"
          size="sm"
          onClick={refreshDepositData}
          disabled={depositDataCache.loading}
          className="flex items-center space-x-2"
        >
          <RefreshCw className={`h-4 w-4 ${depositDataCache.loading ? 'animate-spin' : ''}`} />
          <span>Actualizar</span>
        </Button>
      </div>

      <div className="space-y-4">
        <Card className="rounded-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Método de depósito</CardTitle>
            <CardDescription>Elige el tipo de transferencia que utilizarás</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedMethod} onValueChange={setSelectedMethod}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona un método de depósito" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ach">ACH (Automated Clearing House)</SelectItem>
                <SelectItem value="wire">Wire Transfer</SelectItem>
                <SelectItem value="rtp">RTP (Real-Time Payments)</SelectItem>
                <SelectItem value="swift">SWIFT (Internacional)</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {renderDepositInfo()}

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            Verifica con tu banco los costos y tiempos de procesamiento. Los pagos internacionales pueden requerir
            información adicional.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  )
}
