"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RefreshCw, Download } from "lucide-react"
import { useAuth } from "@/components/auth"
import { downloadTransactionReceipt } from "@/lib/pdf-generator"
import { useDataCache, useCacheInvalidator } from "@/hooks/use-data-cache"
import { useAuthenticatedFetch } from "@/hooks/use-authenticated-fetch"



export default function Dashboard() {
  const { user } = useAuth()
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")
  const { invalidateKeys } = useCacheInvalidator()
  const { authenticatedFetch } = useAuthenticatedFetch()

  // Función para obtener el balance
  const fetchBalanceData = async (): Promise<{ balance: number; source: string }> => {
    if (!user?.email) throw new Error("Usuario no autenticado")
    
    const response = await authenticatedFetch("/api/balance", {
      method: "POST",
    })

    const data = await response.json()
    if (!response.ok) throw new Error(data.error || "Error al cargar el balance")
    
    return { balance: Number.parseFloat(data.balance), source: data.source }
  }

  // Función para obtener movimientos
  const fetchMovementsData = async (): Promise<any[]> => {
    if (!user?.email) throw new Error("Usuario no autenticado")
    
    const response = await authenticatedFetch("/api/transactions", {
      method: "POST",
    })

    const data = await response.json()
    if (!response.ok) throw new Error(data.error || "Error al cargar movimientos")
    
    return Array.isArray(data.data) ? data.data : []
  }

  // Función para obtener retiros pendientes
  const fetchPendingWithdrawalsData = async (): Promise<any[]> => {
    if (!user?.email) throw new Error("Usuario no autenticado")
    
    const response = await authenticatedFetch("/api/withdrawals/pending", {
      method: "GET",
    })
    const data = await response.json()
    
    if (!response.ok) throw new Error(data.error || "Error al cargar retiros pendientes")
    
    return data.success ? (data.data || []) : []
  }

  // Usar el hook de caché para cada tipo de dato
  const balanceCache = useDataCache(
    `balance-${user?.email}`,
    fetchBalanceData,
    {
      ttl: 2 * 60 * 1000, // 2 minutos para balance
      immediate: !!user?.email
    }
  )

  const movementsCache = useDataCache(
    `movements-${user?.email}`,
    fetchMovementsData,
    {
      ttl: 5 * 60 * 1000, // 5 minutos para movimientos
      immediate: !!user?.email
    }
  )

  const pendingWithdrawalsCache = useDataCache(
    `pending-withdrawals-${user?.email}`,
    fetchPendingWithdrawalsData,
    {
      ttl: 3 * 60 * 1000, // 3 minutos para retiros pendientes
      immediate: !!user?.email
    }
  )

  // Función para actualizar todos los datos
  const refreshAllData = async () => {
    console.log("[v0] Refreshing all data...")
    await Promise.all([
      balanceCache.refresh(),
      movementsCache.refresh(),
      pendingWithdrawalsCache.refresh()
    ])
  }

  // Función para invalidar caché después de operaciones
  const invalidateCacheAfterOperation = () => {
    invalidateKeys([
      `balance-${user?.email}`,
      `movements-${user?.email}`,
      `pending-withdrawals-${user?.email}`
    ])
  }



  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const formatLastUpdated = (date: Date) => {
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) {
      return "Actualizado hace unos segundos"
    } else if (diffInMinutes === 1) {
      return "Actualizado hace 1 minuto"
    } else if (diffInMinutes < 60) {
      return `Actualizado hace ${diffInMinutes} minutos`
    } else {
      const diffInHours = Math.floor(diffInMinutes / 60)
      if (diffInHours === 1) {
        return "Actualizado hace 1 hora"
      } else {
        return `Actualizado hace ${diffInHours} horas`
      }
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Completado
          </Badge>
        )
      case "pending":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            Pendiente
          </Badge>
        )
      case "failed":
        return <Badge variant="destructive">Fallido</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getWithdrawalCategoryLabel = (category: string) => {
    switch (category) {
      case "usd_bank":
        return "USD Bancario"
      case "crypto":
        return "Criptomonedas"
      case "local_currency":
        return "Moneda Local"
      default:
        return category
    }
  }

  const downloadCSV = () => {
    if (!movementsCache.data || movementsCache.data.length === 0) return

    // Filtrar movimientos por fecha si hay filtros aplicados
    const filteredMovements = filterMovementsByDate(movementsCache.data)

    // Crear headers del CSV
    const headers = ["Fecha", "Descripción", "Monto (USD)", "Tipo", "Estado"]
    
    // Crear filas de datos
    const rows = filteredMovements.map(m => [
      formatDate(m.date),
      m.description,
      m.amount.toFixed(2),
      m.type === "credit" ? "Crédito" : "Débito",
      m.status === "completed" ? "Completado" : m.status === "pending" ? "Pendiente" : "Fallido"
    ])
    
    // Combinar headers y filas
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(","))
      .join("\n")
    
    // Crear y descargar archivo
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `transacciones_${user?.email}_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const filterMovementsByDate = (movementsToFilter: any[]) => {
    console.log("[v0] Filtering movements:", movementsToFilter.length, "total")
    console.log("[v0] Start date:", startDate, "End date:", endDate)
    
    if (!startDate && !endDate) {
      console.log("[v0] No date filters, returning all:", movementsToFilter.length)
      return movementsToFilter
    }

    const filtered = movementsToFilter.filter(movement => {
      const movementDate = new Date(movement.date)
      const start = startDate ? new Date(startDate) : null
      const end = endDate ? new Date(endDate) : null

      if (start && end) {
        return movementDate >= start && movementDate <= end
      } else if (start) {
        return movementDate >= start
      } else if (end) {
        return movementDate <= end
      }
      return true
    })
    
    console.log("[v0] Filtered movements:", filtered.length)
    return filtered
  }

  const clearDateFilters = () => {
    setStartDate("")
    setEndDate("")
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Bienvenido, {user?.email}</p>
        </div>
        
        {/* Controles de actualización */}
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshAllData}
            disabled={balanceCache.loading || movementsCache.loading || pendingWithdrawalsCache.loading}
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${balanceCache.loading || movementsCache.loading || pendingWithdrawalsCache.loading ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </Button>
          

        </div>
      </div>

      {/* Balance Card */}
      <Card className="border-l-4 border-l-[#6d37d5]">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-medium text-gray-700">Balance Total</CardTitle>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1 text-xs text-gray-500">
                <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                <span>Manual</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {balanceCache.loading ? (
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-32"></div>
            </div>
          ) : balanceCache.error ? (
            <div className="text-2xl font-bold text-red-600">{balanceCache.error}</div>
          ) : balanceCache.data ? (
            <div className="text-3xl font-bold text-[#6d37d5]">{formatCurrency(balanceCache.data.balance)}</div>
          ) : (
            <div className="text-2xl font-bold text-gray-500">Balance no disponible</div>
          )}
          <p className="text-sm text-gray-500 mt-1">
            {balanceCache.loading 
              ? "Cargando..." 
              : balanceCache.error 
              ? "Verifique su información" 
              : balanceCache.lastUpdated 
              ? formatLastUpdated(balanceCache.lastUpdated)
              : "No disponible"
            }
          </p>
        </CardContent>
      </Card>

      {/* Movements Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <div>
              <CardTitle className="text-xl font-semibold">Movimientos Recientes</CardTitle>
              <p className="text-gray-600">Historial de transacciones y operaciones</p>
            </div>
            <Button
              onClick={downloadCSV}
              variant="outline"
              size="sm"
              disabled={movementsCache.loading || !movementsCache.data || movementsCache.data.length === 0}
              className="ml-4"
            >
              Descargar CSV
            </Button>
          </div>
          
          {/* Date Filters */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <label htmlFor="startDate" className="text-sm font-medium text-gray-700">
                Desde:
              </label>
              <input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <label htmlFor="endDate" className="text-sm font-medium text-gray-700">
                Hasta:
              </label>
              <input
                type="date"
                id="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            {(startDate || endDate) && (
              <Button
                onClick={clearDateFilters}
                variant="ghost"
                size="sm"
                className="text-gray-500 hover:text-gray-700"
              >
                Limpiar filtros
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="max-h-[400px] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-white z-10">
                  <TableRow>
                    <TableHead className="bg-white">Fecha</TableHead>
                    <TableHead className="bg-white">Descripción</TableHead>
                    <TableHead className="text-right bg-white">Monto</TableHead>
                    <TableHead className="bg-white">Estado</TableHead>
                    <TableHead className="text-center bg-white">Comprobante</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movementsCache.loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        Cargando...
                      </TableCell>
                    </TableRow>
                  ) : !movementsCache.data || filterMovementsByDate(movementsCache.data).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        {startDate || endDate ? "No hay movimientos en el rango de fechas seleccionado" : "No hay movimientos registrados"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filterMovementsByDate(movementsCache.data).map((m) => (
                      <TableRow key={m.id}>
                        <TableCell className="font-medium">{formatDate(m.date)}</TableCell>
                        <TableCell>{m.description}</TableCell>
                        <TableCell className={`text-right font-medium ${m.amount > 0 ? "text-green-600" : "text-red-600"}`}>
                          {formatCurrency(m.amount)}
                        </TableCell>
                        <TableCell>{getStatusBadge(m.status)}</TableCell>
                        <TableCell className="text-center">
                          <Button
                            onClick={() => downloadTransactionReceipt({
                              ...m,
                              userEmail: user?.email || ""
                            })}
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-blue-50"
                            title="Descargar comprobante"
                          >
                            <Download className="h-4 w-4 text-blue-600" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            {/* Mostrar indicador de scroll */}
            {movementsCache.data && filterMovementsByDate(movementsCache.data).length > 8 && (
              <div className="text-center py-2 text-sm text-gray-500 bg-gray-50 border-t">
                {filterMovementsByDate(movementsCache.data).length} movimientos - Desplázate para ver todos
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pending Withdrawals Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Retiros Pendientes</CardTitle>
          <p className="text-gray-600">Solicitudes de retiro en proceso</p>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha de Solicitud</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Referencia</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingWithdrawalsCache.loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      Cargando...
                    </TableCell>
                  </TableRow>
                ) : !pendingWithdrawalsCache.data || pendingWithdrawalsCache.data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      No hay retiros pendientes
                    </TableCell>
                  </TableRow>
                ) : (
                  pendingWithdrawalsCache.data.map((withdrawal: any) => (
                    <TableRow key={withdrawal.id}>
                      <TableCell className="font-medium">
                        {formatDate(withdrawal.created_at)}
                      </TableCell>
                      <TableCell>
                        {getWithdrawalCategoryLabel(withdrawal.category)}
                        {withdrawal.method && (
                          <span className="text-sm text-gray-500 ml-1">
                            ({withdrawal.method.toUpperCase()})
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium text-[#6d37d5]">
                        {formatCurrency(withdrawal.amount_numeric || 0)}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {withdrawal.payload?.reference || "Sin referencia"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                          Pendiente
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
