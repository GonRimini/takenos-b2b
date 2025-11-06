import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, TrendingUp, TrendingDown, Clock } from "lucide-react";
import type { ExchangeRateDTO } from "@/hooks/external";

interface ExchangeRateProps {
  data?: ExchangeRateDTO;
  isLoading?: boolean;
  error?: Error | null;
  fromCurrency?: string;
  toCurrency?: string;
  amount?: number;
  title?: string;
  description?: string;
}

export default function ExchangeRate({
  data: exchangeRate,
  isLoading = false,
  error = null,
  fromCurrency = "USDC",
  toCurrency = "BOB",
  amount = 25000,
  title,
  description
}: ExchangeRateProps) {

  const displayTitle = title || `Tipo de cambio ${fromCurrency} → ${toCurrency}`;
  const displayDescription = description || `Precio actual para ${amount.toLocaleString()} ${fromCurrency}`;

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Error al cargar tipo de cambio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No se pudo obtener la información del tipo de cambio. Inténtalo más tarde.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="bg-cardrounded-lg p-4 space-y-2 shadow-sm hover:shadow-md transition-shadow">
      {isLoading ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted rounded-md p-3 space-y-1">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-5 w-16" />
            </div>
            <div className="bg-muted rounded-md p-3 space-y-1">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-5 w-16" />
            </div>
          </div>
        </div>
      ) : exchangeRate ? (
        <>
          {/* Header con título */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-base font-medium text-foreground">
              Tipo de cambio {fromCurrency}→{toCurrency}
            </span>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>
                {new Date().toLocaleDateString('es-ES', {
                  day: '2-digit',
                  month: '2-digit'
                })} {new Date().toLocaleTimeString('es-ES', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          </div>
          
          {/* Compra y Venta */}
          <div className="grid grid-cols-2 gap-3">
            {/* Compra */}
            <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-md p-3">
              <div className="flex items-center gap-1 mb-1">
                <TrendingUp className="h-3 w-3 text-green-600 dark:text-green-400" />
                <span className="text-xs font-medium text-green-700 dark:text-green-300">Compra</span>
              </div>
              <p className="text-lg font-bold text-green-700 dark:text-green-300">
                {(exchangeRate.buy * 1.005 * 1.02).toFixed(2)} {toCurrency}
              </p>
            </div>

            {/* Venta */}
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md p-3">
              <div className="flex items-center gap-1 mb-1">
                <TrendingDown className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Venta</span>
              </div>
              <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
                {(exchangeRate.sell * 1.005 * 1.02).toFixed(2)} {toCurrency}
              </p>
            </div>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center text-sm text-muted-foreground">
          <AlertCircle className="h-4 w-4 mr-2" />
          Error al cargar tipo de cambio
        </div>
      )}
    </div>
  );
}
