'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'

export function AppQueryClientProvider({ children }: { children: React.ReactNode }) {
  // Evita recrear el cliente con HMR
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={client}>
      {children}
      {/* comentá en prod si querés */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}