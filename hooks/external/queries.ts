import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useExternalRepository } from "./repository";

// Hook genérico para obtener tipo de cambio
export const useExchangeRateQuery = (coin: string, fiat: string, volumen: number) => {
  const repository = useExternalRepository();

  return useQuery({
    queryKey: ["external", "exchangeRate", coin, fiat, volumen],
    queryFn: () => repository.getExchangeRate(coin, fiat, volumen),
    enabled: !!(coin && fiat && volumen), // Solo ejecutar si tenemos todos los parámetros
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2, // Reintentar más veces para APIs externas
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
    placeholderData: keepPreviousData,
    networkMode: "online", // Solo funciona online (API externa)
  });
};

// Hook específico para USDC/BOB (por compatibilidad)
export const useUSDCToBOBRateQuery = (volumen: number = 25000) => {
  return useExchangeRateQuery("USDT", "BOB", volumen);
};

// Hook genérico para CriptoYa
export const useCriptoYaExchangeRateQuery = (
  fromCurrency: string,
  toCurrency: string,
  amount: number = 25000,
  exchange: string = 'binancep2p'
) => {
  const repository = useExternalRepository();

  return useQuery({
    queryKey: ["external", "criptoya", exchange, fromCurrency, toCurrency, amount],
    queryFn: () => repository.getCriptoYaExchangeRate(exchange, fromCurrency, toCurrency, amount),
    enabled: !!(fromCurrency && toCurrency), // Solo ejecutar si tenemos ambas monedas
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
    placeholderData: keepPreviousData,
    networkMode: "online",
  });
};