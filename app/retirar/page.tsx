"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useAuth } from "@/components/auth"
import { useAuthenticatedFetch } from "@/hooks/use-authenticated-fetch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { WithdrawalSummaryModal } from "@/components/withdrawal-summary-modal"
import { 
  withdrawalSchema, 
  type WithdrawalFormData,
  withdrawalCategoryEnum,
  usdMethodEnum,
  accountOwnershipEnum,
  accountTypeEnum,
  walletNetworkEnum
} from "@/lib/withdrawal-schema"
import { useToast } from "@/hooks/use-toast"
import { useCacheInvalidation } from "@/hooks/use-cache-invalidation"
import { AlertCircle, DollarSign } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { getApiEmailForUser } from "@/lib/utils"

const boliviaBanks = [
  "Banco Mercantil", "Banco Nacional de Bolivia S.A.", "Banco de crédito de Bolivia S.A.", "Banco de la Nación de Argentina",
  "Banco do Brasil S.A.", "Banco Bisa S.A.", "Banco Unión S.A.", "Banco Solidario S.A.", "Banco Sol S.A.", "Banco Ganadero S.A.",
  "Banco Fie S.A.", "Banco Fortaleza S.A.", "Cooperativa Jesús Nazareno RL", "Cooperativa Fátima LTDA", "Cooperativa Quillacollo LTDA",
  "Pago móvil E-fectivo S.A.", "Móvil Entel Financiera SRL", "Banco PYME Ecofuturo S.A.", "Banco PYME de la comunidad S.A.",
  "Tibo Money", "Cooperativa Catedral Tarija", "Cooperativa San José de Bermejo LTDA", "Cooperativa San Anatonio RL",
  "Cooperativa San José de Punata LTDA", "Cooperativa Trinidad LTDA", "Cooperativa Comarapa RL", "Cooperativa San Roque RL",
  "El Choroloque RA", "Monseñor Felix Gainza RL", "Cooperativa Madre y Maestra LTDA", "Cooperativa Educadores Gran Chaco LTDA",
  "Cooperativa Catedral RA", "Cooperativa Asunción LTDA", "Cooperativa Magisterio Rural de Chuquisaca LTDA",
  "Cooperativa La Sagrada Familia RL", "Cooperativa La Sagrada Familia RL", "Cooperativa Progreso RL",
  "Cooperativa Magisterio Rural de Chuquisaca", "La Primera Entidad Financiera de Vivienda", "Cooperativa Ina Huasi LTDA",
  "Cooperativa Loyola RL", "E.F. De Vivienda La Promotora", "Cooperativa San Martin de Porres LTDA",
  "Cooperativa San Carlos Borromeo LTDA"
]

const walletNetworks = [
  { value: "BEP20", label: "Binance Smart Chain - BEP20 (instantáneo)" },
  { value: "MATIC", label: "Polygon - MATIC (instantáneo)" },
  { value: "TRC20", label: "Tron - TRC20 (4 días hábiles)" },
]

export default function RetirarPage() {
  const [showSummary, setShowSummary] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showAccounts, setShowAccounts] = useState(false)
  const [accounts, setAccounts] = useState<any[]>([])
  const [loadingAccounts, setLoadingAccounts] = useState(false)
  const [usedSavedAccount, setUsedSavedAccount] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()
  const { invalidateWithdrawalsCache } = useCacheInvalidation()
  const { authenticatedFetch } = useAuthenticatedFetch()

  // TODO: reemplazar por userId real de sesión
  const currentUserId = "<REEMPLAZAR_USER_ID>"
  
  // Debug: Log user info when component mounts
  useEffect(() => {
    console.log("RetirarPage - User object:", user)
    console.log("RetirarPage - User email:", user?.email)
    
    // Debug localStorage
    try {
      const storedUser = localStorage.getItem("takenos_user")
      console.log("RetirarPage - localStorage user:", storedUser)
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser)
        console.log("RetirarPage - Parsed localStorage user:", parsedUser)
        console.log("RetirarPage - Parsed user email:", parsedUser.email)
      }
    } catch (e) {
      console.error("Error reading localStorage:", e)
    }
  }, [user])

  // Persistir última categoría seleccionada
  const [lastCategory, setLastCategory] = useState<string | null>(null)

  // Cargar categoría guardada al montar
  useEffect(() => {
    const saved = localStorage.getItem("lastWithdrawalCategory")
    if (saved) {
      setLastCategory(saved)
      // Asegurar que el Select muestre la categoría guardada
      try {
        setValue("category", saved as any)
      } catch {}
    }
  }, [])

  // Guardar categoría cuando cambie
  const handleCategoryChange = (value: string) => {
    setValue("category", value as any)
    setLastCategory(value)
    localStorage.setItem("lastWithdrawalCategory", value)
  }

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    getValues,
  } = useForm<WithdrawalFormData>({
    resolver: zodResolver(withdrawalSchema),
  })

  const watchedCategory = watch("category")
  const watchedMethod = watch("method")
  const watchedCountry = watch("country")
  const watchedAccountOwnership = watch("accountOwnership")
  const watchedAccountType = watch("accountType")
  const watchedWalletNetwork = watch("walletNetwork")
  const watchedLocalBank = watch("localBank")

  const formatCurrency = (value: string) => {
    const number = value.replace(/[^\d]/g, "")
    if (!number) return ""
    const formatted = new Intl.NumberFormat("en-US").format(Number.parseInt(number))
    return formatted
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrency(e.target.value)
    setValue("amount", formatted)
  }

  const onSubmit = (data: WithdrawalFormData) => {
    setShowSummary(true)
  }

  const handleConfirmSubmission = async () => {
    setIsSubmitting(true)
    const formData = getValues()

    try {
      // Obtener el email directamente del localStorage como fuente principal
      let userEmail = null
      
      try {
        const storedUser = localStorage.getItem("takenos_user")
        console.log("localStorage raw data:", storedUser)
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser)
          console.log("Parsed user from localStorage:", parsedUser)
          userEmail = parsedUser.email
        }
      } catch (e) {
        console.error("Error reading from localStorage:", e)
      }
      
      // Fallback: usar useAuth si localStorage falla
      if (!userEmail && user?.email) {
        userEmail = user.email
        console.log("Using useAuth fallback:", userEmail)
      }
      
      if (!userEmail) {
        throw new Error("No se pudo obtener el email del usuario. Por favor, recarga la página.")
      }
      
      console.log("Final user email being sent:", userEmail)
      console.log("Making request to:", "/api/withdrawals")
      console.log("Window location:", window.location.href)
      console.log("Window origin:", window.location.origin)
      
      const fullUrl = `${window.location.origin}/api/withdrawals`
      console.log("Full URL being requested:", fullUrl)
      
      const response = await fetch("/api/withdrawals", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-user-email": getApiEmailForUser(userEmail)
        },
        body: JSON.stringify(formData),
      }).catch(error => {
        console.error("Fetch error details:", error)
        console.error("Error name:", error.name)
        console.error("Error message:", error.message)
        throw error
      })

      const responseData = await response.json()

      if (!response.ok) {
        // Mostrar mensaje específico del backend si está disponible
        const errorMessage = responseData.message || responseData.error || "Error al enviar la solicitud"
        throw new Error(errorMessage)
      }

      toast({
        title: "Solicitud enviada",
        description: "Te contactaremos por email para confirmar tu retiro.",
      })

      // Invalidar caché de retiros pendientes
      if (userEmail) {
        invalidateWithdrawalsCache(getApiEmailForUser(userEmail))
      }

      setShowSummary(false)
      // Reset form
      setValue("category", undefined as any)
      setValue("method", undefined as any)
      setValue("amount", "")
      setValue("reference", "")
      setValue("saveNickname" as any, "")
      setUsedSavedAccount(false)
      // Clear other fields
      Object.keys(formData).forEach(key => {
        if (key !== "category" && key !== "method" && key !== "amount" && key !== "reference" && key !== "saveNickname") {
          setValue(key as any, "")
        }
      })
    } catch (error) {
      console.error("Error submitting withdrawal:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Hubo un problema al enviar tu solicitud. Inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getHelperText = () => {
    if (watchedCategory === "usd_bank" && watchedMethod === "wire") {
      return "Para transferencias internacionales, utiliza el SWIFT/BIC o IBAN si aplica."
    }
    if (watchedCategory === "usd_bank" && watchedMethod === "ach") {
      return "Para cuentas en EE.UU., utiliza account number + routing number."
    }
    if (watchedCategory === "crypto") {
      return "Asegúrate que la red y la dirección coincidan; envíos a red equivocada se pierden."
    }
    if (watchedCategory === "local_currency") {
      return "Número de cuenta bancaria local del beneficiario."
    }
    return ""
  }

  // Función para cargar cuentas guardadas
  async function loadSavedAccounts() {
    setShowAccounts(true)
    setLoadingAccounts(true)
    
    try {
      // Obtener email del usuario
      let userEmail = null
      try {
        const storedUser = localStorage.getItem("takenos_user")
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser)
          userEmail = parsedUser.email
        }
      } catch (e) {
        console.error("Error reading from localStorage:", e)
      }
      
      if (!userEmail && user?.email) {
        userEmail = user.email
      }
      
      if (!userEmail) {
        throw new Error("No se pudo obtener el email del usuario")
      }

      const response = await authenticatedFetch(`/api/payout-accounts`, {
        method: "GET",
      })
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || "Error al cargar cuentas")
      }
      
      setAccounts(data.data || [])
    } catch (error) {
      console.error("Error loading accounts:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudieron cargar las cuentas guardadas",
        variant: "destructive",
      })
    } finally {
      setLoadingAccounts(false)
    }
  }

  // Función para rellenar formulario desde cuenta guardada
  function fillFormFromAccount(account: any) {
    const { category } = account
    const methodFromAccount = account.method as string | undefined
    const details = account.details || {}

    // Limpiar todos los campos primero
    setValue("category", undefined as any)
    setValue("method", undefined as any)
    setValue("accountOwnership", undefined as any)
    setValue("beneficiaryName", "")
    setValue("beneficiaryBank", "")
    setValue("accountType", undefined as any)
    setValue("accountNumber", "")
    setValue("routingNumber", "")
    setValue("swiftBic", "")
    setValue("walletAlias", "")
    setValue("walletAddress", "")
    setValue("walletNetwork", undefined as any)
    setValue("country", "")
    setValue("localAccountName", "")
    setValue("localBank", "")
    setValue("localAccountNumber", "")

    // Establecer categoría y método inmediatamente
    setValue("category", category as any)
    if (category === "usd_bank" && methodFromAccount) {
      setValue("method", methodFromAccount as any)
    }

    // Rellenar campos según la categoría con fallbacks desde el objeto raíz
    if (category === "usd_bank") {
      setValue("accountOwnership", (details.accountOwnership ?? account.account_ownership) as any)
      setValue("beneficiaryName", details.beneficiaryName ?? account.beneficiary_name ?? "")
      setValue("beneficiaryBank", details.beneficiaryBank ?? account.beneficiary_bank ?? "")
      setValue("accountType", (details.accountType ?? account.account_type) as any)
      setValue("accountNumber", details.accountNumber ?? account.account_number ?? "")
      if ((methodFromAccount ?? details.method) === "ach") {
        setValue("routingNumber", details.routingNumber ?? account.routing_number ?? "")
      }
      if ((methodFromAccount ?? details.method) === "wire") {
        setValue("swiftBic", details.swiftBic ?? account.swift_bic ?? "")
      }
    } else if (category === "crypto") {
      setValue("walletAlias", details.walletAlias ?? account.wallet_alias ?? "")
      setValue("walletAddress", details.walletAddress ?? account.wallet_address ?? "")
      setValue("walletNetwork", (details.walletNetwork ?? account.wallet_network) as any)
    } else if (category === "local_currency") {
      setValue("country", details.country ?? account.country ?? "")
      setValue("localAccountName", details.localAccountName ?? account.local_account_name ?? "")
      setValue("localBank", details.localBank ?? account.local_bank ?? "")
      setValue("localAccountNumber", details.localAccountNumber ?? account.local_account_number ?? "")
    }

    setShowAccounts(false)
    setUsedSavedAccount(true)
    toast({
      title: "Cuenta cargada",
      description: "Los datos de la cuenta han sido cargados en el formulario.",
    })
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Solicitud de retiro</h1>
          <p className="text-muted-foreground">Completa el formulario para solicitar un retiro</p>
        </div>
        <Button variant="cta" onClick={loadSavedAccounts}>
          Usar cuenta guardada
        </Button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Card className="rounded-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Información del retiro</CardTitle>
            <CardDescription>Proporciona los detalles según el tipo de retiro</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Categoría de retiro */}
            <div className="space-y-2">
              <Label htmlFor="category" className="text-sm">
                Categoría de retiro *
              </Label>
              <Select onValueChange={handleCategoryChange} value={watchedCategory}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="usd_bank">USD - Cuenta bancaria</SelectItem>
                  <SelectItem value="crypto">Criptomonedas</SelectItem>
                  <SelectItem value="local_currency">Moneda local</SelectItem>
                </SelectContent>
              </Select>
              {errors.category && <p className="text-xs text-destructive">{errors.category.message}</p>}
            </div>

            {/* Campos específicos para USD Bank */}
            {watchedCategory === "usd_bank" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="accountOwnership" className="text-sm">
                      Propietario de la cuenta *
                    </Label>
                    <Select onValueChange={(value) => setValue("accountOwnership", value as any)} value={watchedAccountOwnership as any}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Selecciona" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yo">Yo mismo</SelectItem>
                        <SelectItem value="otra_persona">Otra persona</SelectItem>
                        <SelectItem value="empresa">Empresa</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.accountOwnership && <p className="text-xs text-destructive">{errors.accountOwnership.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="method" className="text-sm">
                      Tipo de transferencia *
                    </Label>
                    <Select onValueChange={(value) => setValue("method", value as any)} value={watchedMethod as any}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Selecciona" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ach">ACH</SelectItem>
                        <SelectItem value="wire">Wire Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.method && <p className="text-xs text-destructive">{errors.method.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="beneficiaryName" className="text-sm">
                      Titular de la cuenta *
                    </Label>
                    <Input
                      id="beneficiaryName"
                      {...register("beneficiaryName")}
                      placeholder="Nombre completo"
                      className="h-9"
                    />
                    {errors.beneficiaryName && <p className="text-xs text-destructive">{errors.beneficiaryName.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="beneficiaryBank" className="text-sm">
                      Banco *
                    </Label>
                    <Input
                      id="beneficiaryBank"
                      {...register("beneficiaryBank")}
                      placeholder="Nombre del banco"
                      className="h-9"
                    />
                    {errors.beneficiaryBank && <p className="text-xs text-destructive">{errors.beneficiaryBank.message}</p>}
                  </div>
                </div>

                {watchedMethod === "ach" ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="accountType" className="text-sm">
                        Tipo de cuenta *
                      </Label>
                      <Select onValueChange={(value) => setValue("accountType", value as any)} value={watchedAccountType as any}>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Selecciona" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="checking">Checking</SelectItem>
                          <SelectItem value="saving">Saving</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.accountType && <p className="text-xs text-destructive">{errors.accountType.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="accountNumber" className="text-sm">
                        Número de cuenta *
                      </Label>
                      <Input
                        id="accountNumber"
                        {...register("accountNumber")}
                        placeholder="Número de cuenta"
                        className="font-mono h-9"
                      />
                      {errors.accountNumber && <p className="text-xs text-destructive">{errors.accountNumber.message}</p>}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="accountNumber" className="text-sm">
                      Número de cuenta / IBAN *
                    </Label>
                    <Input
                      id="accountNumber"
                      {...register("accountNumber")}
                      placeholder="Número de cuenta o IBAN"
                      className="font-mono h-9"
                    />
                    {errors.accountNumber && <p className="text-xs text-destructive">{errors.accountNumber.message}</p>}
                  </div>
                )}

                {watchedMethod === "ach" && (
                  <div className="space-y-2">
                    <Label htmlFor="routingNumber" className="text-sm">
                      Routing Number *
                    </Label>
                    <Input
                      id="routingNumber"
                      {...register("routingNumber")}
                      placeholder="123456789"
                      className="font-mono h-9"
                      maxLength={9}
                    />
                    {errors.routingNumber && <p className="text-xs text-destructive">{errors.routingNumber.message}</p>}
                  </div>
                )}

                {watchedMethod === "wire" && (
                  <div className="space-y-2">
                    <Label htmlFor="swiftBic" className="text-sm">
                      SWIFT/BIC *
                    </Label>
                    <Input 
                      id="swiftBic" 
                      {...register("swiftBic")} 
                      placeholder="ABCDUS33XXX" 
                      className="font-mono h-9" 
                    />
                    {errors.swiftBic && <p className="text-xs text-destructive">{errors.swiftBic.message}</p>}
                  </div>
                )}
              </>
            )}

            {/* Campos específicos para Crypto */}
            {watchedCategory === "crypto" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="walletAlias" className="text-sm">
                    Apodo de la billetera *
                  </Label>
                  <Input
                    id="walletAlias"
                    {...register("walletAlias")}
                    placeholder="Mi billetera principal"
                    className="h-9"
                  />
                  {errors.walletAlias && <p className="text-xs text-destructive">{errors.walletAlias.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="walletAddress" className="text-sm">
                    Dirección de la billetera *
                  </Label>
                  <Input
                    id="walletAddress"
                    {...register("walletAddress")}
                    placeholder="0x..."
                    className="font-mono h-9"
                  />
                  {errors.walletAddress && <p className="text-xs text-destructive">{errors.walletAddress.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="walletNetwork" className="text-sm">
                    Red *
                  </Label>
                  <Select onValueChange={(value) => setValue("walletNetwork", value as any)} value={watchedWalletNetwork as any}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Selecciona la red" />
                    </SelectTrigger>
                    <SelectContent>
                      {walletNetworks.map((network) => (
                        <SelectItem key={network.value} value={network.value}>
                          {network.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.walletNetwork && <p className="text-xs text-destructive">{errors.walletNetwork.message}</p>}
                  <p className="text-xs text-muted-foreground">
                    BEP20 y MATIC son instantáneos, TRC20 tarda 4 días hábiles
                  </p>
                </div>
              </>
            )}

            {/* Campos específicos para Moneda Local */}
            {watchedCategory === "local_currency" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="country" className="text-sm">
                    País *
                  </Label>
                  <Select onValueChange={(value) => setValue("country", value)}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Selecciona el país" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BO">Bolivia</SelectItem>
                      <SelectItem value="AR">Argentina</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.country && <p className="text-xs text-destructive">{errors.country.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="localAccountName" className="text-sm">
                    Nombre de la cuenta *
                  </Label>
                  <Input
                    id="localAccountName"
                    {...register("localAccountName")}
                    placeholder="Nombre completo del titular"
                    className="h-9"
                  />
                  {errors.localAccountName && <p className="text-xs text-destructive">{errors.localAccountName.message}</p>}
                </div>

                {watchedCountry === "BO" && (
                  <div className="space-y-2">
                    <Label htmlFor="localBank" className="text-sm">
                      Banco *
                    </Label>
                    <Select onValueChange={(value) => setValue("localBank", value)} value={watchedLocalBank || undefined}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Selecciona el banco" />
                      </SelectTrigger>
                      <SelectContent>
                        {boliviaBanks.map((bank) => (
                          <SelectItem key={bank} value={bank}>
                            {bank}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.localBank && <p className="text-xs text-destructive">{errors.localBank.message}</p>}
                  </div>
                )}

                {watchedCountry !== "BO" && (
                  <div className="space-y-2">
                    <Label htmlFor="localBank" className="text-sm">
                      Banco *
                    </Label>
                    <Input
                      id="localBank"
                      {...register("localBank")}
                      placeholder="Nombre del banco"
                      className="h-9"
                    />
                    {errors.localBank && <p className="text-xs text-destructive">{errors.localBank.message}</p>}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="localAccountNumber" className="text-sm">
                    Número de cuenta destino *
                  </Label>
                  <Input
                    id="localAccountNumber"
                    {...register("localAccountNumber")}
                    placeholder="Número de cuenta"
                    className="font-mono h-9"
                  />
                  {errors.localAccountNumber && <p className="text-xs text-destructive">{errors.localAccountNumber.message}</p>}
                </div>
              </>
            )}

            {/* Campos comunes */}
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-sm">
                Monto (USD) *
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="amount"
                  {...register("amount")}
                  onChange={handleAmountChange}
                  placeholder="0"
                  className="pl-10 font-mono h-9"
                />
              </div>
              {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="reference" className="text-sm">
                Concepto / Referencia
              </Label>
              <Textarea
                id="reference"
                {...register("reference")}
                placeholder="Descripción opcional del retiro"
                rows={2}
                className="resize-none"
              />
            </div>

            {/* Helper text */}
            {getHelperText() && (
              <p className="text-xs text-muted-foreground">{getHelperText()}</p>)}

            {/* Guardar cuenta */}
            {!usedSavedAccount && (
            <div className="space-y-2">
              <Button
                type="button"
                variant="cta"
                size="sm"
                onClick={async () => {
                  const formData = getValues()
                  const { category, method } = formData as any
                  
                  // Validar que tengamos datos básicos
                  if (!category) {
                    toast({
                      title: "Selecciona una categoría",
                      description: "Primero completa la información básica de la cuenta",
                      variant: "destructive",
                    })
                    return
                  }
                  
                  // Validar que tengamos un alias/apodo según la categoría
                  let nickname = null
                  if (category === "crypto") {
                    if (!formData.walletAlias) {
                      toast({
                        title: "Apodo requerido",
                        description: "Para guardar una cuenta crypto, debes completar el 'Apodo de la billetera'",
                        variant: "destructive",
                      })
                      return
                    }
                    nickname = formData.walletAlias
                  } else if (category === "usd_bank") {
                    if (!(formData as any).saveNickname) {
                      toast({
                        title: "Alias requerido",
                        description: "Para guardar una cuenta bancaria, debes agregar un alias",
                        variant: "destructive",
                      })
                      return
                    }
                    nickname = (formData as any).saveNickname
                  } else if (category === "local_currency") {
                    if (!(formData as any).saveNickname) {
                      toast({
                        title: "Alias requerido",
                        description: "Para guardar una cuenta local, debes agregar un alias",
                        variant: "destructive",
                      })
                      return
                    }
                    nickname = (formData as any).saveNickname
                  }
                  
                  // Obtener email del usuario
                  let userEmail = null
                  try {
                    const storedUser = localStorage.getItem("takenos_user")
                    if (storedUser) {
                      const parsedUser = JSON.parse(storedUser)
                      userEmail = parsedUser.email
                    }
                  } catch (e) {
                    console.error("Error reading from localStorage:", e)
                  }
                  
                  if (!userEmail && user?.email) {
                    userEmail = user.email
                  }
                  
                  if (!userEmail) {
                    toast({
                      title: "Error",
                      description: "No se pudo obtener el email del usuario",
                      variant: "destructive",
                    })
                    return
                  }
                  
                  // Construir detalles según categoría
                  let details: any = {}
                  if (category === "usd_bank") {
                    details = {
                      beneficiaryName: formData.beneficiaryName,
                      beneficiaryBank: formData.beneficiaryBank,
                      accountType: formData.accountType,
                      accountNumber: formData.accountNumber,
                      accountOwnership: formData.accountOwnership,
                    }
                    if (method === "ach") {
                      details.routingNumber = formData.routingNumber
                    }
                    if (method === "wire") {
                      details.swiftBic = formData.swiftBic
                    }
                  } else if (category === "crypto") {
                    details = {
                      walletAlias: formData.walletAlias,
                      walletAddress: formData.walletAddress,
                      walletNetwork: formData.walletNetwork,
                    }
                  } else if (category === "local_currency") {
                    details = {
                      localAccountName: formData.localAccountName,
                      localBank: formData.localBank,
                      localAccountNumber: formData.localAccountNumber,
                    }
                  }
                  
                  try {
                    // Evitar alias duplicado
                    const fetchEmail = async (): Promise<string | null> => {
                      try {
                        const storedUser = localStorage.getItem("takenos_user")
                        if (storedUser) {
                          const parsedUser = JSON.parse(storedUser)
                          return parsedUser.email
                        }
                      } catch {}
                      return user?.email ?? null
                    }
                    const emailForCheck = await fetchEmail()
                    if (!emailForCheck) {
                      toast({ title: "Error", description: "No se pudo obtener el email del usuario", variant: "destructive" })
                      return
                    }
                    const existingRes = await authenticatedFetch(`/api/payout-accounts`, {
                      method: "GET",
                    })
                    const existingJson = await existingRes.json().catch(() => ({}))
                    const existing = Array.isArray(existingJson?.data) ? existingJson.data : []
                    const aliasExists = existing.some((a: any) => (a.nickname || "").toLowerCase() === (nickname || "").toLowerCase())
                    if (aliasExists) {
                      toast({ title: "Alias ya usado", description: "Elegí un alias diferente para esta cuenta.", variant: "destructive" })
                      return
                    }

                    const saveResp = await authenticatedFetch("/api/payout-accounts", {
                      method: "POST",
                      body: JSON.stringify({
                        category,
                        method: method ?? null,
                        nickname,
                        details,
                      }),
                    })
                    const saveJson = await saveResp.json().catch(() => ({}))
                    if (saveResp.ok && saveJson?.ok) {
                      toast({ 
                        title: "Cuenta guardada", 
                        description: "La cuenta fue guardada correctamente para futuros retiros." 
                      })
                    } else {
                      toast({ 
                        title: "No se pudo guardar la cuenta", 
                        description: saveJson?.error || "Intentá más tarde.", 
                        variant: "destructive" 
                      })
                    }
                  } catch (e) {
                    console.error("Error guardando la cuenta:", e)
                    toast({ 
                      title: "Error", 
                      description: "No se pudo guardar la cuenta. Intentá más tarde.", 
                      variant: "destructive" 
                    })
                  }
                }}
                className="w-full"
              >
                Guardar cuenta para futuros retiros
              </Button>
              {watchedCategory !== "crypto" && (
                <Input
                  id="saveNickname"
                  {...register("saveNickname" as any)}
                  placeholder="Alias para la cuenta (requerido para guardar)"
                  className="h-9"
                />
              )}
            </div>
            )}
          </CardContent>
        </Card>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            Verifica que todos los datos sean correctos. Los errores pueden causar retrasos o devoluciones con
            cargos adicionales.
          </AlertDescription>
        </Alert>

        <div className="flex justify-end">
          <Button type="submit" className="px-6">
            Revisar solicitud
          </Button>
        </div>
      </form>

      <WithdrawalSummaryModal
        isOpen={showSummary}
        onClose={() => setShowSummary(false)}
        onConfirm={handleConfirmSubmission}
        data={getValues()}
        isSubmitting={isSubmitting}
      />

      {/* Modal de cuentas guardadas */}
      <Dialog open={showAccounts} onOpenChange={setShowAccounts}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Cuentas guardadas</DialogTitle>
            <DialogDescription>Selecciona una cuenta para completar el formulario automáticamente</DialogDescription>
          </DialogHeader>

          {loadingAccounts ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Cargando cuentas...
            </div>
          ) : accounts.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No tienes cuentas guardadas
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {accounts.map((account) => {
                const getAccountTitle = () => {
                  if (account.nickname) return account.nickname
                  
                  if (account.category === "usd_bank") {
                    return `${account.beneficiary_bank || "Banco"} ••••${account.last4 || ""}`
                  } else if (account.category === "crypto") {
                    return `${account.wallet_network || "Crypto"} ••••${account.last4 || ""}`
                  } else if (account.category === "local_currency") {
                    return `${account.local_bank || "Banco local"} ••••${account.last4 || ""}`
                  }
                  
                  return `Cuenta ${account.category}`
                }

                const getAccountSubtitle = () => {
                  if (account.category === "usd_bank") {
                    return `${account.method?.toUpperCase() || ""} • ${account.beneficiary_bank || ""}`
                  } else if (account.category === "crypto") {
                    return `${account.wallet_network || ""} • ${account.wallet_alias || ""}`
                  } else if (account.category === "local_currency") {
                    return `${account.local_bank || ""} • ${account.local_account_name || ""}`
                  }
                  
                  return account.category
                }

                return (
                  <div key={account.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{getAccountTitle()}</div>
                      <div className="text-xs text-muted-foreground">{getAccountSubtitle()}</div>
                    </div>
                    <Button size="sm" onClick={() => fillFormFromAccount(account)}>
                      Usar
                    </Button>
                  </div>
                )
              })}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAccounts(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
