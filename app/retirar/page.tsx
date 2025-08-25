"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useAuth } from "@/components/auth-wrapper"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
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
  const { toast } = useToast()
  const { user } = useAuth()
  const { invalidateWithdrawalsCache } = useCacheInvalidation()
  
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
          "x-user-email": userEmail
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
        invalidateWithdrawalsCache(userEmail)
      }

      setShowSummary(false)
      // Reset form
      setValue("category", undefined as any)
      setValue("method", undefined as any)
      setValue("amount", "")
      setValue("reference", "")
      // Clear other fields
      Object.keys(formData).forEach(key => {
        if (key !== "category" && key !== "method" && key !== "amount" && key !== "reference") {
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

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">Solicitud de retiro</h1>
        <p className="text-muted-foreground">Completa el formulario para solicitar un retiro</p>
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
              <Select onValueChange={handleCategoryChange} defaultValue={lastCategory || undefined}>
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
                    <Select onValueChange={(value) => setValue("accountOwnership", value as any)}>
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
                    <Select onValueChange={(value) => setValue("method", value as any)}>
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
                      <Select onValueChange={(value) => setValue("accountType", value as any)}>
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
                                     <Select onValueChange={(value) => setValue("walletNetwork", value as any)}>
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
                    <Select onValueChange={(value) => setValue("localBank", value)}>
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
              <p className="text-xs text-muted-foreground">{getHelperText()}</p>
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
    </div>
  )
}
