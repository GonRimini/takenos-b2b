"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { WithdrawalSummaryModal } from "@/components/withdrawal-summary-modal";
import { type WithdrawalFormData } from "@/lib/withdrawal-schema";
import { useToast } from "@/hooks/use-toast";
import { useCacheInvalidation } from "@/hooks/use-cache-invalidation";
import {
  useLoadAccountsQuery,
  useSubmitWithdrawalMutation,
  useFileUploadMutation,
  useSaveAccountMutation,
} from "@/hooks/withdrawal/queries";
import {
  AlertCircle,
  DollarSign,
  ChevronDown,
  ChevronUp,
  FileText,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getApiEmailForUser } from "@/lib/utils";
import {
  formatCurrencyValue,
  getUserEmailFromStorage,
  fillFormFromAccount,
  resetWithdrawalForm,
} from "@/lib/withdrawal-helpers";
import CreateAccountWizard from "@/components/shared/CreateAccountWizard";

export default function RetirarPage() {
  const [showSummary, setShowSummary] = useState(false);
  const [usedSavedAccount, setUsedSavedAccount] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);

  // Estados del wizard
  const [currentStep, setCurrentStep] = useState<
    "select-account" | "withdrawal-details"
  >("select-account");
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [isCreatingNewAccount, setIsCreatingNewAccount] = useState(false);
  const [isAccountsExpanded, setIsAccountsExpanded] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { invalidateWithdrawalsCache } = useCacheInvalidation();
  const { authenticatedFetch } = useAuthenticatedFetch();

  // React Query hook para cuentas de pago
  const {
    data: accounts = [],
    isLoading: loadingAccounts,
    error: accountsError,
    refetch: refetchAccounts,
  } = useLoadAccountsQuery(true);

  // React Query hook para envío de withdrawal
  const submitWithdrawalMutation = useSubmitWithdrawalMutation();

  // React Query hook para subida de archivos
  const fileUploadMutation = useFileUploadMutation();

  // React Query hook para guardar cuentas
  const saveAccountMutation = useSaveAccountMutation();

  // Estado de loading basado en las mutations
  const isSubmitting =
    fileUploadMutation.isPending || submitWithdrawalMutation.isPending;

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

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrencyValue(e.target.value);
    setValue("amount", formatted);
  };

  const onSubmit = async (data: WithdrawalFormData) => {
    // Si hay archivo seleccionado, subirlo antes de mostrar el modal usando React Query
    if (selectedFile && selectedFile instanceof File) {
      try {
        const userEmail = getUserEmailFromStorage(user);

        if (!userEmail) {
          toast({
            title: "Error",
            description: "No se pudo obtener el email del usuario",
            variant: "destructive",
          });
          return;
        }

        // Subir archivo usando React Query mutation
        const uploadResult = await fileUploadMutation.mutateAsync({
          file: selectedFile,
          userEmail,
        });

        setUploadedFileUrl(uploadResult.publicUrl);
      } catch (uploadError) {
        // Los errores ya son manejados por el mutation
        console.error("Error during file upload in onSubmit:", uploadError);
        return;
      }
    }

    setShowSummary(true);
  };

  const handleConfirmSubmission = async () => {
    const formData = getValues();

    try {
      // Obtener email del usuario usando la helper function
      const userEmail = getUserEmailFromStorage(user);

      if (!userEmail) {
        throw new Error(
          "No se pudo obtener el email del usuario. Por favor, recarga la página."
        );
      }

      let fileUrl = uploadedFileUrl;

      // Subir archivo si es necesario usando React Query
      if (!fileUrl && selectedFile && selectedFile instanceof File) {
        const uploadResult = await fileUploadMutation.mutateAsync({
          file: selectedFile,
          userEmail,
        });
        fileUrl = uploadResult.publicUrl;
      }

      // Preparar datos para envío
      const submitData = {
        ...formData,
        receiptFileUrl: fileUrl || uploadedFileUrl,
        receiptFileName: selectedFile?.name,
      };

      // Enviar withdrawal usando React Query
      await submitWithdrawalMutation.mutateAsync({
        formData: submitData,
        userEmail,
      });

      // Invalidar caché de retiros pendientes
      invalidateWithdrawalsCache(getApiEmailForUser(userEmail));

      // Limpiar formulario y estado
      setShowSummary(false);
      setValue("category", undefined as any);
      setValue("method", undefined as any);
      setValue("amount", "");
      setValue("reference", "");
      setValue("receiptFile", undefined);
      setValue("saveNickname" as any, "");
      setUsedSavedAccount(false);
      setSelectedFile(null);
      setUploadedFileUrl(null);

      // Clear other fields
      Object.keys(formData).forEach((key) => {
        if (
          key !== "category" &&
          key !== "method" &&
          key !== "amount" &&
          key !== "reference" &&
          key !== "receiptFile" &&
          key !== "saveNickname"
        ) {
          setValue(key as any, "");
        }
      });
    } catch (error) {
      console.error("Error submitting withdrawal:", error);
      // Los errores ya son manejados por los mutations de React Query
    }
  };

  // Manejar errores de carga de cuentas
  if (accountsError) {
    console.error("Error loading accounts:", accountsError);
    // Solo mostrar toast una vez cuando hay error
    if (accountsError && !loadingAccounts) {
      toast({
        title: "Error",
        description:
          accountsError instanceof Error
            ? accountsError.message
            : "No se pudieron cargar las cuentas guardadas",
        variant: "destructive",
      });
    }
  }

  // Función para seleccionar cuenta y avanzar al paso 2
  function selectAccountAndProceed(account: any) {
    setSelectedAccount(account);
    handleFillFormFromAccount(account);
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
    handleResetForm();
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
    handleResetForm();
  }

  // Función para resetear formulario (modularizada)
  const handleResetForm = () => {
    resetWithdrawalForm(setValue, {
      setUsedSavedAccount,
      setSelectedFile,
      setUploadedFileUrl,
    });
  };

  // Función para rellenar formulario desde cuenta guardada (modularizada)
  const handleFillFormFromAccount = (account: any) => {
    fillFormFromAccount(account, setValue);
    setUsedSavedAccount(true);
  };

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
                    onClick={() => refetchAccounts()}
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

  // Si está creando nueva cuenta, mostrar solo el wizard
  if (currentStep === "withdrawal-details" && isCreatingNewAccount) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Button variant="cta" size="sm" onClick={backToAccountSelection}>
              ← Cambiar cuenta
            </Button>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Crear nueva cuenta para retiro
          </h1>
          <p className="text-muted-foreground">
            Completa los datos de la nueva cuenta de destino
          </p>
        </div>

        <CreateAccountWizard
          userEmail={getUserEmailFromStorage(user) || undefined}
          flowType="withdrawal"
          onCreated={async () => {
            // Volver al paso de selección de cuenta
            setCurrentStep("select-account");
            setIsCreatingNewAccount(false);
            setSelectedAccount(null);
            handleResetForm();
            // Recargar las cuentas para mostrar la nueva
            await refetchAccounts();
          }}
          onCancel={backToAccountSelection}
          title="Crear cuenta para retiro"
          description="Selecciona el tipo de cuenta y completa los datos"
        />
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
            {/* Campos de cuenta seleccionada (disabled y auto-llenados) */}
            {selectedAccount && !isCreatingNewAccount && (
              <>
                {/* Categoría */}
                <div className="space-y-2">
                  <Label className="text-sm">Categoría *</Label>
                  <Input
                    value={
                      selectedAccount.category === "usd_bank"
                        ? "USD - Cuenta bancaria"
                        : selectedAccount.category === "crypto"
                        ? "Criptomonedas"
                        : "Moneda local"
                    }
                    disabled
                    className="h-9 bg-muted"
                  />
                </div>

                {/* Campos para USD Bank */}
                {selectedAccount.category === "usd_bank" && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm">Método</Label>
                        <Input
                          value={(selectedAccount.method || selectedAccount.details?.method || "").toUpperCase()}
                          disabled
                          className="h-9 bg-muted"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Alias de la cuenta</Label>
                        <Input
                          value={selectedAccount.nickname || selectedAccount.details?.nickname || ""}
                          disabled
                          className="h-9 bg-muted"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm">Nombre del beneficiario</Label>
                        <Input
                          value={selectedAccount.details?.beneficiaryName || selectedAccount.beneficiary_name || ""}
                          disabled
                          className="h-9 bg-muted"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Banco del beneficiario</Label>
                        <Input
                          value={selectedAccount.details?.beneficiaryBank || selectedAccount.beneficiary_bank || ""}
                          disabled
                          className="h-9 bg-muted"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm">Tipo de cuenta</Label>
                        <Input
                          value={selectedAccount.details?.accountType || selectedAccount.account_type || ""}
                          disabled
                          className="h-9 bg-muted"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Número de cuenta</Label>
                        <Input
                          value={selectedAccount.details?.accountNumber || selectedAccount.account_number || ""}
                          disabled
                          className="h-9 bg-muted"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm">
                          {(selectedAccount.method || selectedAccount.details?.method) === "wire" ? "SWIFT/BIC" : "Routing Number"}
                        </Label>
                        <Input
                          value={
                            (selectedAccount.method || selectedAccount.details?.method) === "wire"
                              ? (selectedAccount.details?.swiftBic || selectedAccount.swift_bic || "")
                              : (selectedAccount.details?.routingNumber || selectedAccount.routing_number || "")
                          }
                          disabled
                          className="h-9 bg-muted"
                        />
                      </div>
                      {(selectedAccount.details?.address || selectedAccount.bank_address) && (
                        <div className="space-y-2">
                          <Label className="text-sm">Dirección del banco</Label>
                          <Input
                            value={selectedAccount.details?.address || selectedAccount.bank_address || ""}
                            disabled
                            className="h-9 bg-muted"
                          />
                        </div>
                      )}
                    </div>

                    {/* Campos adicionales que pueden estar en algunos tipos de cuenta */}
                    {(selectedAccount.details?.walletAddress || selectedAccount.wallet_address) && (
                      <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm">Wallet Address</Label>
                          <Input
                            value={selectedAccount.details?.walletAddress || selectedAccount.wallet_address || ""}
                            disabled
                            className="h-9 bg-muted font-mono text-xs"
                          />
                        </div>
                      </div>
                    )}

                    {(selectedAccount.details?.network || selectedAccount.network) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm">Network</Label>
                          <Input
                            value={selectedAccount.details?.network || selectedAccount.network || ""}
                            disabled
                            className="h-9 bg-muted"
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Campos para Crypto */}
                {selectedAccount.category === "crypto" && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm">Alias del wallet</Label>
                        <Input
                          value={selectedAccount.details?.walletAlias || selectedAccount.wallet_alias || selectedAccount.nickname || ""}
                          disabled
                          className="h-9 bg-muted"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Red</Label>
                        <Input
                          value={selectedAccount.details?.network || selectedAccount.wallet_network || selectedAccount.network || ""}
                          disabled
                          className="h-9 bg-muted"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm">Dirección del wallet</Label>
                      <Input
                        value={selectedAccount.details?.walletAddress || selectedAccount.wallet_address || ""}
                        disabled
                        className="h-9 bg-muted font-mono text-xs"
                      />
                    </div>
                  </>
                )}

                {/* Campos para Local Currency */}
                {selectedAccount.category === "local_currency" && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm">Alias de la cuenta</Label>
                        <Input
                          value={selectedAccount.details?.nickname || selectedAccount.nickname || ""}
                          disabled
                          className="h-9 bg-muted"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">País</Label>
                        <Input
                          value={selectedAccount.details?.country || selectedAccount.country || ""}
                          disabled
                          className="h-9 bg-muted"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm">Nombre del titular</Label>
                        <Input
                          value={selectedAccount.details?.localAccountName || selectedAccount.local_account_name || ""}
                          disabled
                          className="h-9 bg-muted"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Banco</Label>
                        <Input
                          value={selectedAccount.details?.localBank || selectedAccount.local_bank || ""}
                          disabled
                          className="h-9 bg-muted"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm">Número de cuenta</Label>
                      <Input
                        value={selectedAccount.details?.localAccountNumber || selectedAccount.local_account_number || ""}
                        disabled
                        className="h-9 bg-muted"
                      />
                    </div>
                  </>
                )}

                {/* Separador visual */}
                <div className="border-t pt-4 mt-6">
                  <h3 className="text-base font-medium mb-4">Detalles del retiro</h3>
                </div>
              </>
            )}

            {/* Campos de retiro */}
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

            {/* Comprobante PDF */}
            <div className="space-y-2">
              <Label htmlFor="receiptFile" className="text-sm">
                Comprobante PDF *
              </Label>
              <Input
                id="receiptFile"
                type="file"
                accept="application/pdf"
                {...register("receiptFile")}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    // Validar tipo de archivo
                    if (file.type !== "application/pdf") {
                      toast({
                        title: "Error",
                        description: "Por favor, selecciona un archivo PDF",
                        variant: "destructive",
                      });
                      e.target.value = ""; // Limpiar input
                      setSelectedFile(null);
                      setValue("receiptFile", undefined);
                      return;
                    }
                    // Validar tamaño (10MB máximo)
                    if (file.size > 10 * 1024 * 1024) {
                      toast({
                        title: "Error",
                        description: "El archivo es muy grande. Máximo 10MB",
                        variant: "destructive",
                      });
                      e.target.value = ""; // Limpiar input
                      setSelectedFile(null);
                      setValue("receiptFile", undefined);
                      return;
                    }
                    setSelectedFile(file);
                    setValue("receiptFile", file);
                  } else {
                    setSelectedFile(null);
                    setValue("receiptFile", undefined);
                  }
                }}
                className="h-9 cursor-pointer file:cursor-pointer file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              />
              {errors.receiptFile && (
                <p className="text-xs text-destructive">
                  {String(errors.receiptFile.message)}
                </p>
              )}
              {selectedFile && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted p-2 rounded">
                  <FileText className="h-3 w-3" />
                  <span>
                    {selectedFile.name} (
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Sube una factura, contrato, o documento PDF que justifique tu
                retiro (máx. 10MB)
              </p>
            </div>
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
        data={{
          ...getValues(),
          receiptFile: selectedFile,
          receiptFileUrl: uploadedFileUrl || undefined,
          receiptFileName: selectedFile?.name,
        }}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
