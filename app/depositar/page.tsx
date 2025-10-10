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
import { getSheetDataByGid, findRowByEmail, findAllRowsByEmail, findRowByEmailInColumn0 } from "@/lib/google-sheets"
import { downloadDepositInstructions } from "@/lib/pdf-generator"

export type DepositMethod = "ach" | "wire" | "swift" | "crypto" | "local"

export default function DepositarPage() {
  const [selectedMethod, setSelectedMethod] = useState<DepositMethod>("ach")
  
  // Obtener usuario desde Supabase
  const { user } = useAuth()
  
  // Para datos de depósito, usar el email real del usuario (sin mapeo)
  // El mapeo solo debe aplicarse en el backend para APIs externas
  const userDisplayEmail = user?.email || ""

  // Google Sheets state (ACH)
  const [sheetRows, setSheetRows] = useState<any[][] | null>(null)
  const [sheetLoading, setSheetLoading] = useState<boolean>(false)
  const [sheetError, setSheetError] = useState<string | null>(null)

  // Google Sheets state (SWIFT)
  const [swiftRows, setSwiftRows] = useState<any[][] | null>(null)
  const [swiftLoading, setSwiftLoading] = useState<boolean>(false)
  const [swiftError, setSwiftError] = useState<string | null>(null)

  // Google Sheets state (Crypto)
  const [cryptoRows, setCryptoRows] = useState<any[][] | null>(null)
  const [cryptoLoading, setCryptoLoading] = useState<boolean>(false)
  const [cryptoError, setCryptoError] = useState<string | null>(null)
  const [selectedCryptoWallet, setSelectedCryptoWallet] = useState<number>(0) // Index of selected wallet

  // Google Sheets state (Local Currency)
  const [localRows, setLocalRows] = useState<any[][] | null>(null)
  const [localLoading, setLocalLoading] = useState<boolean>(false)
  const [localError, setLocalError] = useState<string | null>(null)

  async function loadSheet() {
    try {
      setSheetLoading(true)
      setSheetError(null)
      const rows = await getSheetDataByGid(400616177)
      setSheetRows(rows)
    } catch (e: any) {
      setSheetError(e?.message || 'Error cargando Google Sheet')
    } finally {
      setSheetLoading(false)
    }
  }

  async function loadSwiftSheet() {
    try {
      setSwiftLoading(true)
      setSwiftError(null)
      const rows = await getSheetDataByGid(1293040889) // SWIFT GID
      setSwiftRows(rows)
    } catch (e: any) {
      setSwiftError(e?.message || 'Error cargando Google Sheet SWIFT')
    } finally {
      setSwiftLoading(false)
    }
  }

  async function loadCryptoSheet() {
    try {
      setCryptoLoading(true)
      setCryptoError(null)
      setSelectedCryptoWallet(0) // Reset selection when loading
      const rows = await getSheetDataByGid(0) // Crypto GID
      setCryptoRows(rows)
    } catch (e: any) {
      setCryptoError(e?.message || 'Error cargando Google Sheet Crypto')
    } finally {
      setCryptoLoading(false)
    }
  }

  async function loadLocalSheet() {
    try {
      setLocalLoading(true)
      setLocalError(null)
      const rows = await getSheetDataByGid(1068163223) // Local Currency GID
      setLocalRows(rows)
    } catch (e: any) {
      setLocalError(e?.message || 'Error cargando Google Sheet Local')
    } finally {
      setLocalLoading(false)
    }
  }

  useEffect(() => {
    if (selectedMethod === 'ach') {
      loadSheet()
    } else if (selectedMethod === 'swift') {
      loadSwiftSheet()
    } else if (selectedMethod === 'crypto') {
      loadCryptoSheet()
    } else if (selectedMethod === 'local') {
      loadLocalSheet()
    }
  }, [selectedMethod])
  
  // PDF deshabilitado temporalmente

  // Función para generar PDF con las instrucciones de depósito
  const generatePDFData = () => {
    if (!selectedMethod || !userDisplayEmail) return null

    const sheetMatch = selectedMethod === 'ach' && sheetRows ? findRowByEmail(sheetRows, userDisplayEmail) : null
    const swiftMatch = selectedMethod === 'swift' && swiftRows ? findRowByEmail(swiftRows, userDisplayEmail) : null
    const cryptoMatches = selectedMethod === 'crypto' && cryptoRows ? findAllRowsByEmail(cryptoRows, userDisplayEmail) : []
    const cryptoMatch = cryptoMatches.length > 0 ? cryptoMatches[selectedCryptoWallet] || cryptoMatches[0] : null // Use selected wallet for PDF
    const localMatch = selectedMethod === 'local' && localRows ? findRowByEmailInColumn0(localRows, userDisplayEmail) : null

    // Si no hay datos disponibles, no generar PDF
    if ((selectedMethod === 'ach' && !sheetMatch) || (selectedMethod === 'swift' && !swiftMatch) || (selectedMethod === 'crypto' && !cryptoMatch) || (selectedMethod === 'local' && !localMatch)) {
      return null
    }

    const fields: { label: string; value: string; maskable?: boolean }[] = []
    let addresses: { beneficiary?: string; bank?: string } | undefined

    if (selectedMethod === 'ach' && sheetMatch) {
      fields.push(
        { label: "Routing Number", value: String(sheetMatch[3] || "") },
        { label: "Número de cuenta", value: String(sheetMatch[2] || ""), maskable: true },
        { label: "Nombre del beneficiario", value: String(sheetMatch[4] || "") },
        { label: "Banco receptor", value: String(sheetMatch[5] || "") },
        { label: "Tipo de cuenta", value: String(sheetMatch[6] || "") }
      )
      addresses = {
        beneficiary: String(sheetMatch[7] || ""),
        bank: String(sheetMatch[8] || "")
      }
    } else if (selectedMethod === 'swift' && swiftMatch) {
      fields.push(
        { label: "SWIFT/BIC Code", value: String(swiftMatch[2] || "") },
        { label: "Número de cuenta", value: String(swiftMatch[3] || ""), maskable: true },
        { label: "Nombre del beneficiario", value: String(swiftMatch[4] || "") },
        { label: "Banco receptor", value: String(swiftMatch[5] || "") },
        { label: "Tipo de cuenta", value: String(swiftMatch[6] || "") }
      )
      addresses = {
        beneficiary: String(swiftMatch[7] || ""),
        bank: String(swiftMatch[8] || "")
      }
    } else if (selectedMethod === 'crypto' && cryptoMatch) {
      fields.push(
        { label: "Wallet", value: String(cryptoMatch[0] || "") },
        { label: "Dirección de depósito", value: String(cryptoMatch[2] || "") },
        { label: "Red/Network", value: String(cryptoMatch[3] || "") }
      )
      // Para crypto no necesitamos direcciones adicionales
    } else if (selectedMethod === 'local' && localMatch) {
      fields.push(
        { label: "Beneficiario", value: String(localMatch[1] || "") },
        { label: "Banco", value: String(localMatch[2] || "") },
        { label: "Número de cuenta", value: String(localMatch[3] || ""), maskable: true },
        { label: "NIT o Carnet", value: String(localMatch[4] || "") }
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
    const sheetMatch = method === 'ach' && sheetRows ? findRowByEmail(sheetRows, userDisplayEmail) : null
    const swiftMatch = method === 'swift' && swiftRows ? findRowByEmail(swiftRows, userDisplayEmail) : null
    const cryptoMatches = method === 'crypto' && cryptoRows ? findAllRowsByEmail(cryptoRows, userDisplayEmail) : []
    const localMatch = method === 'local' && localRows ? findRowByEmailInColumn0(localRows, userDisplayEmail) : null

    return (
      <Card className="rounded-lg shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Información para {method === 'ach' ? 'ACH/WIRE' : method === 'crypto' ? 'CRYPTO' : method === 'local' ? 'MONEDA LOCAL' : method.toUpperCase()}</CardTitle>
          <CardDescription>Utiliza estos datos para realizar tu depósito</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Preferir datos de Google Sheet si hay match; si no, placeholders */}
          {(method === 'ach' && sheetLoading) || (method === 'swift' && swiftLoading) || (method === 'crypto' && cryptoLoading) || (method === 'local' && localLoading) ? (
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Cargando...</span>
            </div>
          ) : (method === 'ach' && sheetError) || (method === 'swift' && swiftError) || (method === 'crypto' && cryptoError) || (method === 'local' && localError) ? (
            <div className="flex items-center space-x-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>Error cargando datos: {method === 'ach' ? sheetError : method === 'swift' ? swiftError : method === 'crypto' ? cryptoError : localError}</span>
            </div>
          ) : (method === 'ach' && sheetRows && !sheetMatch) || (method === 'swift' && swiftRows && !swiftMatch) || (method === 'crypto' && cryptoRows && cryptoMatches.length === 0) || (method === 'local' && localRows && !localMatch) ? (
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              <span>No se encontraron datos para {userDisplayEmail}</span>
            </div>
          ) : (method === 'ach' && sheetMatch) || (method === 'swift' && swiftMatch) || (method === 'crypto' && cryptoMatches.length > 0) || (method === 'local' && localMatch) ? (
            <>
              {method === 'ach' && sheetMatch ? (
                <>
                  <AccountField label="Routing Number" value={String(sheetMatch[3] || "")} />
                  <AccountField label="Número de cuenta" value={String(sheetMatch[2] || "")} maskable />
                  <AccountField label="Nombre del beneficiario" value={String(sheetMatch[4] || "")} />
                  <AccountField label="Banco receptor" value={String(sheetMatch[5] || "")} />
                  <AccountField label="Tipo de cuenta" value={String(sheetMatch[6] || "")} />
                </>
              ) : selectedMethod === 'swift' && swiftMatch ? (
                <>
                  <AccountField label="SWIFT/BIC Code" value={String(swiftMatch[2] || "")} />
                  <AccountField label="Número de cuenta" value={String(swiftMatch[3] || "")} maskable />
                  <AccountField label="Nombre del beneficiario" value={String(swiftMatch[4] || "")} />
                  <AccountField label="Banco receptor" value={String(swiftMatch[5] || "")} />
                  <AccountField label="Tipo de cuenta" value={String(swiftMatch[6] || "")} />
                </>
              ) : selectedMethod === 'crypto' && cryptoMatches.length > 0 ? (
                <>
                  {cryptoMatches.length > 1 && (
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
                          {cryptoMatches.map((cryptoMatch, index) => (
                            <SelectItem key={index} value={index.toString()}>
                              {String(cryptoMatch[0] || `Wallet ${index + 1}`)} - {String(cryptoMatch[3] || "")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  {cryptoMatches[selectedCryptoWallet] && (
                    <>
                      <AccountField 
                        label="Dirección de depósito" 
                        value={String(cryptoMatches[selectedCryptoWallet][2] || "")} 
                      />
                      <AccountField 
                        label="Red/Network" 
                        value={String(cryptoMatches[selectedCryptoWallet][3] || "")} 
                      />
                    </>
                  )}
                </>
              ) : selectedMethod === 'local' && localMatch ? (
                <>
                  <AccountField label="Beneficiario" value={String(localMatch[1] || "")} />
                  <AccountField label="Banco" value={String(localMatch[2] || "")} />
                  <AccountField label="Número de cuenta" value={String(localMatch[3] || "")} maskable />
                  <AccountField label="NIT o Carnet" value={String(localMatch[4] || "")} />
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
                    {(selectedMethod === 'ach' && sheetMatch) ? (sheetMatch[7] || "No disponible") 
                     : (selectedMethod === 'swift' && swiftMatch) ? (swiftMatch[7] || "No disponible")
                     : "Temporalmente no disponible"}
                  </div>
                </div>
            </div>

            <div className="space-y-1">
              <div className="text-sm font-medium text-foreground">Dirección del banco receptor</div>
              <div className="p-2 bg-muted/50 rounded border text-xs">
                  <div className="text-muted-foreground">
                    {(selectedMethod === 'ach' && sheetMatch) ? (sheetMatch[8] || "No disponible") 
                     : (selectedMethod === 'swift' && swiftMatch) ? (swiftMatch[8] || "No disponible")
                     : "Temporalmente no disponible"}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Botón de descarga de PDF */}
          {((selectedMethod === 'ach' && sheetMatch) || (selectedMethod === 'swift' && swiftMatch) || (selectedMethod === 'crypto' && cryptoMatches.length > 0) || (selectedMethod === 'local' && localMatch)) && (
            <div className="mt-6 pt-4 border-t">
              <Button
                onClick={handleDownloadPDF}
                variant="outline"
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
        
        {/* Botón de actualización: recarga Google Sheets si aplica */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => { if (selectedMethod === 'ach') { loadSheet() } }}
          disabled={selectedMethod !== 'ach' || sheetLoading}
          className="flex items-center space-x-2"
        >
          <RefreshCw className={`h-4 w-4 ${sheetLoading ? 'animate-spin' : ''}`} />
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
