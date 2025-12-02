"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "@/components/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Textarea } from "@/components/ui/textarea";
// import { Label } from "@/components/ui/label";
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
  useCreateWithdrawalRequestMutation,
} from "@/hooks/withdrawal/queries";
// import { useExternalAccountQuery } from "@/hooks/external-accounts/queries";
import {
  // AlertCircle,
  // DollarSign,
  ChevronDown,
  ChevronUp,
  // FileText,
} from "lucide-react";
// import { Alert, AlertDescription } from "@/components/ui/alert";
import { getApiEmailForUser } from "@/lib/utils";
import {
  formatCurrencyValue,
  getUserEmailFromStorage,
  fillFormFromAccount,
  resetWithdrawalForm,
} from "@/lib/withdrawal-helpers";
import { CreateExternalAccountWizard } from "@/components/external-accounts";
import { WithdrawalDetailsStep } from "@/components/withdrawal/WithdrawalDetailsStep";

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

  // React Query hook para crear withdrawal request
  const createWithdrawalMutation = useCreateWithdrawalRequestMutation();

  // Estado de loading basado en las mutations
  const isSubmitting =
    fileUploadMutation.isPending || createWithdrawalMutation.isPending;

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
      if (!selectedAccount?.id) {
        toast({
          title: "Error",
          description: "No se ha seleccionado una cuenta válida",
          variant: "destructive",
        });
        return;
      }

      // Obtener email del usuario
      const userEmail = getUserEmailFromStorage(user);
      if (!userEmail) {
        throw new Error(
          "No se pudo obtener el email del usuario. Por favor, recarga la página."
        );
      }

      let fileUrl = uploadedFileUrl;

      // Subir archivo si es necesario
      if (!fileUrl && selectedFile && selectedFile instanceof File) {
        const uploadResult = await fileUploadMutation.mutateAsync({
          file: selectedFile,
          userEmail,
        });
        fileUrl = uploadResult.publicUrl;
      }

      // Parsear el monto
      const amount = parseFloat(formData.amount.replace(/[,$]/g, ""));
      if (isNaN(amount) || amount <= 0) {
        toast({
          title: "Error",
          description: "Monto inválido",
          variant: "destructive",
        });
        return;
      }

      // Preparar datos enriquecidos para notificaciones
      const buildAccountDetails = (account: any): string | null => {
        if (!account?.details) return null;
        const details = account.details;
        const parts = [];
        if (details.account_number) parts.push(`Cuenta: ${details.account_number}`);
        if (details.bank_name) parts.push(`Banco: ${details.bank_name}`);
        if (details.wallet_address) parts.push(`Wallet: ${details.wallet_address}`);
        if (details.routing_number) parts.push(`Routing: ${details.routing_number}`);
        return parts.length > 0 ? parts.join(", ") : null;
      };

      // Crear withdrawal request con la nueva API
      const result = await createWithdrawalMutation.mutateAsync({
        external_account_id: selectedAccount.id,
        currency_code: selectedAccount.currency_code || "USD",
        rail: selectedAccount.rail,
        initial_amount: amount,
        external_reference: formData.reference || null,
        file_url: fileUrl || null,
        // Datos para notificaciones
        companyName: user?.dbUser?.company?.name ?? null,
        externalAccountNickname: selectedAccount.nickname ?? null,
        externalAccountDetails: buildAccountDetails(selectedAccount),
      });

      if (result.ok) {
        // Invalidar caché de retiros pendientes
        invalidateWithdrawalsCache(getApiEmailForUser(userEmail));

        // Limpiar formulario y volver al paso 1
        setShowSummary(false);
        setCurrentStep("select-account");
        setSelectedAccount(null);
        setIsCreatingNewAccount(false);
        setValue("amount", "");
        setValue("reference", "");
        setValue("receiptFile", undefined);
        setSelectedFile(null);
        setUploadedFileUrl(null);
      }
    } catch (error) {
      console.error("Error submitting withdrawal:", error);
      // Los errores ya son manejados por la mutation
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

        <CreateExternalAccountWizard
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
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <WithdrawalDetailsStep
          selectedAccount={selectedAccount}
          isCreatingNewAccount={isCreatingNewAccount}
          onBack={backToAccountSelection}
          register={register}
          setValue={setValue}
          errors={errors}
          selectedFile={selectedFile}
          setSelectedFile={setSelectedFile}
          handleAmountChange={handleAmountChange}
        />
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
        selectedAccount={selectedAccount}
        isSubmitting={isSubmitting}
      />
    </>
  );
}
