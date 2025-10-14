"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { AccountField } from "@/components/account-field"
import { Download, AlertCircle, Loader2, RefreshCw } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/components/auth"
import { getDepositoACH, getDepositoSWIFT, getDepositosCrypto, getDepositoLocal, DepositoACH, DepositoSWIFT, DepositoCrypto, DepositoLocal } from "@/lib/depositos"
import { downloadDepositInstructions } from "@/lib/pdf-generator"

export type DepositMethod = "ach" | "wire" | "swift" | "crypto" | "local"

export default function DepositarPage() {
  const [selectedMethod, setSelectedMethod] = useState<DepositMethod>("ach")
  
  // Obtener usuario desde Supabase
  const { user } = useAuth()
  
  // Para datos de depósito, usar el email real del usuario (sin mapeo)
  // El mapeo solo debe aplicarse en el backend para APIs externas
  const userDisplayEmail = user?.email || ""

  // Supabase state (ACH)
  const [achData, setAchData] = useState<DepositoACH | null>(null)
  const [achLoading, setAchLoading] = useState<boolean>(false)
  const [achError, setAchError] = useState<string | null>(null)

  // Supabase state (SWIFT)
  const [swiftData, setSwiftData] = useState<DepositoSWIFT | null>(null)
  const [swiftLoading, setSwiftLoading] = useState<boolean>(false)
  const [swiftError, setSwiftError] = useState<string | null>(null)

  // Supabase state (Crypto)
  const [cryptoData, setCryptoData] = useState<DepositoCrypto[]>([])
  const [cryptoLoading, setCryptoLoading] = useState<boolean>(false)
  const [cryptoError, setCryptoError] = useState<string | null>(null)
  const [selectedCryptoWallet, setSelectedCryptoWallet] = useState<number>(0) // Index of selected wallet

  // Supabase state (Local Currency)
  const [localData, setLocalData] = useState<DepositoLocal | null>(null)
  const [localLoading, setLocalLoading] = useState<boolean>(false)
  const [localError, setLocalError] = useState<string | null>(null)

  async function loadACH() {
    if (!userDisplayEmail) return
    try {
      setAchLoading(true)
      setAchError(null)
      setAchData(null) // Limpiar datos anteriores
      const data = await getDepositoACH(userDisplayEmail)
      setAchData(data)
      if (!data) {
        setAchError('No se encontraron datos ACH para este usuario')
      }
    } catch (e: any) {
      setAchError(e?.message || 'Error cargando datos ACH')
      setAchData(null)
    } finally {
      setAchLoading(false)
    }
  }

  async function loadSWIFT() {
    if (!userDisplayEmail) return
    try {
      setSwiftLoading(true)
      setSwiftError(null)
      setSwiftData(null) // Limpiar datos anteriores
      const data = await getDepositoSWIFT(userDisplayEmail)
      setSwiftData(data)
      if (!data) {
        setSwiftError('No se encontraron datos SWIFT para este usuario')
      }
    } catch (e: any) {
      setSwiftError(e?.message || 'Error cargando datos SWIFT')
      setSwiftData(null)
    } finally {
      setSwiftLoading(false)
    }
  }

  async function loadCrypto() {
    if (!userDisplayEmail) return
    try {
      setCryptoLoading(true)
      setCryptoError(null)
      setCryptoData([]) // Limpiar datos anteriores
      setSelectedCryptoWallet(0) // Reset selection when loading
      const data = await getDepositosCrypto(userDisplayEmail)
      setCryptoData(data)
      if (data.length === 0) {
        setCryptoError('No se encontraron wallets crypto para este usuario')
      }
    } catch (e: any) {
      setCryptoError(e?.message || 'Error cargando datos Crypto')
      setCryptoData([])
    } finally {
      setCryptoLoading(false)
    }
  }

  async function loadLocal() {
    if (!userDisplayEmail) return
    try {
      setLocalLoading(true)
      setLocalError(null)
      setLocalData(null) // Limpiar datos anteriores
      const data = await getDepositoLocal(userDisplayEmail)
      setLocalData(data)
      if (!data) {
        setLocalError('No se encontraron datos de moneda local para este usuario')
      }
    } catch (e: any) {
      setLocalError(e?.message || 'Error cargando datos de moneda local')
      setLocalData(null)
    } finally {
      setLocalLoading(false)
    }
  }

  useEffect(() => {
    if (!userDisplayEmail) return
    
    // Limpiar datos de otros métodos cuando cambias de tab (para evitar mostrar datos viejos)
    if (selectedMethod !== 'ach') {
      setAchData(null)
      setAchError(null)
    }
    if (selectedMethod !== 'swift') {
      setSwiftData(null)
      setSwiftError(null)
    }
    if (selectedMethod !== 'crypto') {
      setCryptoData([])
      setCryptoError(null)
      setSelectedCryptoWallet(0)
    }
    if (selectedMethod !== 'local') {
      setLocalData(null)
      setLocalError(null)
    }
    
    // Cargar datos del método seleccionado
    if (selectedMethod === 'ach') {
      loadACH()
    } else if (selectedMethod === 'swift') {
      loadSWIFT()
    } else if (selectedMethod === 'crypto') {
      loadCrypto()
    } else if (selectedMethod === 'local') {
      loadLocal()
    }
  }, [selectedMethod, userDisplayEmail])
  
  // PDF deshabilitado temporalmente

  // Función para generar PDF con las instrucciones de depósito
  const generatePDFData = () => {
    if (!selectedMethod || !userDisplayEmail) return null

    // Si no hay datos disponibles, no generar PDF
    if ((selectedMethod === 'ach' && !achData) || (selectedMethod === 'swift' && !swiftData) || (selectedMethod === 'crypto' && cryptoData.length === 0) || (selectedMethod === 'local' && !localData)) {
      return null
    }

    const fields: { label: string; value: string; maskable?: boolean }[] = []
    let addresses: { beneficiary?: string; bank?: string } | undefined

    if (selectedMethod === 'ach' && achData) {
      fields.push(
        { label: "Routing Number", value: achData.routing_number || "" },
        { label: "Número de cuenta", value: achData.account_number || "", maskable: true },
        { label: "Nombre del beneficiario", value: achData.beneficiary_name || "" },
        { label: "Banco receptor", value: achData.receiver_bank || "" },
        { label: "Tipo de cuenta", value: achData.account_type || "" }
      )
      addresses = {
        beneficiary: achData.beneficiary_address || "",
        bank: achData.beneficiary_bank_address || ""
      }
    } else if (selectedMethod === 'swift' && swiftData) {
      fields.push(
        { label: "SWIFT/BIC Code", value: swiftData.swift_bic_code || "" },
        { label: "Número de cuenta", value: swiftData.account_number || "", maskable: true },
        { label: "Nombre del beneficiario", value: swiftData.beneficiary_name || "" },
        { label: "Banco receptor", value: swiftData.receiver_bank || "" },
        { label: "Tipo de cuenta", value: swiftData.account_type || "" }
      )
      addresses = {
        beneficiary: swiftData.beneficiary_address || "",
        bank: swiftData.beneficiary_bank_address || ""
      }
    } else if (selectedMethod === 'crypto' && cryptoData.length > 0) {
      const selectedWallet = cryptoData[selectedCryptoWallet] || cryptoData[0]
      fields.push(
        { label: "Wallet", value: selectedWallet.title || "" },
        { label: "Dirección de depósito", value: selectedWallet.deposit_address || "" },
        { label: "Red/Network", value: selectedWallet.network || "" }
      )
      // Para crypto no necesitamos direcciones adicionales
    } else if (selectedMethod === 'local' && localData) {
      fields.push(
        { label: "Beneficiario", value: localData.beneficiario || "" },
        { label: "Banco", value: localData.banco || "" },
        { label: "Número de cuenta", value: localData.nro_de_cuenta || "", maskable: true },
        { label: "Identificación", value: localData.identificacion || "" },
        { label: "CBU", value: localData.cbu || "" },
        { label: "Alias", value: localData.alias || "" }
      )
      // Para moneda local no necesitamos direcciones adicionales
    }
    return {
      method: selectedMethod === 'ach' ? 'ACH/Wire' : selectedMethod === 'crypto' ? 'Crypto' : selectedMethod === 'local' ? 'Moneda Local' : selectedMethod,
      userEmail: userDisplayEmail,
      fields,
      addresses
    }
  }

  // Función para descargar el PDF
  const handleDownloadPDF = async () => {
    const pdfData = generatePDFData()
    console.log('PDF DATOS', pdfData)
    if (pdfData) {
      try {
        await downloadDepositInstructions(pdfData)
      } catch (error) {
        console.error('Error generando PDF:', error)
        alert('Error al generar el PDF. Por favor, inténtelo de nuevo.')
      }
    }
  }

  // Loading se maneja a nivel de sección según método seleccionado

  // No devolvemos temprano en caso de error: mostramos aviso pero permitimos elegir método

  const renderDepositContent = (method: DepositMethod) => {
    const isSwift = method === "swift"
    const isCrypto = method === "crypto"
    const isLocal = method === "local"
    const hasACHData = method === 'ach' && achData !== null
    const hasSWIFTData = method === 'swift' && swiftData !== null
    const hasCryptoData = method === 'crypto' && cryptoData.length > 0
    const hasLocalData = method === 'local' && localData !== null

    return (
      <Card className="rounded-lg shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Información para {method === 'ach' ? 'ACH/WIRE' : method === 'crypto' ? 'CRYPTO' : method === 'local' ? 'MONEDA LOCAL' : method.toUpperCase()}</CardTitle>
          <CardDescription>Utiliza estos datos para realizar tu depósito</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Mostrar loading, error o datos según el estado */}
          {(method === 'ach' && achLoading) || (method === 'swift' && swiftLoading) || (method === 'crypto' && cryptoLoading) || (method === 'local' && localLoading) ? (
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Cargando...</span>
            </div>
          ) : (method === 'ach' && achError) || (method === 'swift' && swiftError) || (method === 'crypto' && cryptoError) || (method === 'local' && localError) ? (
            <div className="flex items-center space-x-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>Error cargando datos: {method === 'ach' ? achError : method === 'swift' ? swiftError : method === 'crypto' ? cryptoError : localError}</span>
            </div>
          ) : !hasACHData && !hasSWIFTData && !hasCryptoData && !hasLocalData ? (
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              <span>No se encontraron datos para {userDisplayEmail}</span>
            </div>
          ) : (hasACHData || hasSWIFTData || hasCryptoData || hasLocalData) ? (
            <>
              {method === 'ach' && achData ? (
                <>
                  <AccountField label="Routing Number" value={achData.routing_number || ""} />
                  <AccountField label="Número de cuenta" value={achData.account_number || ""} maskable />
                  <AccountField label="Nombre del beneficiario" value={achData.beneficiary_name || ""} />
                  <AccountField label="Banco receptor" value={achData.receiver_bank || ""} />
                  <AccountField label="Tipo de cuenta" value={achData.account_type || ""} />
                </>
              ) : selectedMethod === 'swift' && swiftData ? (
                <>
                  <AccountField label="SWIFT/BIC Code" value={swiftData.swift_bic_code || ""} />
                  <AccountField label="Número de cuenta" value={swiftData.account_number || ""} maskable />
                  <AccountField label="Nombre del beneficiario" value={swiftData.beneficiary_name || ""} />
                  <AccountField label="Banco receptor" value={swiftData.receiver_bank || ""} />
                  <AccountField label="Tipo de cuenta" value={swiftData.account_type || ""} />
                </>
              ) : selectedMethod === 'crypto' && cryptoData.length > 0 ? (
                <>
                  {cryptoData.length > 1 && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Selecciona tu wallet</label>
                      <Select 
                        value={selectedCryptoWallet.toString()} 
                        onValueChange={(value) => setSelectedCryptoWallet(parseInt(value))}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecciona una wallet" />
                        </SelectTrigger>
                        <SelectContent>
                          {cryptoData.map((wallet, index) => (
                            <SelectItem key={index} value={index.toString()}>
                              {wallet.title || `Wallet ${index + 1}`} - {wallet.network || ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  {cryptoData[selectedCryptoWallet] && (
                    <>
                      <AccountField 
                        label="Dirección de depósito" 
                        value={cryptoData[selectedCryptoWallet].deposit_address || ""} 
                      />
                      <AccountField 
                        label="Red/Network" 
                        value={cryptoData[selectedCryptoWallet].network || ""} 
                      />
                    </>
                  )}
                </>
              ) : selectedMethod === 'local' && localData ? (
                <>
                  <AccountField label="Beneficiario" value={localData.beneficiario || ""} />
                  <AccountField label="Banco" value={localData.banco || ""} />
                  <AccountField label="Número de cuenta" value={localData.nro_de_cuenta || ""} maskable />
                  <AccountField label="Identificación" value={localData.identificacion || ""} />
                  {localData.cbu && <AccountField label="CBU" value={localData.cbu || ""} />} 
                  {localData.alias && <AccountField label="Alias" value={localData.alias || ""} />}
                </>
              ) : null}
            </>
          ) : (
            <>
              {isLocal ? (
                <>
                  <AccountField label="Beneficiario" value="Temporalmente no disponible" />
                  <AccountField label="Banco" value="Temporalmente no disponible" />
                  <AccountField label="Número de cuenta" value="Temporalmente no disponible" />
                  <AccountField label="NIT o Carnet" value="Temporalmente no disponible" />
                </>
              ) : isCrypto ? (
                <>
                  <AccountField label="Dirección de depósito" value="Temporalmente no disponible" />
                  <AccountField label="Red/Network" value="Temporalmente no disponible" />
                </>
              ) : isSwift ? (
                <>
                  <AccountField label="SWIFT/BIC Code" value="Temporalmente no disponible" />
                  <AccountField label="Número de cuenta" value="Temporalmente no disponible" />
                </>
              ) : (
                <>
                  <AccountField label="Routing Number" value="Temporalmente no disponible" />
                  <AccountField label="Número de cuenta" value="Temporalmente no disponible" />
                </>
              )}
              {!isCrypto && !isLocal && (
                <>
                  <AccountField label="Nombre del beneficiario" value="Temporalmente no disponible" />
                  <AccountField label="Banco receptor" value="Temporalmente no disponible" />
                  <AccountField label="Tipo de cuenta" value="Temporalmente no disponible" />
                </>
              )}
            </>
          )}

          {/* Solo mostrar direcciones para ACH y SWIFT, no para crypto ni local */}
          {!isCrypto && !isLocal && (
          <div className="grid md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="text-sm font-medium text-foreground">Dirección del beneficiario</div>
              <div className="p-2 bg-muted/50 rounded border text-xs">
                  <div className="text-muted-foreground">
                    {(selectedMethod === 'ach' && achData) ? (achData.beneficiary_address || "No disponible") 
                     : (selectedMethod === 'swift' && swiftData) ? (swiftData.beneficiary_address || "No disponible")
                     : "Temporalmente no disponible"}
                  </div>
                </div>
            </div>

            <div className="space-y-1">
              <div className="text-sm font-medium text-foreground">Dirección del banco receptor</div>
              <div className="p-2 bg-muted/50 rounded border text-xs">
                  <div className="text-muted-foreground">
                    {(selectedMethod === 'ach' && achData) ? (achData.beneficiary_bank_address || "No disponible") 
                     : (selectedMethod === 'swift' && swiftData) ? (swiftData.beneficiary_bank_address || "No disponible")
                     : "Temporalmente no disponible"}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Botón de descarga de PDF */}
          {((selectedMethod === 'ach' && achData) || (selectedMethod === 'swift' && swiftData) || (selectedMethod === 'crypto' && cryptoData.length > 0) || (selectedMethod === 'local' && localData)) && (
            <div className="mt-6 pt-4 border-t">
              <Button
                onClick={handleDownloadPDF}
                variant="cta"
                className="w-full sm:w-auto"
              >
                <Download className="w-4 h-4 mr-2" />
                Descargar Instrucciones PDF
            </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Descarga un PDF con toda la información de depósito para conservar
              </p>
          </div>
          )}
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
          variant="cta"
          size="sm"
          onClick={() => { 
            if (selectedMethod === 'ach') loadACH()
            else if (selectedMethod === 'swift') loadSWIFT()
            else if (selectedMethod === 'crypto') loadCrypto()
            else if (selectedMethod === 'local') loadLocal()
          }}
          disabled={achLoading || swiftLoading || cryptoLoading || localLoading}
          className="flex items-center space-x-2"
        >
          <RefreshCw className={`h-4 w-4 ${(achLoading || swiftLoading || cryptoLoading || localLoading) ? 'animate-spin' : ''}`} />
          <span>Actualizar</span>
        </Button>
      </div>

      <div className="space-y-4">
        <Card className="rounded-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Método de depósito</CardTitle>
            <CardDescription>Elige el tipo de transferencia que utilizarás</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs value={selectedMethod} onValueChange={(value) => setSelectedMethod(value as DepositMethod)} className="w-full">
              <TabsList className="grid w-full grid-cols-4 rounded-none border-b bg-transparent p-0">
                <TabsTrigger 
                  value="ach" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#6d37d5] data-[state=active]:bg-transparent data-[state=active]:text-[#6d37d5] data-[state=active]:shadow-none"
                >
                  ACH/Wire
                </TabsTrigger>
                <TabsTrigger 
                  value="swift" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#6d37d5] data-[state=active]:bg-transparent data-[state=active]:text-[#6d37d5] data-[state=active]:shadow-none"
                >
                  SWIFT
                </TabsTrigger>
                <TabsTrigger 
                  value="crypto" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#6d37d5] data-[state=active]:bg-transparent data-[state=active]:text-[#6d37d5] data-[state=active]:shadow-none"
                >
                  Crypto
                </TabsTrigger>
                <TabsTrigger 
                  value="local" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#6d37d5] data-[state=active]:bg-transparent data-[state=active]:text-[#6d37d5] data-[state=active]:shadow-none"
                >
                  Moneda Local
                </TabsTrigger>
              </TabsList>
              
              <div className="p-6">
                <TabsContent value="ach" className="mt-0">
                  {renderDepositContent("ach")}
                </TabsContent>
                
                <TabsContent value="swift" className="mt-0">
                  {renderDepositContent("swift")}
                </TabsContent>
                
                <TabsContent value="crypto" className="mt-0">
                  {renderDepositContent("crypto")}
                </TabsContent>
                
                <TabsContent value="local" className="mt-0">
                  {renderDepositContent("local")}
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>

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
