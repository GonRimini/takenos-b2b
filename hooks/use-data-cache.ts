import { useState, useEffect, useCallback, useRef } from 'react'

interface CacheItem<T> {
  data: T
  timestamp: number
  loading: boolean
  error: string | null
}

class DataCache {
  private cache = new Map<string, CacheItem<any>>()
  private defaultTTL = 5 * 60 * 1000 // 5 minutos por defecto

  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      loading: false,
      error: null
    })
  }

  get<T>(key: string): CacheItem<T> | null {
    const item = this.cache.get(key)
    if (!item) return null

    // Verificar si el caché ha expirado
    if (Date.now() - item.timestamp > this.defaultTTL) {
      this.cache.delete(key)
      return null
    }

    return item
  }

  setLoading(key: string, loading: boolean): void {
    const item = this.cache.get(key)
    if (item) {
      item.loading = loading
      this.cache.set(key, item)
    }
  }

  setError(key: string, error: string): void {
    const item = this.cache.get(key)
    if (item) {
      item.error = error
      item.loading = false
      this.cache.set(key, item)
    }
  }

  invalidate(key: string): void {
    this.cache.delete(key)
  }

  invalidateAll(): void {
    this.cache.clear()
  }

  isStale(key: string, maxAge: number = this.defaultTTL): boolean {
    const item = this.cache.get(key)
    if (!item) return true
    return Date.now() - item.timestamp > maxAge
  }
}

// Instancia global del caché
const globalCache = new DataCache()

export function useDataCache<T>(
  key: string,
  fetchFunction: () => Promise<T>,
  options: {
    ttl?: number
    immediate?: boolean
  } = {}
) {
  const {
    ttl = 5 * 60 * 1000, // 5 minutos
    immediate = true
  } = options

  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const fetchFunctionRef = useRef(fetchFunction)

  // Actualizar la referencia de la función
  fetchFunctionRef.current = fetchFunction

  const fetchData = useCallback(async (forceRefresh = false) => {
    // Verificar caché si no es un refresh forzado
    if (!forceRefresh) {
      const cached = globalCache.get<T>(key)
      if (cached && !globalCache.isStale(key, ttl)) {
        setData(cached.data)
        setLoading(false)
        setError(cached.error)
        setLastUpdated(new Date(cached.timestamp))
        return
      }
    }

    setLoading(true)
    setError(null)
    globalCache.setLoading(key, true)

    try {
      const result = await fetchFunctionRef.current()
      setData(result)
      setError(null)
      setLastUpdated(new Date())
      
      // Guardar en caché
      globalCache.set(key, result, ttl)
      globalCache.setLoading(key, false)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      setData(null)
      globalCache.setError(key, errorMessage)
    } finally {
      setLoading(false)
    }
  }, [key, ttl])

  const refresh = useCallback(() => {
    return fetchData(true)
  }, [fetchData])

  const invalidate = useCallback(() => {
    globalCache.invalidate(key)
    setData(null)
    setError(null)
    setLastUpdated(null)
  }, [key])

  // Cargar datos iniciales solo una vez
  useEffect(() => {
    if (immediate) {
      fetchData()
    }
  }, [key]) // Solo depende de la key, no de fetchData

  return {
    data,
    loading,
    error,
    lastUpdated,
    refresh,
    invalidate,
    isStale: () => globalCache.isStale(key, ttl)
  }
}

// Hook para invalidar múltiples claves de caché
export function useCacheInvalidator() {
  const invalidateAll = useCallback(() => {
    globalCache.invalidateAll()
  }, [])

  const invalidateKeys = useCallback((keys: string[]) => {
    keys.forEach(key => globalCache.invalidate(key))
  }, [])

  return { invalidateAll, invalidateKeys }
}
