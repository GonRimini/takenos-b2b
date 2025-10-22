"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, FileText, Loader2, CheckCircle, AlertTriangle } from "lucide-react"
import { useAuth } from "@/components/auth"
import { supabase } from "@/lib/supabase-client"
import { useToast } from "@/hooks/use-toast"

type UploadStatus = "idle" | "uploading" | "sending" | "success" | "error"

export default function InformDeposit() {
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<UploadStatus>("idle")
  const [errorMessage, setErrorMessage] = useState<string>("")
  const { user } = useAuth()
  const { toast } = useToast()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.type !== "application/pdf") {
        setErrorMessage("Por favor, selecciona un archivo PDF")
        return
      }
      if (selectedFile.size > 10 * 1024 * 1024) { // 10MB limit
        setErrorMessage("El archivo es muy grande. Máximo 10MB")
        return
      }
      setFile(selectedFile)
      setErrorMessage("")
    }
  }

  const handleSubmit = async () => {
    if (!file) {
      setErrorMessage("Por favor, selecciona un archivo PDF")
      return
    }

    if (!user?.email) {
      setErrorMessage("No se pudo obtener el email del usuario")
      return
    }

    try {
      setStatus("uploading")
      setErrorMessage("")

      // 1. Crear nombre de archivo único y seguro
      const timestamp = Date.now()
      const safeFileName = file.name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // quitar tildes
        .replace(/[^a-zA-Z0-9.\-_ ]/g, "") // solo caracteres válidos
        .replace(/\s+/g, "_") // reemplazar espacios por _

      const filePath = `deposit-proofs/${user.email}/${timestamp}_${safeFileName}`

      // 2. Subir archivo a Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("proofs")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false
        })

      if (uploadError) {
        console.error("Error uploading file:", uploadError)
        throw new Error("Error al subir el archivo: " + uploadError.message)
      }

      // 3. Generar URL pública del archivo
      const { data: publicUrlData } = supabase.storage
        .from("proofs")
        .getPublicUrl(uploadData.path)

      if (!publicUrlData.publicUrl) {
        throw new Error("No se pudo generar la URL del archivo")
      }

      setStatus("sending")

      // 4. Enviar email con el link del PDF
      const emailData = {
        to: "fermin@takenos.com",
        subject: `Solicitud de Depósito : ${user.email}`,
        userEmail: user.email,
        fileName: file.name,
        fileUrl: publicUrlData.publicUrl,
        uploadDate: new Date().toLocaleString('es-ES', {
          timeZone: 'America/Argentina/Buenos_Aires',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      }

      const response = await fetch("/api/send-deposit-notification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(emailData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Error al enviar la notificación")
      }

      setStatus("success")
      toast({
        title: "Depósito informado correctamente",
        description: "Se ha enviado la notificación. Te contactaremos pronto.",
      })

      // Reset form después de éxito
      setTimeout(() => {
        setFile(null)
        setStatus("idle")
        // Reset input file
        const fileInput = document.getElementById("file-upload") as HTMLInputElement
        if (fileInput) fileInput.value = ""
      }, 3000)

    } catch (error) {
      console.error("Error in handleSubmit:", error)
      setStatus("error")
      setErrorMessage(error instanceof Error ? error.message : "Error desconocido")
      toast({
        title: "Error",
        description: "No se pudo procesar la solicitud. Inténtalo de nuevo.",
        variant: "destructive",
      })
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case "uploading":
      case "sending":
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "error":
        return <AlertTriangle className="h-5 w-5 text-red-500" />
      default:
        return <Upload className="h-5 w-5 text-muted-foreground" />
    }
  }

  const getStatusMessage = () => {
    switch (status) {
      case "uploading":
        return "Subiendo archivo..."
      case "sending":
        return "Enviando notificación..."
      case "success":
        return "¡Solicitud enviada correctamente!"
      case "error":
        return "Error al procesar la solicitud"
      default:
        return "Selecciona tu comprobante de depósito"
    }
  }

  const isLoading = status === "uploading" || status === "sending"

  return (
    <div className="space-y-4">
        
        {/* Status indicator */}
        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
          {getStatusIcon()}
          <span className="text-sm font-medium">{getStatusMessage()}</span>
        </div>

        {/* File upload */}
        <div className="space-y-2">
          <Label htmlFor="file-upload" className="text-sm font-medium">
            Comprobante de depósito (PDF)
          </Label>
          <div className="flex items-center gap-2">
            <Input
              id="file-upload"
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              disabled={isLoading || status === "success"}
              className="file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-muted file:text-muted-foreground hover:file:bg-muted/80"
            />
          </div>
          {file && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <FileText className="h-3 w-3" />
              <span>{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
            </div>
          )}
        </div>

        {/* Error message */}
        {errorMessage && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        {/* Success message */}
        {status === "success" && (
          <Alert className="border-green-200 bg-green-50 text-green-800">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription>
              Tu comprobante ha sido enviado correctamente. Procesaremos tu depósito en las próximas 24-48 horas hábiles.
            </AlertDescription>
          </Alert>
        )}

        {/* Submit button */}
        <Button 
          onClick={handleSubmit}
          disabled={!file || isLoading || status === "success"}
          className="w-full"
          variant="cta"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              {status === "uploading" ? "Subiendo..." : "Enviando..."}
            </>
          ) : status === "success" ? (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Enviado correctamente
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Enviar comprobante
            </>
          )}
        </Button>

        {/* Info alert */}
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            <strong>Información importante:</strong> Solo se aceptan archivos PDF de hasta 10MB. 
            Asegúrate de que el comprobante sea legible y contenga toda la información del depósito.
          </AlertDescription>
        </Alert>
    </div>
  )
}
