import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency, formatLastUpdated } from "@/utils/formatters"

interface BalanceCardProps {
  balanceData: { balance: number; lastUpdated?: Date } | undefined
  isLoadingBalance: boolean
  isErrorBalance: any
}

export function BalanceCard({ 
  balanceData, 
  isLoadingBalance, 
  isErrorBalance 
}: BalanceCardProps) {
  return (
    <Card className="border-l-4 border-l-[#6d37d5]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium text-gray-700">
            Balance Total
          </CardTitle>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 text-xs text-gray-500">
              <div className="w-2 h-2 rounded-full bg-gray-400"></div>
              <span>Manual</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoadingBalance ? (
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-32"></div>
          </div>
        ) : isErrorBalance ? (
          <div className="text-2xl font-bold text-red-600">
            {isErrorBalance}
          </div>
        ) : balanceData ? (
          <div className="text-3xl font-bold text-[#6d37d5]">
            {formatCurrency(balanceData.balance)}
          </div>
        ) : (
          <div className="text-2xl font-bold text-gray-500">
            Balance no disponible
          </div>
        )}
        <p className="text-sm text-gray-500 mt-1">
          {isLoadingBalance
            ? "Cargando..."
            : isErrorBalance
            ? "Verifique su información"
            : balanceData?.lastUpdated
            ? formatLastUpdated(balanceData.lastUpdated)
            : "No disponible"}
        </p>
      </CardContent>
    </Card>
  )
}