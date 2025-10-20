"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/components/auth";
import { useAuthenticatedFetch } from "@/hooks/use-authenticated-fetch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { WithdrawalSummaryModal } from "@/components/withdrawal-summary-modal";
import {
  withdrawalSchema,
  type WithdrawalFormData,
  withdrawalCategoryEnum,
  usdMethodEnum,
  accountOwnershipEnum,
  accountTypeEnum,
  walletNetworkEnum,
} from "@/lib/withdrawal-schema";
import { useToast } from "@/hooks/use-toast";
import { useCacheInvalidation } from "@/hooks/use-cache-invalidation";
import { AlertCircle, DollarSign, ChevronDown, ChevronUp } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getApiEmailForUser } from "@/lib/utils";

const boliviaBanks = [
  "Banco Mercantil",
  "Banco Nacional de Bolivia S.A.",
  "Banco de crédito de Bolivia S.A.",
  "Banco de la Nación de Argentina",
  "Banco do Brasil S.A.",
  "Banco Bisa S.A.",
  "Banco Unión S.A.",
  "Banco Solidario S.A.",
  "Banco Sol S.A.",
  "Banco Ganadero S.A.",
  "Banco Fie S.A.",
  "Banco Fortaleza S.A.",
  "Cooperativa Jesús Nazareno RL",
  "Cooperativa Fátima LTDA",
  "Cooperativa Quillacollo LTDA",
  "Pago móvil E-fectivo S.A.",
  "Móvil Entel Financiera SRL",
  "Banco PYME Ecofuturo S.A.",
  "Banco PYME de la comunidad S.A.",
  "Tibo Money",
  "Cooperativa Catedral Tarija",
  "Cooperativa San José de Bermejo LTDA",
  "Cooperativa San Anatonio RL",
  "Cooperativa San José de Punata LTDA",
  "Cooperativa Trinidad LTDA",
  "Cooperativa Comarapa RL",
  "Cooperativa San Roque RL",
  "El Choroloque RA",
  "Monseñor Felix Gainza RL",
  "Cooperativa Madre y Maestra LTDA",
  "Cooperativa Educadores Gran Chaco LTDA",
  "Cooperativa Catedral RA",
  "Cooperativa Asunción LTDA",
  "Cooperativa Magisterio Rural de Chuquisaca LTDA",
  "Cooperativa La Sagrada Familia RL",
  "Cooperativa Progreso RL",
  "Cooperativa Magisterio Rural de Chuquisaca",
  "La Primera Entidad Financiera de Vivienda",
  "Cooperativa Ina Huasi LTDA",
  "Cooperativa Loyola RL",
  "E.F. De Vivienda La Promotora",
  "Cooperativa San Martin de Porres LTDA",
  "Cooperativa San Carlos Borromeo LTDA",
];

const walletNetworks = [
  { value: "BEP20", label: "Binance Smart Chain - BEP20 (instantáneo)" },
  { value: "MATIC", label: "Polygon - MATIC (instantáneo)" },
  { value: "TRC20", label: "Tron - TRC20 (4 días hábiles)" },
];

export default function RetirarPage() {
  const [showSummary, setShowSummary] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [usedSavedAccount, setUsedSavedAccount] = useState(false);

  // Estados del wizard
  const [currentStep, setCurrentStep] = useState<
    "select-account" | "withdrawal-details"
  >("select-account");
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [isCreatingNewAccount, setIsCreatingNewAccount] = useState(false);
  const [isAccountsExpanded, setIsAccountsExpanded] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();
  const { invalidateWithdrawalsCache } = useCacheInvalidation();
  const { authenticatedFetch } = useAuthenticatedFetch();

  // TODO: reemplazar por userId real de sesión
  const currentUserId = "<REEMPLAZAR_USER_ID>";

  // Debug: Log user info when component mounts
  useEffect(() => {
    console.log("RetirarPage - User object:", user);
    console.log("RetirarPage - User email:", user?.email);

    // Debug localStorage
    try {
      const storedUser = localStorage.getItem("takenos_user");
      console.log("RetirarPage - localStorage user:", storedUser);
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        console.log("RetirarPage - Parsed localStorage user:", parsedUser);
        console.log("RetirarPage - Parsed user email:", parsedUser.email);
      }
    } catch (e) {
      console.error("Error reading localStorage:", e);
    }
  }, [user]);

  // Persistir última categoría seleccionada
  const [lastCategory, setLastCategory] = useState<string | null>(null);

  // Cargar categoría guardada al montar
  useEffect(() => {
    const saved = localStorage.getItem("lastWithdrawalCategory");
    if (saved) {
      setLastCategory(saved);
      // Asegurar que el Select muestre la categoría guardada
      try {
        setValue("category", saved as any);
      } catch {}
    }
  }, []);

  // Guardar categoría cuando cambie
  const handleCategoryChange = (value: string) => {
    setValue("category", value as any);
    setLastCategory(value);
    localStorage.setItem("lastWithdrawalCategory", value);
  };

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    getValues,
  } = useForm<WithdrawalFormData>({
    // resolver: zodResolver(withdrawalSchema),
  });

  const watchedCategory = watch("category");
  const watchedMethod = watch("method");
  const watchedCountry = watch("country");
  const watchedAccountOwnership = watch("accountOwnership");
  const watchedAccountType = watch("accountType");
  const watchedWalletNetwork = watch("walletNetwork");
  const watchedLocalBank = watch("localBank");

  const formatCurrency = (value: string) => {
    // Permitir solo números y un punto decimal
    let cleanValue = value.replace(/[^\d.]/g, "");
    
    // Evitar múltiples puntos decimales
    const parts = cleanValue.split(".");
    if (parts.length > 2) {
      cleanValue = parts[0] + "." + parts.slice(1).join("");
    }
    
    // Limitar a 2 decimales
    if (parts[1] && parts[1].length > 2) {
      cleanValue = parts[0] + "." + parts[1].substring(0, 2);
    }
    
    if (!cleanValue) return "";
    
    // Si hay punto decimal, formatear manteniendo los decimales
    if (cleanValue.includes(".")) {
      const [integerPart, decimalPart] = cleanValue.split(".");
      const formattedInteger = new Intl.NumberFormat("en-US").format(
        Number.parseInt(integerPart || "0")
      );
      return decimalPart !== undefined ? `${formattedInteger}.${decimalPart}` : formattedInteger;
    } else {
      // Solo números enteros
      return new Intl.NumberFormat("en-US").format(Number.parseInt(cleanValue));
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrency(e.target.value);
    setValue("amount", formatted);
  };

  const onSubmit = (data: WithdrawalFormData) => {
    setShowSummary(true);
  };

  const handleConfirmSubmission = async () => {
    setIsSubmitting(true);
    const formData = getValues();

    try {
      // Obtener el email directamente del localStorage como fuente principal
      let userEmail = null;

      try {
        const storedUser = localStorage.getItem("takenos_user");
        console.log("localStorage raw data:", storedUser);
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          console.log("Parsed user from localStorage:", parsedUser);
          userEmail = parsedUser.email;
        }
      } catch (e) {
        console.error("Error reading from localStorage:", e);
      }

      // Fallback: usar useAuth si localStorage falla
      if (!userEmail && user?.email) {
        userEmail = user.email;
        console.log("Using useAuth fallback:", userEmail);
      }

      if (!userEmail) {
        throw new Error(
          "No se pudo obtener el email del usuario. Por favor, recarga la página."
        );
      }

      console.log("Final user email being sent:", userEmail);
      console.log("Making request to:", "/api/withdrawals");
      console.log("Window location:", window.location.href);
      console.log("Window origin:", window.location.origin);

      const fullUrl = `${window.location.origin}/api/withdrawals`;
      console.log("Full URL being requested:", fullUrl);

      const response = await fetch("/api/withdrawals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-email": getApiEmailForUser(userEmail),
        },
        body: JSON.stringify(formData),
      }).catch((error) => {
        console.error("Fetch error details:", error);
        console.error("Error name:", error.name);
        console.error("Error message:", error.message);
        throw error;
      });

      const responseData = await response.json();

      if (!response.ok) {
        // Mostrar mensaje específico del backend si está disponible
        const errorMessage =
          responseData.message ||
          responseData.error ||
          "Error al enviar la solicitud";
        throw new Error(errorMessage);
      }

      toast({
        title: "Solicitud enviada",
        description: "Te contactaremos por email para confirmar tu retiro.",
      });

      // Invalidar caché de retiros pendientes
      if (userEmail) {
        invalidateWithdrawalsCache(getApiEmailForUser(userEmail));
      }

      setShowSummary(false);
      // Reset form
      setValue("category", undefined as any);
      setValue("method", undefined as any);
      setValue("amount", "");
      setValue("reference", "");
      setValue("saveNickname" as any, "");
      setUsedSavedAccount(false);
      // Clear other fields
      Object.keys(formData).forEach((key) => {
        if (
          key !== "category" &&
          key !== "method" &&
          key !== "amount" &&
          key !== "reference" &&
          key !== "saveNickname"
        ) {
          setValue(key as any, "");
        }
      });
    } catch (error) {
      console.error("Error submitting withdrawal:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Hubo un problema al enviar tu solicitud. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getHelperText = () => {
    if (watchedCategory === "usd_bank" && watchedMethod === "wire") {
      return "Para transferencias internacionales, utiliza el SWIFT/BIC o IBAN si aplica.";
    }
    if (watchedCategory === "usd_bank" && watchedMethod === "ach") {
      return "Para cuentas en EE.UU., utiliza account number + routing number.";
    }
    if (watchedCategory === "crypto") {
      return "Asegúrate que la red y la dirección coincidan; envíos a red equivocada se pierden.";
    }
    if (watchedCategory === "local_currency") {
      return "Número de cuenta bancaria local del beneficiario.";
    }
    return "";
  };

  // Función para cargar cuentas guardadas al iniciar el paso 1
  async function loadSavedAccounts() {
    setLoadingAccounts(true);

    try {
      // Obtener email del usuario
      let userEmail = null;
      try {
        const storedUser = localStorage.getItem("takenos_user");
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          userEmail = parsedUser.email;
        }
      } catch (e) {
        console.error("Error reading from localStorage:", e);
      }

      if (!userEmail && user?.email) {
        userEmail = user.email;
      }

      if (!userEmail) {
        throw new Error("No se pudo obtener el email del usuario");
      }

      const response = await authenticatedFetch(`/api/payout-accounts`, {
        method: "GET",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al cargar cuentas");
      }

      setAccounts(data.data || []);
    } catch (error) {
      console.error("Error loading accounts:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "No se pudieron cargar las cuentas guardadas",
        variant: "destructive",
      });
    } finally {
      setLoadingAccounts(false);
    }
  }

  // Función para seleccionar cuenta y avanzar al paso 2
  function selectAccountAndProceed(account: any) {
    setSelectedAccount(account);
    fillFormFromAccount(account);
    setCurrentStep("withdrawal-details");
    setUsedSavedAccount(true);
    setIsCreatingNewAccount(false);
    toast({
      title: "Cuenta seleccionada",
      description: `Se ha seleccionado la cuenta: ${
        account.nickname || "Sin nombre"
      }`,
    });
  }

  // Función para crear nueva cuenta y avanzar al paso 2
  function createNewAccountAndProceed() {
    setSelectedAccount(null);
    resetForm();
    setCurrentStep("withdrawal-details");
    setUsedSavedAccount(false);
    setIsCreatingNewAccount(true);
    toast({
      title: "Nueva cuenta",
      description: "Completa los datos para crear una nueva cuenta de retiro",
    });
  }

  // Función para volver al paso 1
  function backToAccountSelection() {
    setCurrentStep("select-account");
    setSelectedAccount(null);
    setIsCreatingNewAccount(false);
    resetForm();
  }

  // Función para resetear formulario y bloquear inputs
  function resetForm() {
    setValue("category", undefined as any);
    setValue("method", undefined as any);
    setValue("accountOwnership", undefined as any);
    setValue("beneficiaryName", "");
    setValue("beneficiaryBank", "");
    setValue("accountType", undefined as any);
    setValue("accountNumber", "");
    setValue("routingNumber", "");
    setValue("swiftBic", "");
    setValue("walletAlias", "");
    setValue("walletAddress", "");
    setValue("walletNetwork", undefined as any);
    setValue("country", "");
    setValue("localAccountName", "");
    setValue("localBank", "");
    setValue("localAccountNumber", "");
    setValue("amount", "");
    setValue("reference", "");
    setUsedSavedAccount(false);
  }

  // Función para rellenar formulario desde cuenta guardada
  function fillFormFromAccount(account: any) {
    const { category } = account;
    const methodFromAccount = account.method as string | undefined;
    const details = account.details || {};

    // Limpiar todos los campos primero
    setValue("category", undefined as any);
    setValue("method", undefined as any);
    setValue("accountOwnership", undefined as any);
    setValue("beneficiaryName", "");
    setValue("beneficiaryBank", "");
    setValue("accountType", undefined as any);
    setValue("accountNumber", "");
    setValue("routingNumber", "");
    setValue("swiftBic", "");
    setValue("walletAlias", "");
    setValue("walletAddress", "");
    setValue("walletNetwork", undefined as any);
    setValue("country", "");
    setValue("localAccountName", "");
    setValue("localBank", "");
    setValue("localAccountNumber", "");

    // Establecer categoría y método inmediatamente
    setValue("category", category as any);
    if (category === "usd_bank" && methodFromAccount) {
      setValue("method", methodFromAccount as any);
    }

    // Rellenar campos según la categoría con fallbacks desde el objeto raíz
    if (category === "usd_bank") {
      setValue(
        "accountOwnership",
        (details.accountOwnership ?? account.account_ownership) as any
      );
      setValue(
        "beneficiaryName",
        details.beneficiaryName ?? account.beneficiary_name ?? ""
      );
      setValue(
        "beneficiaryBank",
        details.beneficiaryBank ?? account.beneficiary_bank ?? ""
      );
      setValue(
        "accountType",
        (details.accountType ?? account.account_type) as any
      );
      setValue(
        "accountNumber",
        details.accountNumber ?? account.account_number ?? ""
      );
      if ((methodFromAccount ?? details.method) === "ach") {
        setValue(
          "routingNumber",
          details.routingNumber ?? account.routing_number ?? ""
        );
      }
      if ((methodFromAccount ?? details.method) === "wire") {
        setValue("swiftBic", details.swiftBic ?? account.swift_bic ?? "");
      }
    } else if (category === "crypto") {
      setValue(
        "walletAlias",
        details.walletAlias ?? account.wallet_alias ?? ""
      );
      setValue(
        "walletAddress",
        details.walletAddress ?? account.wallet_address ?? ""
      );
      setValue(
        "walletNetwork",
        (details.walletNetwork ?? account.wallet_network) as any
      );
    } else if (category === "local_currency") {
      setValue("country", details.country ?? account.country ?? "");
      setValue(
        "localAccountName",
        details.localAccountName ?? account.local_account_name ?? ""
      );
      setValue("localBank", details.localBank ?? account.local_bank ?? "");
      setValue(
        "localAccountNumber",
        details.localAccountNumber ?? account.local_account_number ?? ""
      );
    }

    setUsedSavedAccount(true);
  }

  // Renderizado condicional según el paso actual
  if (currentStep === "select-account") {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Solicitud de retiro
          </h1>
          <p className="text-muted-foreground">
            Paso 1: Selecciona la cuenta para el retiro
          </p>
        </div>

        {/* Paso 1: Selección de cuenta */}
        <div className="space-y-6">
          {/* Opción: Usar cuenta guardada */}
          <Card className="rounded-lg">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">
                    Usar cuenta guardada
                  </CardTitle>
                  <CardDescription>
                    Elige una cuenta bancaria o wallet que ya tengas guardada
                  </CardDescription>
                </div>
                {accounts.length > 0 && (
                  <Collapsible
                    open={isAccountsExpanded}
                    onOpenChange={setIsAccountsExpanded}
                  >
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-2 transition-all duration-200 hover:bg-muted/80 rounded-full"
                      >
                        {isAccountsExpanded ? (
                          <ChevronUp className="h-4 w-4 transition-transform duration-200" />
                        ) : (
                          <ChevronDown className="h-4 w-4 transition-transform duration-200" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                  </Collapsible>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!accounts.length ? (
                <div className="text-center py-8">
                  <Button
                    variant="cta"
                    onClick={loadSavedAccounts}
                    disabled={loadingAccounts}
                    className="mb-4"
                  >
                    {loadingAccounts
                      ? "Cargando..."
                      : "Cargar cuentas guardadas"}
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    Carga tus cuentas guardadas para seleccionar una
                  </p>
                </div>
              ) : (
                <Collapsible
                  open={isAccountsExpanded}
                  onOpenChange={setIsAccountsExpanded}
                >
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      {accounts.length} cuenta{accounts.length !== 1 ? "s" : ""}{" "}
                      guardada{accounts.length !== 1 ? "s" : ""}
                    </p>
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="cta"
                        size="sm"
                        className="transition-all duration-200"
                      >
                        {isAccountsExpanded ? (
                          <>
                            <ChevronUp className="h-4 w-4 mr-2 transition-transform duration-200" />
                            Ocultar cuentas
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-4 w-4 mr-2 transition-transform duration-200" />
                            Ver cuentas
                          </>
                        )}
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                  <CollapsibleContent className="space-y-4 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 duration-300">
                    {accounts.map((account, index) => (
                      <Card
                        key={account.id || index}
                        className="border-2 hover:border-violet-500 cursor-pointer transition-all duration-200 hover:shadow-md"
                        onClick={() => selectAccountAndProceed(account)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-medium">
                                {account.nickname || "Cuenta sin nombre"}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {account.category === "usd_bank" &&
                                  `${account.method?.toUpperCase()} - ${
                                    account.beneficiary_bank
                                  }`}
                                {account.category === "crypto" &&
                                  `${
                                    account.wallet_network
                                  } - ${account.wallet_address?.slice(
                                    0,
                                    10
                                  )}...`}
                                {account.category === "local_currency" &&
                                  `${account.local_bank} - ${account.country}`}
                              </p>
                            </div>
                            <Button
                              variant="default"
                              size="sm"
                              className="transition-colors duration-200"
                            >
                              Seleccionar
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              )}
            </CardContent>
          </Card>

          {/* Divisor */}
          <div className="flex items-center justify-center">
            <div className="flex-1 h-px bg-border"></div>
            <span className="px-4 text-sm text-muted-foreground">o</span>
            <div className="flex-1 h-px bg-border"></div>
          </div>

          {/* Opción: Crear nueva cuenta */}
          <Card className="rounded-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Agregar nueva cuenta</CardTitle>
              <CardDescription>
                Crea una nueva cuenta bancaria o wallet para este retiro
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6">
                <Button
                  variant="cta"
                  onClick={createNewAccountAndProceed}
                  className="mb-2"
                >
                  Crear nueva cuenta
                </Button>
                <p className="text-sm text-muted-foreground">
                  Completa los datos de una nueva cuenta de destino
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Paso 2: Detalles del retiro
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="cta" size="sm" onClick={backToAccountSelection}>
            ← Cambiar cuenta
          </Button>
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Solicitud de retiro
        </h1>
        <p className="text-muted-foreground">
          Paso 2:{" "}
          {isCreatingNewAccount
            ? "Completa los datos de la nueva cuenta"
            : "Confirma los detalles y especifica el monto"}
        </p>
        {selectedAccount && !isCreatingNewAccount && (
          <div className="mt-3 p-3 bg-muted rounded-lg">
            <p className="text-sm">
              <span className="font-medium">Cuenta seleccionada:</span>{" "}
              {selectedAccount.nickname || "Sin nombre"}
            </p>
          </div>
        )}
        {isCreatingNewAccount && (
          <div className="mt-3 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
            <p className="text-sm text-orange-700 dark:text-orange-300">
              <span className="font-medium">Nueva cuenta:</span> Completa todos
              los campos requeridos
            </p>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Card className="rounded-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Información del retiro</CardTitle>
            <CardDescription>
              Proporciona los detalles según el tipo de retiro
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Categoría de retiro */}
            <div className="space-y-2">
              <Label htmlFor="category" className="text-sm">
                Categoría de retiro *
              </Label>
              <Select
                onValueChange={handleCategoryChange}
                value={watchedCategory}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="usd_bank">
                    USD - Cuenta bancaria
                  </SelectItem>
                  <SelectItem value="crypto">Criptomonedas</SelectItem>
                  <SelectItem value="local_currency">Moneda local</SelectItem>
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-xs text-destructive">
                  {errors.category.message}
                </p>
              )}
            </div>

            {/* Campos específicos para USD Bank */}
            {watchedCategory === "usd_bank" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="method" className="text-sm">
                      Tipo de transferencia *
                    </Label>
                    <Select
                      onValueChange={(value) =>
                        setValue("method", value as any)
                      }
                      value={watchedMethod as any}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Selecciona" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ach">ACH/WIRE</SelectItem>
                        <SelectItem value="wire">SWIFT</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.method && (
                      <p className="text-xs text-destructive">
                        {errors.method.message}
                      </p>
                    )}
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
                      disabled={!isCreatingNewAccount}
                    />
                    {errors.beneficiaryName && (
                      <p className="text-xs text-destructive">
                        {errors.beneficiaryName.message}
                      </p>
                    )}
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
                      disabled={!isCreatingNewAccount}
                    />
                    {errors.beneficiaryBank && (
                      <p className="text-xs text-destructive">
                        {errors.beneficiaryBank.message}
                      </p>
                    )}
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
                      {errors.accountType && (
                        <p className="text-xs text-destructive">
                          {errors.accountType.message}
                        </p>
                      )}
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
                        disabled={!isCreatingNewAccount}
                      />
                      {errors.accountNumber && (
                        <p className="text-xs text-destructive">
                          {errors.accountNumber.message}
                        </p>
                      )}
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
                      disabled={!isCreatingNewAccount}
                    />
                    {errors.accountNumber && (
                      <p className="text-xs text-destructive">
                        {errors.accountNumber.message}
                      </p>
                    )}
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
                      disabled={!isCreatingNewAccount}
                    />
                    {errors.routingNumber && (
                      <p className="text-xs text-destructive">
                        {errors.routingNumber.message}
                      </p>
                    )}
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
                      disabled={!isCreatingNewAccount}
                    />
                    {errors.swiftBic && (
                      <p className="text-xs text-destructive">
                        {errors.swiftBic.message}
                      </p>
                    )}
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
                    disabled={!isCreatingNewAccount}
                  />
                  {errors.walletAlias && (
                    <p className="text-xs text-destructive">
                      {errors.walletAlias.message}
                    </p>
                  )}
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
                    disabled={!isCreatingNewAccount}
                  />
                  {errors.walletAddress && (
                    <p className="text-xs text-destructive">
                      {errors.walletAddress.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="walletNetwork" className="text-sm">
                    Red *
                  </Label>
                  <Select
                    onValueChange={(value) =>
                      setValue("walletNetwork", value as any)
                    }
                    value={watchedWalletNetwork as any}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Selecciona la red" />
                    </SelectTrigger>
                    <SelectContent>
                      {walletNetworks.map((network, i) => (
                        <SelectItem key={i} value={network.value}>
                          {network.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.walletNetwork && (
                    <p className="text-xs text-destructive">
                      {errors.walletNetwork.message}
                    </p>
                  )}
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
                  {errors.country && (
                    <p className="text-xs text-destructive">
                      {errors.country.message}
                    </p>
                  )}
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
                    disabled={!isCreatingNewAccount}
                  />
                  {errors.localAccountName && (
                    <p className="text-xs text-destructive">
                      {errors.localAccountName.message}
                    </p>
                  )}
                </div>

                {watchedCountry === "BO" && (
                  <div className="space-y-2">
                    <Label htmlFor="localBank" className="text-sm">
                      Banco *
                    </Label>
                    <Select
                      onValueChange={(value) => setValue("localBank", value)}
                      value={watchedLocalBank || undefined}
                      disabled={!isCreatingNewAccount}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Selecciona el banco" />
                      </SelectTrigger>
                      <SelectContent>
                        {boliviaBanks.map((bank, i) => (
                          <SelectItem key={i} value={bank}>
                            {bank}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.localBank && (
                      <p className="text-xs text-destructive">
                        {errors.localBank.message}
                      </p>
                    )}
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
                      disabled={!isCreatingNewAccount}
                    />
                    {errors.localBank && (
                      <p className="text-xs text-destructive">
                        {errors.localBank.message}
                      </p>
                    )}
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
                    disabled={!isCreatingNewAccount}
                  />
                  {errors.localAccountNumber && (
                    <p className="text-xs text-destructive">
                      {errors.localAccountNumber.message}
                    </p>
                  )}
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
                  placeholder="0.00"
                  className="pl-10 font-mono h-9"
                />
              </div>
              {errors.amount && (
                <p className="text-xs text-destructive">
                  {errors.amount.message}
                </p>
              )}
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

            {/* Guardar cuenta */}
            {isCreatingNewAccount && (
              <div className="space-y-2">
                {watchedCategory !== "crypto" && (
                  <div className="space-y-2 mb-4">
                    <Label htmlFor="saveNickname" className="text-sm">
                      Alias para guardar cuenta
                    </Label>
                    <Input
                      id="saveNickname"
                      {...register("saveNickname" as any)}
                      placeholder="Alias para la cuenta (requerido para guardar)"
                      className="h-9"
                    />
                  </div>
                )}
                <Button
                  type="button"
                  variant="cta"
                  size="sm"
                  onClick={async () => {
                    const formData = getValues();
                    const { category, method } = formData as any;

                    // Validar que tengamos datos básicos
                    if (!category) {
                      toast({
                        title: "Selecciona una categoría",
                        description:
                          "Primero completa la información básica de la cuenta",
                        variant: "destructive",
                      });
                      return;
                    }

                    // Validar que tengamos un alias/apodo según la categoría
                    let nickname = null;
                    if (category === "crypto") {
                      if (!formData.walletAlias) {
                        toast({
                          title: "Apodo requerido",
                          description:
                            "Para guardar una cuenta crypto, debes completar el 'Apodo de la billetera'",
                          variant: "destructive",
                        });
                        return;
                      }
                      nickname = formData.walletAlias;
                    } else if (category === "usd_bank") {
                      if (!(formData as any).saveNickname) {
                        toast({
                          title: "Alias requerido",
                          description:
                            "Para guardar una cuenta bancaria, debes agregar un alias",
                          variant: "destructive",
                        });
                        return;
                      }
                      nickname = (formData as any).saveNickname;
                    } else if (category === "local_currency") {
                      if (!(formData as any).saveNickname) {
                        toast({
                          title: "Alias requerido",
                          description:
                            "Para guardar una cuenta local, debes agregar un alias",
                          variant: "destructive",
                        });
                        return;
                      }
                      nickname = (formData as any).saveNickname;
                    }

                    // Obtener email del usuario
                    let userEmail = null;
                    try {
                      const storedUser = localStorage.getItem("takenos_user");
                      if (storedUser) {
                        const parsedUser = JSON.parse(storedUser);
                        userEmail = parsedUser.email;
                      }
                    } catch (e) {
                      console.error("Error reading from localStorage:", e);
                    }

                    if (!userEmail && user?.email) {
                      userEmail = user.email;
                    }

                    if (!userEmail) {
                      toast({
                        title: "Error",
                        description: "No se pudo obtener el email del usuario",
                        variant: "destructive",
                      });
                      return;
                    }

                    // Construir detalles según categoría
                    let details: any = {};
                    if (category === "usd_bank") {
                      details = {
                        beneficiaryName: formData.beneficiaryName,
                        beneficiaryBank: formData.beneficiaryBank,
                        accountType: formData.accountType,
                        accountNumber: formData.accountNumber,
                        accountOwnership: formData.accountOwnership,
                      };
                      if (method === "ach") {
                        details.routingNumber = formData.routingNumber;
                      }
                      if (method === "wire") {
                        details.swiftBic = formData.swiftBic;
                      }
                    } else if (category === "crypto") {
                      details = {
                        walletAlias: formData.walletAlias,
                        walletAddress: formData.walletAddress,
                        walletNetwork: formData.walletNetwork,
                      };
                    } else if (category === "local_currency") {
                      details = {
                        localAccountName: formData.localAccountName,
                        localBank: formData.localBank,
                        localAccountNumber: formData.localAccountNumber,
                      };
                    }

                    try {
                      // Evitar alias duplicado
                      const fetchEmail = async (): Promise<string | null> => {
                        try {
                          const storedUser =
                            localStorage.getItem("takenos_user");
                          if (storedUser) {
                            const parsedUser = JSON.parse(storedUser);
                            return parsedUser.email;
                          }
                        } catch {}
                        return user?.email ?? null;
                      };
                      const emailForCheck = await fetchEmail();
                      if (!emailForCheck) {
                        toast({
                          title: "Error",
                          description:
                            "No se pudo obtener el email del usuario",
                          variant: "destructive",
                        });
                        return;
                      }
                      const existingRes = await authenticatedFetch(
                        `/api/payout-accounts`,
                        {
                          method: "GET",
                        }
                      );
                      const existingJson = await existingRes
                        .json()
                        .catch(() => ({}));
                      const existing = Array.isArray(existingJson?.data)
                        ? existingJson.data
                        : [];
                      const aliasExists = existing.some(
                        (a: any) =>
                          (a.nickname || "").toLowerCase() ===
                          (nickname || "").toLowerCase()
                      );
                      if (aliasExists) {
                        toast({
                          title: "Alias ya usado",
                          description:
                            "Elegí un alias diferente para esta cuenta.",
                          variant: "destructive",
                        });
                        return;
                      }

                      const saveResp = await authenticatedFetch(
                        "/api/payout-accounts",
                        {
                          method: "POST",
                          body: JSON.stringify({
                            category,
                            method: method ?? null,
                            nickname,
                            details,
                          }),
                        }
                      );
                      const saveJson = await saveResp.json().catch(() => ({}));
                      if (saveResp.ok && saveJson?.ok) {
                        toast({
                          title: "Cuenta guardada",
                          description:
                            "La cuenta fue guardada correctamente para futuros retiros.",
                        });
                      } else {
                        toast({
                          title: "No se pudo guardar la cuenta",
                          description: saveJson?.error || "Intentá más tarde.",
                          variant: "destructive",
                        });
                      }
                    } catch (e) {
                      console.error("Error guardando la cuenta:", e);
                      toast({
                        title: "Error",
                        description:
                          "No se pudo guardar la cuenta. Intentá más tarde.",
                        variant: "destructive",
                      });
                    }
                  }}
                  className="w-full"
                >
                  Guardar cuenta para futuros retiros
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            Verifica que todos los datos sean correctos. Los errores pueden
            causar retrasos o devoluciones con cargos adicionales.
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
  );
}
