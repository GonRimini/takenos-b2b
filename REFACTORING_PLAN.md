# 🚀 Plan de Refactorización - Takenos B2B

## 📊 Estado Actual vs. Estado Objetivo

### Estado Actual
```
├── Manual State Management
│   ├── useDataCache (custom hook)
│   ├── useAuthenticatedFetch (custom hook)
│   └── localStorage/sessionStorage manual
├── Heavy AuthProvider
│   ├── User state
│   ├── Session management
│   ├── Route protection
│   └── Authentication methods
└── Component-level data fetching
    ├── Dashboard fetches
    ├── Deposit data fetches
    └── Balance queries
```

### Estado Objetivo
```
├── React Query (Server State)
│   ├── API queries & mutations
│   ├── Background refetching
│   ├── Optimistic updates
│   └── Error boundaries
├── Zustand (Client State)
│   ├── UI preferences
│   ├── Form state
│   ├── Modal states
│   └── Navigation state
├── Optimized Contexts
│   ├── AuthContext (solo auth)
│   ├── ThemeContext (UI preferences)
│   └── CompanyContext (company data)
└── Component Optimization
    ├── Memoized components
    ├── Lazy loading
    └── Suspense boundaries
```

## 🎯 Fases de Implementación

### **Fase 0: Modularización de Componentes (Semana 1-2)**
**Objetivo**: Aplicar Atomic Design para crear componentes reutilizables y mantenibles

#### 0.1 Estructura de Carpetas por Features y Shared
```
components/
├── shared/
│   ├── ui/                    # Componentes básicos reutilizables
│   │   ├── CurrencyDisplay.tsx
│   │   ├── StatusBadge.tsx
│   │   ├── DateFormatter.tsx
│   │   ├── CurrencyInput.tsx
│   │   └── FileUploadWithPreview.tsx
│   ├── forms/                 # Componentes de formularios compartidos
│   │   ├── FormField.tsx
│   │   └── FormValidation.tsx
│   └── layout/                # Layouts y estructuras compartidas
│       ├── PageHeader.tsx
│       └── PageContainer.tsx
├── dashboard/
│   ├── BalanceCard.tsx
│   ├── TransactionsTable.tsx
│   ├── TransactionStatusBadge.tsx
│   └── PendingWithdrawalsPanel.tsx
├── withdrawal/
│   ├── PayoutAccountSelector.tsx
│   ├── WithdrawalForm.tsx
│   ├── WithdrawalWizardLayout.tsx
│   └── AccountCreationForm.tsx
├── deposit/
│   ├── DepositMethodTabs.tsx
│   ├── DepositInstructionsCard.tsx
│   ├── DepositLayout.tsx
│   └── InformDepositForm.tsx
└── views/                     # Componentes de vista/página completa
    ├── DashboardView.tsx
    ├── WithdrawalView.tsx
    └── DepositView.tsx
```

#### 0.2 Componentes de Alta Prioridad (Primera Semana)

**� Shared UI - Componentes Básicos Reutilizables**

```typescript
// components/shared/ui/StatusBadge.tsx
interface StatusBadgeProps {
  status: string
  variant?: 'default' | 'compact'
  type?: 'transaction' | 'withdrawal' | 'deposit'
}

export function StatusBadge({ status, variant = 'default', type = 'transaction' }: StatusBadgeProps) {
  // Lógica unificada para todos los tipos de status
}
```

```typescript
// components/dashboard/TransactionStatusBadge.tsx
interface TransactionStatusBadgeProps {
  status: string
  variant?: 'default' | 'compact'
}

export function TransactionStatusBadge({ status, variant = 'default' }: TransactionStatusBadgeProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "completed":
        return { variant: "default" as const, className: "bg-green-100 text-green-800", label: "Completado" }
      case "pending":
        return { variant: "secondary" as const, className: "bg-yellow-100 text-yellow-800", label: "Pendiente" }
      case "awaiting":
        return { variant: "secondary" as const, className: "bg-blue-100 text-blue-800", label: "Esperando Pago" }
      case "cancelled":
        return { variant: "secondary" as const, className: "bg-gray-100 text-gray-800", label: "Cancelado" }
      case "failed":
        return { variant: "destructive" as const, className: "", label: "Fallido" }
      default:
        return { variant: "outline" as const, className: "", label: status }
    }
  }

  const config = getStatusConfig(status)
  
  return (
    <Badge variant={config.variant} className={config.className}>
      {config.label}
    </Badge>
  )
}
```

```typescript
// components/shared/ui/CurrencyInput.tsx
interface CurrencyInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  error?: string
}

export function CurrencyInput({ 
  value, 
  onChange, 
  placeholder = "0.00",
  disabled = false,
  className,
  error 
}: CurrencyInputProps) {
  const formatCurrency = (inputValue: string) => {
    let cleanValue = inputValue.replace(/[^0-9.]/g, "")
    const parts = cleanValue.split(".")
    
    if (parts.length > 2) {
      cleanValue = parts[0] + "." + parts.slice(1).join("")
    }
    
    if (parts[1] && parts[1].length > 2) {
      cleanValue = parts[0] + "." + parts[1].substring(0, 2)
    }
    
    if (!cleanValue) return ""
    
    if (cleanValue.includes(".")) {
      const [integerPart, decimalPart] = cleanValue.split(".")
      const formattedInteger = new Intl.NumberFormat("en-US").format(
        Number.parseInt(integerPart || "0")
      )
      return decimalPart !== undefined ? `${formattedInteger}.${decimalPart}` : formattedInteger
    } else {
      return new Intl.NumberFormat("en-US").format(Number.parseInt(cleanValue))
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrency(e.target.value)
    onChange(formatted)
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground font-mono">
          $
        </span>
        <Input
          type="text"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          className={cn("pl-10 font-mono h-9", className)}
        />
      </div>
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  )
}
```

```typescript
// components/dashboard/BalanceCard.tsx
interface BalanceCardProps {
  balance: number
  source: string
  loading?: boolean
  lastUpdated?: Date
  onRefresh?: () => void
}

export function BalanceCard({ 
  balance, 
  source, 
  loading = false, 
  lastUpdated, 
  onRefresh 
}: BalanceCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const formatLastUpdated = (date: Date) => {
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return "Actualizado hace unos segundos"
    if (diffInMinutes === 1) return "Actualizado hace 1 minuto"
    if (diffInMinutes < 60) return `Actualizado hace ${diffInMinutes} minutos`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours === 1) return "Actualizado hace 1 hora"
    return `Actualizado hace ${diffInHours} horas`
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">Balance Disponible</CardTitle>
        {onRefresh && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {loading ? (
            <div className="h-8 bg-muted animate-pulse rounded" />
          ) : (
            formatCurrency(balance)
          )}
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
          <span>Fuente: {source}</span>
          {lastUpdated && (
            <span>{formatLastUpdated(lastUpdated)}</span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
```

#### 0.3 Componentes de Media Prioridad (Segunda Semana)

**� Withdrawal - Componentes de Retiros**

```typescript
// components/withdrawal/PayoutAccountSelector.tsx
interface PayoutAccount {
  id: string
  nickname: string
  category: string
  method?: string
  beneficiary_bank?: string
  wallet_network?: string
  wallet_address?: string
  local_bank?: string
  country?: string
  last4?: string
}

interface PayoutAccountSelectorProps {
  accounts: PayoutAccount[]
  selectedAccount: PayoutAccount | null
  onAccountSelect: (account: PayoutAccount) => void
  onCreateNew: () => void
  loading?: boolean
}

export function PayoutAccountSelector({ 
  accounts, 
  selectedAccount, 
  onAccountSelect, 
  onCreateNew, 
  loading = false 
}: PayoutAccountSelectorProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const getAccountDescription = (account: PayoutAccount) => {
    if (account.category === "usd_bank") {
      return `${account.method?.toUpperCase()} - ${account.beneficiary_bank}`
    }
    if (account.category === "crypto") {
      return `${account.wallet_network} - ${account.wallet_address?.slice(0, 10)}...`
    }
    if (account.category === "local_currency") {
      return `${account.local_bank} - ${account.country}`
    }
    return account.category
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Cuentas existentes */}
      {accounts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Cuentas guardadas</CardTitle>
            <CardDescription>
              Selecciona una cuenta existente para el retiro
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  Ver cuentas guardadas ({accounts.length})
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 mt-4">
                {accounts.map((account) => (
                  <Card 
                    key={account.id} 
                    className={cn(
                      "cursor-pointer transition-colors hover:bg-muted/50",
                      selectedAccount?.id === account.id && "ring-2 ring-primary"
                    )}
                    onClick={() => onAccountSelect(account)}
                  >
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">
                            {account.nickname || "Cuenta sin nombre"}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {getAccountDescription(account)}
                          </p>
                        </div>
                        <Button variant="default" size="sm">
                          Seleccionar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>
      )}

      {/* Divisor */}
      <div className="flex items-center justify-center">
        <div className="flex-1 h-px bg-border"></div>
        <span className="px-4 text-sm text-muted-foreground">o</span>
        <div className="flex-1 h-px bg-border"></div>
      </div>

      {/* Crear nueva cuenta */}
      <Card>
        <CardHeader>
          <CardTitle>Agregar nueva cuenta</CardTitle>
          <CardDescription>
            Crea una nueva cuenta bancaria o wallet para este retiro
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Button variant="cta" onClick={onCreateNew} className="mb-2">
              Crear nueva cuenta
            </Button>
            <p className="text-sm text-muted-foreground">
              Completa los datos de una nueva cuenta de destino
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

#### 0.4 Plan de Migración Progresiva

**Semana 1:**
1. ✅ Crear estructura de carpetas por features
2. ✅ Migrar `TransactionStatusBadge` a `components/dashboard/`
3. ✅ Migrar `CurrencyInput` a `components/shared/ui/`
4. ✅ Migrar `BalanceCard` a `components/dashboard/`
5. ✅ Actualizar imports en páginas afectadas

**Semana 2:**
1. ✅ Migrar `PayoutAccountSelector` a `components/withdrawal/`
2. ✅ Crear `FileUploadWithPreview` en `components/shared/ui/`
3. ✅ Crear `DepositMethodTabs` en `components/deposit/`
4. ✅ Testing de componentes aislados
5. ✅ Documentación de props interfaces

**Beneficios Inmediatos:**
- 🔄 **Reutilización**: Componentes usables en múltiples páginas
- 🧪 **Testing**: Componentes aislados más fáciles de testear  
- 🎨 **Consistencia**: UI uniforme en toda la aplicación
- 🚀 **Performance**: Componentes memoizables individualmente
- 📝 **Mantenibilidad**: Lógica centralizada y props bien tipadas

### **Fase 1: Fundamentos React Query + Zustand (Semana 3-4)**
**Objetivo**: Establecer las bases del nuevo sistema de estado sin romper funcionalidad existente

#### 1.1 Instalación de Dependencias
```bash
pnpm add @tanstack/react-query zustand immer
pnpm add @tanstack/react-query-devtools -D
```

#### 1.2 Setup React Query Provider
```typescript
// app/providers.tsx
'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      gcTime: 10 * 60 * 1000,   // 10 minutos
      retry: (failureCount, error) => {
        if (error.status === 404 || error.status === 403) return false
        return failureCount < 3
      }
    }
  }
})

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
```

#### 1.3 Zustand Store Base
```typescript
// lib/stores/app-store.ts
import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

interface AppState {
  // UI State
  sidebarOpen: boolean
  currentPage: string
  
  // User Preferences
  dateRange: { start: string; end: string }
  tablePageSize: number
  
  // Modal States
  withdrawalModalOpen: boolean
  depositModalOpen: boolean
  
  // Actions
  setSidebarOpen: (open: boolean) => void
  setCurrentPage: (page: string) => void
  setDateRange: (range: { start: string; end: string }) => void
  toggleWithdrawalModal: () => void
  toggleDepositModal: () => void
}

export const useAppStore = create<AppState>()(
  subscribeWithSelector(
    immer((set) => ({
      // Initial state
      sidebarOpen: false,
      currentPage: 'dashboard',
      dateRange: { start: '', end: '' },
      tablePageSize: 10,
      withdrawalModalOpen: false,
      depositModalOpen: false,
      
      // Actions
      setSidebarOpen: (open) => set((state) => { state.sidebarOpen = open }),
      setCurrentPage: (page) => set((state) => { state.currentPage = page }),
      setDateRange: (range) => set((state) => { state.dateRange = range }),
      toggleWithdrawalModal: () => set((state) => { 
        state.withdrawalModalOpen = !state.withdrawalModalOpen 
      }),
      toggleDepositModal: () => set((state) => { 
        state.depositModalOpen = !state.depositModalOpen 
      })
    }))
  )
)
```

### **Fase 2: React Query Integration (Semana 2-3)**
**Objetivo**: Migrar todas las llamadas a API a React Query

#### 2.1 API Query Hooks
```typescript
// hooks/queries/use-balance-query.ts
import { useQuery } from '@tanstack/react-query'
import { useAuthenticatedFetch } from '@/hooks/use-authenticated-fetch'

export function useBalanceQuery() {
  const { authenticatedFetch } = useAuthenticatedFetch()
  
  return useQuery({
    queryKey: ['balance'],
    queryFn: async () => {
      const response = await authenticatedFetch('/api/balance', { method: 'POST' })
      const data = await response.json()
      
      if (!response.ok) throw new Error(data.error || 'Error al cargar balance')
      
      return { 
        balance: Number.parseFloat(data.balance), 
        source: data.source 
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutos para balance
  })
}

// hooks/queries/use-transactions-query.ts
export function useTransactionsQuery() {
  const { authenticatedFetch } = useAuthenticatedFetch()
  
  return useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const response = await authenticatedFetch('/api/transactions', { method: 'POST' })
      const data = await response.json()
      
      if (!response.ok) throw new Error(data.error || 'Error al cargar transacciones')
      
      return Array.isArray(data.data) ? data.data : []
    },
    staleTime: 5 * 60 * 1000, // 5 minutos para transacciones
  })
}
```

#### 2.2 Mutations para Acciones
```typescript
// hooks/mutations/use-withdrawal-mutation.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthenticatedFetch } from '@/hooks/use-authenticated-fetch'
import { toast } from '@/hooks/use-toast'

export function useWithdrawalMutation() {
  const { authenticatedFetch } = useAuthenticatedFetch()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (withdrawalData: any) => {
      const response = await authenticatedFetch('/api/withdrawals', {
        method: 'POST',
        body: JSON.stringify(withdrawalData),
      })
      
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Error al procesar retiro')
      
      return data
    },
    onSuccess: () => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['balance'] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['pending-withdrawals'] })
      
      toast({
        title: "Retiro procesado",
        description: "El retiro ha sido enviado exitosamente",
      })
    },
    onError: (error: Error) => {
      toast({
        title: "Error al procesar retiro",
        description: error.message,
        variant: "destructive",
      })
    }
  })
}
```

### **Fase 3: Context Optimization (Semana 3-4)**
**Objetivo**: Optimizar y dividir contexts para mejor performance

#### 3.1 AuthContext Optimizado
```typescript
// components/auth/auth-context.tsx
'use client'
import { createContext, useContext, useMemo } from 'react'
import { User, Session } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  // ... lógica de autenticación existente ...

  const value = useMemo(() => ({
    user,
    session,
    loading,
  }), [user, session, loading])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
```

#### 3.2 Actions Context Separado
```typescript
// components/auth/auth-actions-context.tsx
'use client'
import { createContext, useContext, useCallback } from 'react'

interface AuthActionsType {
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<{ error: AuthError | null }>
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>
}

const AuthActionsContext = createContext<AuthActionsType | undefined>(undefined)

export function AuthActionsProvider({ children }: { children: React.ReactNode }) {
  const signIn = useCallback(async (email: string, password: string) => {
    // lógica existente
  }, [])

  const signOut = useCallback(async () => {
    // lógica existente optimizada
  }, [])

  const value = useMemo(() => ({
    signIn,
    signOut,
    signUp,
    resetPassword,
  }), [signIn, signOut])

  return (
    <AuthActionsContext.Provider value={value}>
      {children}
    </AuthActionsContext.Provider>
  )
}
```

### **Fase 4: Component Modernization (Semana 4-5)**
**Objetivo**: Optimizar componentes con React Query y Zustand

#### 4.1 Dashboard Optimizado
```typescript
// app/dashboard/page.tsx
'use client'
import { Suspense } from 'react'
import { useBalanceQuery } from '@/hooks/queries/use-balance-query'
import { useTransactionsQuery } from '@/hooks/queries/use-transactions-query'
import { useAppStore } from '@/lib/stores/app-store'

function DashboardContent() {
  const { data: balance, isLoading: balanceLoading } = useBalanceQuery()
  const { data: transactions, isLoading: transactionsLoading } = useTransactionsQuery()
  const { dateRange, setDateRange } = useAppStore()

  if (balanceLoading || transactionsLoading) {
    return <DashboardSkeleton />
  }

  return (
    <div>
      <BalanceCard balance={balance} />
      <TransactionsTable 
        transactions={transactions} 
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
      />
    </div>
  )
}

export default function Dashboard() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  )
}
```

#### 4.2 Componente de Transacciones Memoizado
```typescript
// components/transactions-table.tsx
import { memo, useMemo } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'

interface TransactionsTableProps {
  transactions: Transaction[]
  dateRange: { start: string; end: string }
  onDateRangeChange: (range: { start: string; end: string }) => void
}

export const TransactionsTable = memo(function TransactionsTable({
  transactions,
  dateRange,
  onDateRangeChange
}: TransactionsTableProps) {
  const filteredTransactions = useMemo(() => {
    if (!dateRange.start || !dateRange.end) return transactions
    
    return transactions.filter(tx => {
      const txDate = new Date(tx.created_at)
      return txDate >= new Date(dateRange.start) && txDate <= new Date(dateRange.end)
    })
  }, [transactions, dateRange])

  // Virtualización para listas grandes
  const parentRef = useRef<HTMLDivElement>(null)
  const virtualizer = useVirtualizer({
    count: filteredTransactions.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60,
  })

  return (
    <div ref={parentRef} className="h-96 overflow-auto">
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const transaction = filteredTransactions[virtualItem.index]
          return (
            <TransactionRow
              key={transaction.id}
              transaction={transaction}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: virtualItem.size,
                transform: `translateY(${virtualItem.start}px)`,
              }}
            />
          )
        })}
      </div>
    </div>
  )
})
```

### **Fase 5: Performance & Error Boundaries (Semana 5-6)**
**Objetivo**: Agregar error boundaries, lazy loading y optimizaciones finales

#### 5.1 Error Boundaries
```typescript
// components/error-boundary.tsx
'use client'
import { Component, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-lg font-semibold mb-2">Algo salió mal</h2>
          <p className="text-gray-600 mb-4">
            {this.state.error?.message || 'Ha ocurrido un error inesperado'}
          </p>
          <Button
            onClick={() => this.setState({ hasError: false, error: undefined })}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Intentar de nuevo
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}
```

#### 5.2 Lazy Loading Components
```typescript
// app/dashboard/page.tsx
import { lazy, Suspense } from 'react'

const WithdrawalModal = lazy(() => import('@/components/withdrawal-modal'))
const DepositModal = lazy(() => import('@/components/deposit-modal'))

export default function Dashboard() {
  const { withdrawalModalOpen, depositModalOpen } = useAppStore()

  return (
    <ErrorBoundary>
      <DashboardContent />
      
      {withdrawalModalOpen && (
        <Suspense fallback={<div>Cargando...</div>}>
          <WithdrawalModal />
        </Suspense>
      )}
      
      {depositModalOpen && (
        <Suspense fallback={<div>Cargando...</div>}>
          <DepositModal />
        </Suspense>
      )}
    </ErrorBoundary>
  )
}
```

## 🔧 Herramientas y Configuraciones

### React Query DevTools
```typescript
// Agregar en layout.tsx para development
{process.env.NODE_ENV === 'development' && (
  <ReactQueryDevtools initialIsOpen={false} />
)}
```

### Zustand DevTools
```typescript
// lib/stores/app-store.ts
import { devtools } from 'zustand/middleware'

export const useAppStore = create<AppState>()(
  devtools(
    subscribeWithSelector(
      immer((set) => ({
        // ... state
      }))
    ),
    { name: 'app-store' }
  )
)
```

## 📈 Métricas de Éxito

### Modularización (Fase 0)
- [ ] 100% de componentes críticos modularizados
- [ ] Reducir duplicación de código UI en 50%
- [ ] Crear 15+ componentes reutilizables
- [ ] Establecer 4 niveles atómicos (atoms, molecules, organisms, templates)
- [ ] Testing coverage > 80% en componentes nuevos

### Performance (Fases 1-5)
- [ ] Reducir re-renders innecesarios en 60%
- [ ] Mejorar tiempo de carga inicial en 30%
- [ ] Reducir bundle size de components en 20%

### Developer Experience
- [ ] Reducir código duplicado en 40%
- [ ] Simplificar hooks personalizados
- [ ] Mejorar debugging con DevTools
- [ ] Props interfaces bien tipadas en todos los componentes

### User Experience
- [ ] Loading states consistentes
- [ ] Error handling mejorado
- [ ] Offline support básico
- [ ] UI components reutilizables y consistentes

## 🚨 Consideraciones y Riesgos

### Riesgos Identificados
1. **Compatibilidad**: Cambios en hooks existentes
2. **Timing**: Migrations durante desarrollo activo  
3. **Learning Curve**: Team adoption de nuevas herramientas

### Mitigation Strategy
1. **Feature Flags**: Implementar toggles para rollback
2. **Parallel Development**: Mantener ambos sistemas temporalmente
3. **Testing**: Comprehensive testing de cada fase
4. **Documentation**: Detailed migration guides

## 📅 Timeline Estimado

| Fase | Duración | Entregables |
|------|----------|-------------|
| **Fase 0** | **2 semanas** | **Modularización Atomic Design** |
| Fase 1 | 2 semanas | Setup React Query + Zustand |
| Fase 2 | 2-3 semanas | Queries y mutations |
| Fase 3 | 1-2 semanas | Context optimization |
| Fase 4 | 2-3 semanas | Component modernization |
| Fase 5 | 1-2 semanas | Error boundaries, performance |

**Total: 10-15 semanas** (incluyendo modularización inicial)

### Cronograma Detallado Fase 0

**Semana 1: Molecules & Setup**
- Día 1-2: Crear estructura de carpetas + `TransactionStatusBadge`
- Día 3-4: `CurrencyInput` + migración desde withdrawal form
- Día 5-7: `BalanceCard` + testing + documentación

**Semana 2: Organisms & Integration** 
- Día 1-3: `PayoutAccountSelector` + migración completa
- Día 4-5: `FileUploadWithPreview` + `DepositMethodTabs`
- Día 6-7: Testing end-to-end + cleanup de código legacy

## 🎯 Próximos Pasos Inmediatos

### Fase 0 - Comenzar YA (Esta Semana)

1. **✅ Crear estructura por features** 
   ```bash
   mkdir -p components/{shared/{ui,forms,layout},dashboard,withdrawal,deposit,views}
   ```

2. **✅ Primer componente: TransactionStatusBadge**
   ```bash
   touch components/dashboard/TransactionStatusBadge.tsx
   ```

3. **✅ Segundo componente: CurrencyInput**  
   ```bash
   touch components/shared/ui/CurrencyInput.tsx
   ```

4. **✅ Tercer componente: BalanceCard**
   ```bash
   touch components/dashboard/BalanceCard.tsx
   ```

5. **✅ Migrar imports y testing**
   - Actualizar `app/dashboard/page.tsx`
   - Actualizar `app/retirar/page.tsx`
   - Testing manual de funcionalidad

### Siguientes Fases (Después de Fase 0)

6. **Instalar dependencias** para Fase 1
   ```bash
   pnpm add @tanstack/react-query zustand immer
   pnpm add @tanstack/react-query-devtools -D
   ```

7. **Crear branch** `refactor/atomic-design-phase0`
8. **Implementar providers** React Query (Fase 1)
9. **Migrar primer hook** como proof of concept

### 🚀 Comando para Empezar

```bash
# Crear estructura por features
mkdir -p components/{shared/{ui,forms,layout},dashboard,withdrawal,deposit,views}

# Crear primeros archivos
touch components/dashboard/TransactionStatusBadge.tsx
touch components/shared/ui/CurrencyInput.tsx  
touch components/dashboard/BalanceCard.tsx

# Crear branch
git checkout -b refactor/feature-based-components
```

**¡Empezamos por la modularización de componentes organizados por features antes que React Query y Zustand!** 

## 🎯 **Ventajas de la Estructura por Features:**

### **📁 Organización Lógica:**
- **`shared/`**: Componentes reutilizables en múltiples features
- **`dashboard/`**: Todo lo relacionado con el dashboard
- **`withdrawal/`**: Componentes específicos de retiros
- **`deposit/`**: Componentes específicos de depósitos
- **`views/`**: Componentes de página completa

### **🔍 Fácil Navegación:**
- Encuentras componentes por funcionalidad, no por tamaño
- Imports más claros: `@/components/dashboard/BalanceCard`
- Fácil identificar dependencias entre features

### **🚀 Escalabilidad:**
- Agregar nuevas features es intuitivo
- Componentes compartidos claramente identificados
- Testing organizado por feature

¿Te parece mejor este approach organizacional? ¿Quieres que implemente alguno de estos componentes como ejemplo?