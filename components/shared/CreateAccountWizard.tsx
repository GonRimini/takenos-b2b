"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

// Importar los formularios existentes de depósitos
import AccountFormACH from "../deposit/AccountFormACH";
import AccountFormSwift from "../deposit/AccountFormSwift";
import AccountFormCrypto from "../deposit/AccountFormCrypto";
import AccountFormLocal from "../deposit/AccountFormLocal";

// Importar hooks para retiros y depósitos
import { useSaveAccountMutation as useWithdrawalSaveAccountMutation } from "@/hooks/withdrawal/queries";
import { useSaveAccountMutation as useDepositSaveAccountMutation } from "@/hooks/deposits/queries";

type AccountCategory = "usd_bank" | "crypto" | "local_currency"; // Para retiros
type DepositMethod = "ach" | "swift" | "crypto" | "local"; // Para depósitos
type FlowType = "withdrawal" | "deposit";

interface CreateAccountWizardProps {
  userEmail?: string;
  flowType: FlowType;
  onCreated: () => Promise<void> | void;
  onCancel: () => void;
  title?: string;
  description?: string;
}

export default function CreateAccountWizard({ 
  userEmail, 
  flowType, 
  onCreated, 
  onCancel,
  title = "Crear nueva cuenta",
  description = "Elegí el método y completá los datos"
}: CreateAccountWizardProps) {
  const [selectedMethod, setSelectedMethod] = useState<string | undefined>(undefined);

  // Obtener el mutation hook correcto según el flujo
  const withdrawalSaveMutation = useWithdrawalSaveAccountMutation();
  const depositSaveMutation = useDepositSaveAccountMutation();

  const saveMutation = flowType === "withdrawal" ? withdrawalSaveMutation : depositSaveMutation;

  // Configuración unificada - siempre usamos las categorías de withdrawal
  const getTabsConfig = () => {
    return [
      { value: "usd_bank", label: "USD Bank", methods: ["ach", "wire"] },
      { value: "crypto", label: "Crypto", methods: [] },
      { value: "local_currency", label: "Moneda Local", methods: [] }
    ];
  };

  const tabsConfig = getTabsConfig();

  // Handler para cuando se guarda una cuenta exitosamente
  const handleAccountSaved = async () => {
    await onCreated();
  };

  return (
    <Card className="rounded-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Button variant="outline" onClick={onCancel} size="sm">
            Cancelar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Ambos flujos usan el mismo formulario integrado */}
        <UnifiedAccountForm
          userEmail={userEmail}
          saveMutation={saveMutation}
          onSaved={handleAccountSaved}
          onCancel={onCancel}
          flowType={flowType}
        />
      </CardContent>
    </Card>
  );
}

// Imports adicionales para el formulario de retiros
import { useForm } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  validateAccountData, 
  buildAccountDetails, 
  getUserEmailFromStorage 
} from "@/lib/withdrawal-helpers";
import { boliviaBanks, walletNetworks } from "@/lib/withdrawal-config";
import { useAuth } from "@/components/auth";

// Componente unificado para ambos flujos (retiros y depósitos)
function UnifiedAccountForm({ 
  userEmail, 
  saveMutation, 
  onSaved, 
  onCancel,
  flowType
}: {
  userEmail?: string;
  saveMutation: any;
  onSaved: () => void;
  onCancel: () => void;
  flowType: FlowType;
}) {

  const { user } = useAuth();
  const { toast } = useToast();
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    getValues,
  } = useForm();

  const watchedCategory = watch("category");
  const watchedMethod = watch("method");
  const watchedCountry = watch("country");
  const watchedAccountType = watch("accountType");
  const watchedWalletNetwork = watch("walletNetwork");
  const watchedLocalBank = watch("localBank");

  const handleCategoryChange = (value: string) => {
    setValue("category", value);
    // Limpiar campos dependientes cuando cambia la categoría
    setValue("method", undefined);
  };

  const handleSaveAccount = async () => {
    const formData = getValues();

    // Validar datos básicos
    const validation = validateAccountData(formData);
    if (!validation.isValid) {
      toast({
        title: validation.error!.title,
        description: validation.error!.description,
        variant: "destructive",
      });
      return;
    }

    // Obtener email del usuario
    const userEmailToUse = userEmail || getUserEmailFromStorage(user);
    if (!userEmailToUse) {
      toast({
        title: "Error",
        description: "No se pudo obtener el email del usuario",
        variant: "destructive",
      });
      return;
    }

    // Construir payload para el mutation
    const { category, method } = formData;
    let details = buildAccountDetails(formData);
    
    // Mapear categorías y ajustar payload según el tipo de flujo
    let finalCategory = category;
    let payload: any;
    
    if (flowType === "deposit") {
      // Para depósitos, usar el formato del payload de depósitos
      if (category === "usd_bank") {
        if (method === "ach") {
          finalCategory = "deposit";
          payload = {
            user_email: userEmailToUse,
            category: "deposit",
            method: "ach",
            nickname: validation.nickname!,
            is_default: false,
            beneficiary_name: formData.beneficiaryName,
            beneficiary_bank: formData.beneficiaryBank,
            account_type: formData.accountType,
            account_number: formData.accountNumber,
            routing_number: formData.routingNumber,
            last4: formData.accountNumber ? formData.accountNumber.slice(-4) : undefined,
            details: {
              beneficiary_name: formData.beneficiaryName,
              beneficiary_bank: formData.beneficiaryBank,
              account_type: formData.accountType,
              account_number: formData.accountNumber,
              routing_number: formData.routingNumber,
            },
          };
        } else if (method === "wire") {
          finalCategory = "deposit";
          payload = {
            user_email: userEmailToUse,
            category: "deposit", 
            method: "swift",
            nickname: validation.nickname!,
            is_default: false,
            beneficiary_name: formData.beneficiaryName,
            beneficiary_bank: formData.beneficiaryBank,
            account_number: formData.accountNumber,
            swift_bic: formData.swiftBic,
            last4: formData.accountNumber ? formData.accountNumber.slice(-4) : undefined,
            details: {
              beneficiary_name: formData.beneficiaryName,
              beneficiary_bank: formData.beneficiaryBank,
              account_number: formData.accountNumber,
              swift_bic: formData.swiftBic,
            },
          };
        }
      } else if (category === "crypto") {
        payload = {
          user_email: userEmailToUse,
          category: "deposit",
          method: "crypto",
          nickname: formData.walletAlias,
          is_default: false,
          wallet_alias: formData.walletAlias,
          wallet_address: formData.walletAddress,
          wallet_network: formData.walletNetwork,
          details: {
            wallet_alias: formData.walletAlias,
            wallet_address: formData.walletAddress,
            wallet_network: formData.walletNetwork,
          },
        };
      } else if (category === "local_currency") {
        payload = {
          user_email: userEmailToUse,
          category: "deposit",
          method: "local",
          nickname: validation.nickname!,
          is_default: false,
          local_account_name: formData.localAccountName,
          local_bank: formData.localBank,
          local_account_number: formData.localAccountNumber,
          // country: formData.country,
          details: {
            local_account_name: formData.localAccountName,
            local_bank: formData.localBank,
            local_account_number: formData.localAccountNumber,
            // country: formData.country,
          },
        };
      }
    } else {
      // Para retiros, usar el formato original
      payload = {
        user_email: userEmailToUse,
        category,
        method: method ?? null,
        nickname: validation.nickname!,
        details,
      };
    }

    try {
      // Usar el mutation de React Query
      await saveMutation.mutateAsync(payload);
      onSaved();
    } catch (error) {
      console.error("Error in handleSaveAccount:", error);
    }
  };
  
  return (
    <div className="space-y-4">
      {/* Categoría de retiro */}
      <div className="space-y-2">
        <Label htmlFor="category" className="text-sm">
          Categoría *
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
      </div>

      {/* Campos específicos para USD Bank */}
      {watchedCategory === "usd_bank" && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="method" className="text-sm">
                Tipo de transferencia *
              </Label>
              <Select onValueChange={(value: string) => setValue("method", value)} value={watchedMethod}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Selecciona" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ach">ACH/WIRE</SelectItem>
                  <SelectItem value="wire">SWIFT</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="beneficiaryName" className="text-sm">
                Titular de la cuenta *
              </Label>
              <Input
                {...register("beneficiaryName")}
                placeholder="Nombre completo"
                className="h-9"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="beneficiaryBank" className="text-sm">
                Banco *
              </Label>
              <Input
                {...register("beneficiaryBank")}
                placeholder="Nombre del banco"
                className="h-9"
              />
            </div>
          </div>

          {watchedMethod === "ach" ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="accountType" className="text-sm">
                  Tipo de cuenta *
                </Label>
                <Select onValueChange={(value: string) => setValue("accountType", value)} value={watchedAccountType}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Selecciona" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="checking">Checking</SelectItem>
                    <SelectItem value="saving">Saving</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="accountNumber" className="text-sm">
                  Número de cuenta *
                </Label>
                <Input
                  {...register("accountNumber")}
                  placeholder="Número de cuenta"
                  className="font-mono h-9"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="accountNumber" className="text-sm">
                Número de cuenta / IBAN *
              </Label>
              <Input
                {...register("accountNumber")}
                placeholder="Número de cuenta o IBAN"
                className="font-mono h-9"
              />
            </div>
          )}

          {watchedMethod === "ach" && (
            <div className="space-y-2">
              <Label htmlFor="routingNumber" className="text-sm">
                Routing Number *
              </Label>
              <Input
                {...register("routingNumber")}
                placeholder="123456789"
                className="font-mono h-9"
                maxLength={9}
              />
            </div>
          )}

          {watchedMethod === "wire" && (
            <div className="space-y-2">
              <Label htmlFor="swiftBic" className="text-sm">
                SWIFT/BIC *
              </Label>
              <Input
                {...register("swiftBic")}
                placeholder="ABCDUS33XXX"
                className="font-mono h-9"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="saveNickname" className="text-sm">
              Alias para guardar cuenta *
            </Label>
            <Input
              {...register("saveNickname")}
              placeholder="Mi cuenta bancaria"
              className="h-9"
            />
          </div>
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
              {...register("walletAlias")}
              placeholder="Mi billetera principal"
              className="h-9"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="walletAddress" className="text-sm">
              Dirección de la billetera *
            </Label>
            <Input
              {...register("walletAddress")}
              placeholder="0x..."
              className="font-mono h-9"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="walletNetwork" className="text-sm">
              Red *
            </Label>
            <Select onValueChange={(value: string) => setValue("walletNetwork", value)} value={watchedWalletNetwork}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Selecciona la red" />
              </SelectTrigger>
              <SelectContent>
                {walletNetworks?.map((network: any, i: number) => (
                  <SelectItem key={i} value={network.value}>
                    {network.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      {/* Campos específicos para Moneda Local */}
      {watchedCategory === "local_currency" && (
        <>
          {/* <div className="space-y-2">
            <Label htmlFor="country" className="text-sm">
              País *
            </Label>
            <Select onValueChange={(value: string) => setValue("country", value)} value={watchedCountry}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Selecciona el país" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BO">Bolivia</SelectItem>
                <SelectItem value="AR">Argentina</SelectItem>
              </SelectContent>
            </Select>
          </div> */}

          <div className="space-y-2">
            <Label htmlFor="localAccountName" className="text-sm">
              Nombre de la cuenta *
            </Label>
            <Input
              {...register("localAccountName")}
              placeholder="Nombre completo del titular"
              className="h-9"
            />
          </div>

          {watchedCountry === "BO" ? (
            <div className="space-y-2">
              <Label htmlFor="localBank" className="text-sm">
                Banco *
              </Label>
              <Select onValueChange={(value: string) => setValue("localBank", value)} value={watchedLocalBank}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Selecciona el banco" />
                </SelectTrigger>
                <SelectContent>
                  {boliviaBanks?.map((bank: string, i: number) => (
                    <SelectItem key={i} value={bank}>
                      {bank}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="localBank" className="text-sm">
                Banco *
              </Label>
              <Input
                {...register("localBank")}
                placeholder="Nombre del banco"
                className="h-9"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="localAccountNumber" className="text-sm">
              Número de cuenta *
            </Label>
            <Input
              {...register("localAccountNumber")}
              placeholder="Número de cuenta"
              className="font-mono h-9"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="saveNickname" className="text-sm">
              Alias para guardar cuenta *
            </Label>
            <Input
              {...register("saveNickname")}
              placeholder="Mi cuenta local"
              className="h-9"
            />
          </div>
        </>
      )}

      <div className="flex items-center justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onCancel} disabled={saveMutation.isPending}>
          Cancelar
        </Button>
        <Button 
          variant="cta" 
          onClick={handleSaveAccount} 
          disabled={saveMutation.isPending || !watchedCategory}
        >
          {saveMutation.isPending ? "Guardando..." : "Guardar cuenta"}
        </Button>
      </div>
    </div>
  );
}