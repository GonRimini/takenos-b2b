export type ExchangeRateDTO = {
  buy: number;
  sell: number;
  totalAsk: number;
  totalBid: number;
}

export type CriptoYaResponse = {
  ask: number;
  totalAsk: number;
  bid: number;
  totalBid: number;
}

export type CriptoYaMultiExchangeResponse = {
  [exchangeName: string]: {
    ask: number;
    totalAsk: number;
    bid: number;
    totalBid: number;
    time: number;
  }
}

// REPOSITORY for external APIs
export const createExternalRepository = () => ({
  
  async getExchangeRate(coin: string, fiat: string, volumen: number): Promise<ExchangeRateDTO> {
    const response = await fetch(`https://criptoya.com/api/${coin}/${fiat}/${volumen}`)
    
    if (!response.ok) {
      throw new Error(`Error fetching exchange rate: ${response.status} ${response.statusText}`)
    }

    const data: CriptoYaMultiExchangeResponse = await response.json()
    
    // Obtener todos los exchanges con ask válido (mayor a 0)
    const validExchanges = Object.entries(data).filter(([_, exchange]) => exchange.ask > 0)
    
    if (validExchanges.length === 0) {
      throw new Error('No hay exchanges disponibles con precios válidos')
    }
    
    // ask = precio para vender la coin y recibir fiat
    // bid = precio para comprar la coin pagando fiat
    
    const bestAsk = Math.max(...validExchanges.map(([_, exchange]) => exchange.ask)) // Mejor para vender coin
    const bestBid = Math.min(...validExchanges.map(([_, exchange]) => exchange.bid)) // Mejor para comprar coin
    
    // Calcular totales basados en el volumen
    const totalAsk = bestAsk * volumen
    const totalBid = bestBid * volumen
    
    return {
      buy: bestBid,    // Precio para comprar coin (pagar fiat)
      sell: bestAsk,   // Precio para vender coin (recibir fiat)
      totalAsk: totalAsk,
      totalBid: totalBid,
    }
  },

  async getCriptoYaExchangeRate(
    exchange: string = 'binancep2p',
    fromCurrency: string,
    toCurrency: string,
    amount: number = 25000
  ): Promise<ExchangeRateDTO> {
    const response = await fetch(`https://criptoya.com/api/${exchange}/${fromCurrency}/${toCurrency}/${amount}`)
    
    if (!response.ok) {
      throw new Error(`Error fetching exchange rate: ${response.status} ${response.statusText}`)
    }

    const data: CriptoYaResponse = await response.json()
    
    return {
      buy: data.bid,
      sell: data.ask,
      totalAsk: data.totalAsk,
      totalBid: data.totalBid,
    }
  },
})

export const useExternalRepository = () => {
  return createExternalRepository()
}