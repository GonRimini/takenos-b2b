"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RefreshCw, Download } from "lucide-react"
import { useAuth } from "@/components/auth-wrapper"
import { downloadTransactionReceipt } from "@/lib/pdf-generator"



export default function Dashboard() {
  const { user } = useAuth()
  const [balance, setBalance] = useState<number | null>(null)
  const [balanceError, setBalanceError] = useState<string | null>(null)
  const [movements, setMovements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [movementsLoading, setMovementsLoading] = useState(true)
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")
  const [pendingWithdrawals, setPendingWithdrawals] = useState<any[]>([])
  const [pendingWithdrawalsLoading, setPendingWithdrawalsLoading] = useState(true)

  // Simplified balance fetching - no polling needed

  const fetchBalance = async (isRefresh = false) => {
    if (!user?.email) {
      setLoading(false)
      return
    }

    if (isRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    try {
      console.log("[v0] Fetching balance for user:", user.email)
      const response = await fetch("/api/balance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userEmail: user.email }),
      })

      const data = await response.json()
      console.log("[v0] Balance API response:", data)

      if (response.ok) {
        if (data.balance) {
          setBalance(Number.parseFloat(data.balance))
          setBalanceError(null)
          setLastUpdated(new Date())
          console.log(`[v0] Balance updated: ${data.balance} (source: ${data.source})`)
        } else {
          console.log("[v0] No balance data received")
          setBalanceError("No balance data available")
          setBalance(null)
        }
      } else {
        console.log("[v0] Balance API error:", data.error)
        setBalanceError(data.error)
        setBalance(null)
      }
    } catch (error) {
      console.error("[v0] Error fetching balance:", error)
      setBalanceError("Error al cargar el balance")
      setBalance(null)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const fetchMovements = async () => {
    if (!user?.email) {
      setMovementsLoading(false)
      return
    }
    setMovementsLoading(true)
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userEmail: user.email }),
      })
      const data = await res.json()
      console.log("[v0] Transactions API response:", data)
      console.log("[v0] Data.data length:", data.data?.length)
      console.log("[v0] Is Array:", Array.isArray(data.data))
      if (res.ok && Array.isArray(data.data)) {
        console.log("[v0] Setting movements:", data.data.length, "transactions")
        setMovements(data.data)
        console.log("[v0] Movements set successfully")
      } else {
        console.log("[v0] Setting empty movements array")
        setMovements([])
      }
    } catch (e) {
      console.error("[v0] Error fetching transactions:", e)
      setMovements([])
    } finally {
      setMovementsLoading(false)
    }
  }

  const fetchPendingWithdrawals = async () => {
    if (!user?.email) {
      setPendingWithdrawalsLoading(false)
      return
    }
    setPendingWithdrawalsLoading(true)
    try {
      const res = await fetch(`/api/withdrawals/pending?userEmail=${encodeURIComponent(user.email)}`)
      const data = await res.json()
      console.log("[v0] Pending withdrawals API response:", data)
      if (res.ok && data.success) {
        setPendingWithdrawals(data.data || [])
      } else {
        setPendingWithdrawals([])
      }
    } catch (e) {
      console.error("[v0] Error fetching pending withdrawals:", e)
      setPendingWithdrawals([])
    } finally {
      setPendingWithdrawalsLoading(false)
    }
  }

  useEffect(() => {
    console.log("[v0] useEffect triggered, user email:", user?.email)
    fetchBalance()
    fetchMovements()
    fetchPendingWithdrawals()
  }, [user?.email])

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
    if (movements.length === 0) return

    // Filtrar movimientos por fecha si hay filtros aplicados
    const filteredMovements = filterMovementsByDate(movements)

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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Bienvenido, {user?.email}</p>
      </div>

      {/* Balance Card */}
      <Card className="border-l-4 border-l-[#6d37d5]">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-medium text-gray-700">Balance Total</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchBalance(true)}
              disabled={refreshing || loading}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-32"></div>
            </div>
          ) : balanceError ? (
            <div className="text-2xl font-bold text-red-600">{balanceError}</div>
          ) : balance !== null ? (
            <div className="text-3xl font-bold text-[#6d37d5]">{formatCurrency(balance)}</div>
          ) : (
            <div className="text-2xl font-bold text-gray-500">Balance no disponible</div>
          )}
          <p className="text-sm text-gray-500 mt-1">
            {loading 
              ? "Cargando..." 
              : refreshing 
              ? "Actualizando..." 
              : balanceError 
              ? "Verifique su información" 
              : lastUpdated 
              ? formatLastUpdated(lastUpdated)
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
              disabled={movementsLoading || movements.length === 0}
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-center">Comprobante</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movementsLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      Cargando...
                    </TableCell>
                  </TableRow>
                ) : filterMovementsByDate(movements).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      {startDate || endDate ? "No hay movimientos en el rango de fechas seleccionado" : "No hay movimientos registrados"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filterMovementsByDate(movements).map((m) => (
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
                {pendingWithdrawalsLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      Cargando...
                    </TableCell>
                  </TableRow>
                ) : pendingWithdrawals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      No hay retiros pendientes
                    </TableCell>
                  </TableRow>
                ) : (
                  pendingWithdrawals.map((withdrawal) => (
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
