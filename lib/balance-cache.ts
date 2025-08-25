// In-memory storage for balance data (temporary solution)
export const balanceCache = new Map<string, { balance: string; timestamp: number }>()
