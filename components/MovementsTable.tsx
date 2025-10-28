import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Table as TableIcon } from "lucide-react"
import { DownloadStatement } from "@/components/DownloadStatement"
import { WithdrawalPDFButton } from "@/components/WithdrawalPDFButton"
import { DepositPdfButton } from "@/components/DownloadDeposit"
import { StatusBadge } from "@/components/shared/ui"
import { TransactionTypeBadge } from "@/components/TransactionTypeBadge"
import { formatCurrency, formatDate } from "@/utils/formatters"

interface MovementsTableProps {
  movementsData: any[] | undefined
  isLoadingMovements: boolean
  userEmail: string | undefined
}

export function MovementsTable({ movementsData, isLoadingMovements, userEmail }: MovementsTableProps) {
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")

  const downloadCSV = () => {
    if (!movementsData || movementsData.length === 0) return

    // Filtrar movimientos por fecha si hay filtros aplicados
    const filteredMovements = filterMovementsByDate(movementsData)

    // Crear headers del CSV
    const headers = [
      "Fecha",
      "Tipo Transacción",
      "Descripción",
      "Monto (USD)",
      "Cuenta/Destino",
      "Tipo",
      "Estado",
    ]

    // Crear filas de datos
    const rows = filteredMovements.map((m) => [
      formatDate(m.date),
      m.raw_type === "deposit"
        ? "Depósito"
        : m.raw_type === "withdrawal"
        ? "Retiro"
        : "Otro",
      m.description,
      m.amount.toFixed(2),
      m.account_ref || "-",
      m.type === "credit" ? "Crédito" : "Débito",
      m.status === "completed"
        ? "Completado"
        : m.status === "pending"
        ? "Pendiente"
        : "Fallido",
    ])

    // Combinar headers y filas
    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n")

    // Crear y descargar archivo
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute(
      "download",
      `transacciones_${userEmail}_${
        new Date().toISOString().split("T")[0]
      }.csv`
    )
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const filterMovementsByDate = (movementsToFilter: any[]) => {
    if (!startDate && !endDate) {
      return movementsToFilter
    }

    const filtered = movementsToFilter.filter((movement) => {
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

    return filtered
  }

  const clearDateFilters = () => {
    setStartDate("")
    setEndDate("")
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <div>
            <CardTitle className="text-xl font-semibold">
              Movimientos Recientes
            </CardTitle>
            <p className="text-gray-600">
              Historial de transacciones y operaciones
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={downloadCSV}
              variant="cta"
              size="sm"
              disabled={
                isLoadingMovements ||
                !movementsData ||
                movementsData.length === 0
              }
            >
              <TableIcon className="w-4 h-4" />
              Descargar CSV
            </Button>
            <DownloadStatement
              data={movementsData || []}
              disabled={
                isLoadingMovements ||
                !movementsData ||
                movementsData.length === 0
              }
            />
          </div>
        </div>

        {/* Date Filters */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label
              htmlFor="startDate"
              className="text-sm font-medium text-gray-700"
            >
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
            <label
              htmlFor="endDate"
              className="text-sm font-medium text-gray-700"
            >
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
          <div className="max-h-[500px] overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-white z-10">
                <TableRow>
                  <TableHead className="bg-white">Fecha</TableHead>
                  <TableHead className="bg-white">Tipo</TableHead>
                  <TableHead className="bg-white">Cuenta/Destino</TableHead>
                  <TableHead className="text-right bg-white">Monto</TableHead>
                  <TableHead className="bg-white">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingMovements ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-8 text-gray-500"
                    >
                      Cargando...
                    </TableCell>
                  </TableRow>
                ) : !movementsData ||
                  filterMovementsByDate(movementsData).length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-8 text-gray-500"
                    >
                      {startDate || endDate
                        ? "No hay movimientos en el rango de fechas seleccionado"
                        : "No hay movimientos registrados"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filterMovementsByDate(movementsData).map((m) => {
                    return (
                      <TableRow key={m.id}>
                        <TableCell className="font-medium">
                          {formatDate(m.date)}
                        </TableCell>
                        <TableCell>
                          <TransactionTypeBadge
                            rawType={m.raw_type}
                            direction={m.direction}
                          />
                        </TableCell>
                        <TableCell>{m.account_ref}</TableCell>
                        <TableCell
                          className={`text-right font-medium ${
                            m.amount > 0 ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {formatCurrency(m.amount)}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={m.status} />
                        </TableCell>
                        <TableCell>
                          {m.raw_type === "withdrawal" ? (
                            <WithdrawalPDFButton
                              withdrawalId={m.raw_id}
                              transaction={m}
                            />
                          ) : m.raw_type === "deposit" ? (
                            <DepositPdfButton depositId={m.raw_id || m.id} />
                          ) : (
                            <span></span>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
          {/* Mostrar indicador de scroll */}
          {movementsData &&
            filterMovementsByDate(movementsData).length > 8 && (
              <div className="text-center py-2 text-sm text-gray-500 bg-gray-50 border-t">
                {filterMovementsByDate(movementsData).length} movimientos -
                Desplázate para ver todos
              </div>
            )}
        </div>
      </CardContent>
    </Card>
  )
}