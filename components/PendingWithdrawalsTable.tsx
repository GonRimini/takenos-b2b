import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { StatusBadge } from "@/components/shared/ui"
import { formatCurrency, formatDate, getWithdrawalCategoryLabel } from "@/utils/formatters"

interface PendingWithdrawalsTableProps {
  pendingWithdrawalsData: any[] | undefined
  isLoadingWithdrawals: boolean
}

export function PendingWithdrawalsTable({ 
  pendingWithdrawalsData, 
  isLoadingWithdrawals 
}: PendingWithdrawalsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-semibold">
          Retiros Pendientes
        </CardTitle>
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
              {isLoadingWithdrawals ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-8 text-gray-500"
                  >
                    Cargando...
                  </TableCell>
                </TableRow>
              ) : !pendingWithdrawalsData ||
                pendingWithdrawalsData.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-8 text-gray-500"
                  >
                    No hay retiros pendientes
                  </TableCell>
                </TableRow>
              ) : (
                pendingWithdrawalsData.map((withdrawal: any) => (
                  <TableRow key={withdrawal.id}>
                    <TableCell className="font-medium">
                      {formatDate(withdrawal.created_at)}
                    </TableCell>
                    <TableCell>
                      {withdrawal.rail ? withdrawal.rail.toUpperCase() : "N/D"}
                    </TableCell>
                    <TableCell className="font-medium text-[#6d37d5]">
                      {formatCurrency(withdrawal.initial_amount || 0)}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {withdrawal.external_reference || "Sin referencia"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={withdrawal.status || "pending"} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}