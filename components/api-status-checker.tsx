"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from "lucide-react"

interface ApiStatus {
  receivers: "success" | "error" | "loading"
  virtualAccounts: "success" | "error" | "loading" | "idle"
  error?: string
}

export function ApiStatusChecker() {
  const [status, setStatus] = useState<ApiStatus>({
    receivers: "loading",
    virtualAccounts: "idle",
  })
  const [isVisible, setIsVisible] = useState(false)

  const checkApiStatus = async () => {
    setStatus({ receivers: "loading", virtualAccounts: "idle" })

    // Test receivers endpoint
    try {
      const receiversResponse = await fetch("/api/receivers?email=test@takenos.com")
      if (receiversResponse.ok) {
        setStatus((prev) => ({ ...prev, receivers: "success" }))

        // If receivers work, test virtual accounts
        try {
          const data = await receiversResponse.json()
          if (data.receiverId) {
            setStatus((prev) => ({ ...prev, virtualAccounts: "loading" }))
            const vaResponse = await fetch(`/api/virtual-accounts/${data.receiverId}`)
            setStatus((prev) => ({
              ...prev,
              virtualAccounts: vaResponse.ok ? "success" : "error",
              error: vaResponse.ok ? undefined : "Virtual accounts API failed",
            }))
          }
        } catch (error) {
          setStatus((prev) => ({
            ...prev,
            virtualAccounts: "error",
            error: "Virtual accounts test failed",
          }))
        }
      } else {
        const errorData = await receiversResponse.json().catch(() => ({}))
        setStatus((prev) => ({
          ...prev,
          receivers: "error",
          error: errorData.error || "Receivers API failed",
        }))
      }
    } catch (error) {
      setStatus((prev) => ({
        ...prev,
        receivers: "error",
        error: error instanceof Error ? error.message : "Network error",
      }))
    }
  }

  useEffect(() => {
    // Disabled for now - API status checker not working properly
    // if (process.env.NODE_ENV === "development") {
    //   setIsVisible(true)
    //   checkApiStatus()
    // }
  }, [])

  if (!isVisible) return null

  const getStatusIcon = (statusValue: string) => {
    switch (statusValue) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "loading":
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusBadge = (statusValue: string) => {
    switch (statusValue) {
      case "success":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            OK
          </Badge>
        )
      case "error":
        return <Badge variant="destructive">Error</Badge>
      case "loading":
        return <Badge variant="secondary">Cargando...</Badge>
      default:
        return <Badge variant="outline">Pendiente</Badge>
    }
  }

  return (
    <Card className="fixed bottom-4 right-4 w-80 z-50 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Estado de APIs</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setIsVisible(false)} className="h-6 w-6 p-0">
            ×
          </Button>
        </div>
        <CardDescription className="text-xs">Estado de integración con Blindpay</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getStatusIcon(status.receivers)}
            <span className="text-sm">Receivers API</span>
          </div>
          {getStatusBadge(status.receivers)}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getStatusIcon(status.virtualAccounts)}
            <span className="text-sm">Virtual Accounts API</span>
          </div>
          {getStatusBadge(status.virtualAccounts)}
        </div>

        {status.error && (
          <div className="p-2 bg-red-50 border border-red-200 rounded text-xs">
            <p className="text-red-600">{status.error}</p>
          </div>
        )}

        <Button
          onClick={checkApiStatus}
          size="sm"
          variant="outline"
          className="w-full bg-transparent"
          disabled={status.receivers === "loading"}
        >
          <RefreshCw className="mr-2 h-3 w-3" />
          Verificar nuevamente
        </Button>
      </CardContent>
    </Card>
  )
}
