"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { AccountField } from "@/components/account-field"
import { Download, AlertCircle, Loader2, RefreshCw } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/components/auth"
import { getSheetDataByGid, findRowByEmail } from "@/lib/google-sheets"
import { downloadDepositInstructions } from "@/lib/pdf-generator"

export type DepositMethod = "ach" | "wire" | "swift" | "crypto"

export default function DepositarPage() {
  const [selectedMethod, setSelectedMethod] = useState<DepositMethod | "">("")
  
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
      const rows = await getSheetDataByGid(0) // Crypto GID
      setCryptoRows(rows)
    } catch (e: any) {
      setCryptoError(e?.message || 'Error cargando Google Sheet Crypto')
    } finally {
      setCryptoLoading(false)
    }
  }

  useEffect(() => {
    if (selectedMethod === 'ach') {
      loadSheet()
    } else if (selectedMethod === 'swift') {
      loadSwiftSheet()
    } else if (selectedMethod === 'crypto') {
      loadCryptoSheet()
    }
  }, [selectedMethod])
  
  // PDF deshabilitado temporalmente

  // Función para generar PDF con las instrucciones de depósito
  const generatePDFData = () => {
    if (!selectedMethod || !userDisplayEmail) return null

    const sheetMatch = selectedMethod === 'ach' && sheetRows ? findRowByEmail(sheetRows, userDisplayEmail) : null
    const swiftMatch = selectedMethod === 'swift' && swiftRows ? findRowByEmail(swiftRows, userDisplayEmail) : null
    const cryptoMatch = selectedMethod === 'crypto' && cryptoRows ? findRowByEmail(cryptoRows, userDisplayEmail) : null

    // Si no hay datos disponibles, no generar PDF
    if ((selectedMethod === 'ach' && !sheetMatch) || (selectedMethod === 'swift' && !swiftMatch) || (selectedMethod === 'crypto' && !cryptoMatch)) {
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
        { label: "Dirección de depósito", value: String(cryptoMatch[1] || "") },
        { label: "Red/Network", value: String(cryptoMatch[2] || "") }
      )
      // Para crypto no necesitamos direcciones adicionales
    }

    return {
      method: selectedMethod === 'ach' ? 'ACH/Wire' : selectedMethod === 'crypto' ? 'Criptomonedas' : selectedMethod,
      userEmail: userDisplayEmail,
      fields,
      addresses
    }
  }

  // Función para descargar el PDF
  const handleDownloadPDF = async () => {
    const pdfData = generatePDFData()
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

  const renderDepositInfo = () => {
    if (!selectedMethod) return null

    const isSwift = selectedMethod === "swift"
    const isCrypto = selectedMethod === "crypto"
    const sheetMatch = selectedMethod === 'ach' && sheetRows ? findRowByEmail(sheetRows, userDisplayEmail) : null
    const swiftMatch = selectedMethod === 'swift' && swiftRows ? findRowByEmail(swiftRows, userDisplayEmail) : null
    const cryptoMatch = selectedMethod === 'crypto' && cryptoRows ? findRowByEmail(cryptoRows, userDisplayEmail) : null

    return (
      <Card className="rounded-lg shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Información para {selectedMethod === 'ach' ? 'ACH/WIRE' : selectedMethod === 'crypto' ? 'CRIPTOMONEDAS' : selectedMethod.toUpperCase()}</CardTitle>
          <CardDescription>Utiliza estos datos para realizar tu depósito</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Preferir datos de Google Sheet si hay match; si no, placeholders */}
          {(selectedMethod === 'ach' && sheetLoading) || (selectedMethod === 'swift' && swiftLoading) || (selectedMethod === 'crypto' && cryptoLoading) ? (
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Cargando desde Google Sheets...</span>
            </div>
          ) : (selectedMethod === 'ach' && sheetError) || (selectedMethod === 'swift' && swiftError) || (selectedMethod === 'crypto' && cryptoError) ? (
            <div className="flex items-center space-x-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>Error cargando datos: {selectedMethod === 'ach' ? sheetError : selectedMethod === 'swift' ? swiftError : cryptoError}</span>
            </div>
          ) : (selectedMethod === 'ach' && sheetRows && !sheetMatch) || (selectedMethod === 'swift' && swiftRows && !swiftMatch) || (selectedMethod === 'crypto' && cryptoRows && !cryptoMatch) ? (
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              <span>No se encontraron datos para {userDisplayEmail}</span>
            </div>
          ) : (selectedMethod === 'ach' && sheetMatch) || (selectedMethod === 'swift' && swiftMatch) || (selectedMethod === 'crypto' && cryptoMatch) ? (
            <>
              {selectedMethod === 'ach' && sheetMatch ? (
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
              ) : selectedMethod === 'crypto' && cryptoMatch ? (
                <>
                  <AccountField label="Dirección de depósito" value={String(cryptoMatch[1] || "")} />
                  <AccountField label="Red/Network" value={String(cryptoMatch[2] || "")} />
                </>
              ) : null}
            </>
          ) : (
            <>
              {isCrypto ? (
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
              {!isCrypto && (
                <>
                  <AccountField label="Nombre del beneficiario" value="Temporalmente no disponible" />
                  <AccountField label="Banco receptor" value="Temporalmente no disponible" />
                  <AccountField label="Tipo de cuenta" value="Temporalmente no disponible" />
                </>
              )}
            </>
          )}

          {/* Solo mostrar direcciones para ACH y SWIFT, no para crypto */}
          {!isCrypto && (
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
          {((selectedMethod === 'ach' && sheetMatch) || (selectedMethod === 'swift' && swiftMatch) || (selectedMethod === 'crypto' && cryptoMatch)) && (
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
          <CardContent>
            <Select value={selectedMethod} onValueChange={setSelectedMethod}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona un método de depósito" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ach">ACH/Wire</SelectItem>
                <SelectItem value="swift">SWIFT (Internacional)</SelectItem>
                <SelectItem value="crypto">Criptomonedas</SelectItem>
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
