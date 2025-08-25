import { useCallback } from 'react'
import { useCacheInvalidator } from './use-data-cache'

export function useCacheInvalidation() {
  const { invalidateKeys } = useCacheInvalidator()

  const invalidateDashboardCache = useCallback((userEmail: string) => {
    invalidateKeys([
      `balance-${userEmail}`,
      `movements-${userEmail}`,
      `pending-withdrawals-${userEmail}`
    ])
  }, [invalidateKeys])

  const invalidateBalanceCache = useCallback((userEmail: string) => {
    invalidateKeys([`balance-${userEmail}`])
  }, [invalidateKeys])

  const invalidateMovementsCache = useCallback((userEmail: string) => {
    invalidateKeys([`movements-${userEmail}`])
  }, [invalidateKeys])

  const invalidateWithdrawalsCache = useCallback((userEmail: string) => {
    invalidateKeys([`pending-withdrawals-${userEmail}`])
  }, [invalidateKeys])

  return {
    invalidateDashboardCache,
    invalidateBalanceCache,
    invalidateMovementsCache,
    invalidateWithdrawalsCache
  }
}
