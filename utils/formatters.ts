export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("es-US", {
    style: "currency",
    currency: "USD",
  }).format(amount)
}

export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  })
}

export const formatLastUpdated = (date: Date) => {
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

export const getWithdrawalCategoryLabel = (category: string) => {
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