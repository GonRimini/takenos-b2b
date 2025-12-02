"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { useToast } from "@/hooks/use-toast";
import { useCreateExternalAccountMutation } from "@/hooks/external-accounts/queries";
// import { 
//   externalAccountSchema, 
//   type ExternalAccountFormData 
// } from "@/hooks/external-accounts/validation";
import { boliviaBanks, walletNetworks } from "@/lib/withdrawal-config";
import type { ExternalAccountRail } from "@/types/external-accounts-types";

interface CreateExternalAccountWizardProps {
  onCreated?: () => Promise<void> | void;
  onCancel?: () => void;
  title?: string;
  description?: string;
  defaultRail?: ExternalAccountRail;
}

export default function CreateExternalAccountWizard({ 
  onCreated, 
  onCancel,
  title = "Crear cuenta externa",
  description = "Agregá una cuenta bancaria, crypto wallet o cuenta local",
  defaultRail
}: CreateExternalAccountWizardProps) {
  // const { toast } = useToast();
  const createMutation = useCreateExternalAccountMutation();
  
  const [selectedRail, setSelectedRail] = useState<ExternalAccountRail | undefined>(defaultRail);
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<any>({
    defaultValues: {
      rail: defaultRail,
      currency_code: "USD",
      is_default: false,
    },
  });

  const watchedRail = watch("rail") || selectedRail;
  // const watchedMethod = watch("method");
  // const watchedCountry = watch("country");

  const handleRailChange = (value: ExternalAccountRail) => {
    setSelectedRail(value);
    setValue("rail", value);
    
    // Setear currency_code por defecto según el rail
    if (value === "ach" || value === "swift") {
      setValue("currency_code", "USD");
    } else if (value === "crypto") {
      setValue("currency_code", "USDT");
    } else if (value === "local") {
      setValue("currency_code", "ARS");
    }
  };

  const onSubmit = async (data: any) => {
    try {
      // Construir el payload según el rail seleccionado
      let payload: any = {
        nickname: data.nickname,
        currency_code: data.currency_code,
        rail: data.rail,
        beneficiary_url: data.beneficiary_url,
        is_default: data.is_default || false,
      };

      // Agregar datos específicos del rail
      if (data.rail === "ach") {
        payload.ach = {
          account_number: data.account_number,
          routing_number: data.routing_number,
          receiver_bank: data.receiver_bank,
          beneficiary_bank_address: data.beneficiary_bank_address || "",
          beneficiary_name: data.beneficiary_name,
          account_type: data.account_type,
        };
      } else if (data.rail === "swift") {
        payload.swift = {
          swift_bic: data.swift_bic,
          account_number: data.account_number,
          receiver_bank: data.receiver_bank,
          beneficiary_bank_address: data.beneficiary_bank_address || "",
          beneficiary_name: data.beneficiary_name,
          account_type: data.account_type,
        };
      } else if (data.rail === "crypto") {
        payload.crypto = {
          wallet_address: data.wallet_address,
          wallet_network: data.wallet_network,
        };
      } else if (data.rail === "local") {
        payload.local = {
          country_code: data.country_code,
          bank_name: data.bank_name,
          identifier_primary: data.identifier_primary,
          identifier_secondary: data.identifier_secondary || "",
          identifier_primary_type: data.identifier_primary_type,
          identifier_secondary_type: data.identifier_secondary_type || "",
          holder_id: data.holder_id,
          account_number: data.account_number || "",
          beneficiary_name: data.beneficiary_name,
        };
      }

      const result = await createMutation.mutateAsync(payload);
      
      if (result.ok) {
        reset();
        await onCreated?.();
      }
    } catch (error) {
      console.error("Error creating external account:", error);
    }
  };

  return (
    <Card className="rounded-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          {onCancel && (
            <Button variant="outline" onClick={onCancel} size="sm">
              Cancelar
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Selector de método */}
          <div className="space-y-2">
            <Label htmlFor="rail" className="text-sm">
              Tipo de cuenta *
            </Label>
            <Select 
              onValueChange={handleRailChange} 
              value={watchedRail}
              disabled={!!defaultRail}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Selecciona el tipo de cuenta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ach">ACH/Wire (USD)</SelectItem>
                <SelectItem value="swift">SWIFT (USD)</SelectItem>
                <SelectItem value="crypto">Criptomonedas</SelectItem>
                <SelectItem value="local">Moneda Local</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Campos comunes */}
          {watchedRail && (
            <>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nickname" className="text-sm">
                    Alias *
                  </Label>
                  <Input
                    {...register("nickname")}
                    placeholder="Mi cuenta principal"
                    className="h-9"
                  />
                  {errors.nickname && (
                    <p className="text-xs text-destructive">{errors.nickname.message as string}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="beneficiary_url" className="text-sm">
                    URL del beneficiario *
                  </Label>
                  <Input
                    {...register("beneficiary_url")}
                    placeholder="https://www.example.com"
                    className="h-9"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency_code" className="text-sm">
                    Moneda *
                  </Label>
                  <Input
                    {...register("currency_code")}
                    placeholder="USD"
                    className="h-9"
                    maxLength={3}
                  />
                </div>
              </div>

              {/* Campos para ACH */}
              {watchedRail === "ach" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="beneficiary_name" className="text-sm">
                        Titular de la cuenta *
                      </Label>
                      <Input
                        {...register("beneficiary_name")}
                        placeholder="Nombre completo"
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="receiver_bank" className="text-sm">
                        Banco *
                      </Label>
                      <Input
                        {...register("receiver_bank")}
                        placeholder="Nombre del banco"
                        className="h-9"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="account_type" className="text-sm">
                        Tipo de cuenta *
                      </Label>
                      <Select onValueChange={(value) => setValue("account_type", value)}>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Selecciona" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="checking">Checking</SelectItem>
                          <SelectItem value="savings">Savings</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="account_number" className="text-sm">
                        Número de cuenta *
                      </Label>
                      <Input
                        {...register("account_number")}
                        placeholder="Número de cuenta"
                        className="font-mono h-9"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="routing_number" className="text-sm">
                      Routing Number *
                    </Label>
                    <Input
                      {...register("routing_number")}
                      placeholder="123456789"
                      className="font-mono h-9"
                      maxLength={9}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="beneficiary_bank_address" className="text-sm">
                      Dirección del banco (opcional)
                    </Label>
                    <Input
                      {...register("beneficiary_bank_address")}
                      placeholder="123 Main St, City, State"
                      className="h-9"
                    />
                  </div>
                </>
              )}

              {/* Campos para SWIFT */}
              {watchedRail === "swift" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="beneficiary_name" className="text-sm">
                        Titular de la cuenta *
                      </Label>
                      <Input
                        {...register("beneficiary_name")}
                        placeholder="Nombre completo"
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="receiver_bank" className="text-sm">
                        Banco *
                      </Label>
                      <Input
                        {...register("receiver_bank")}
                        placeholder="Nombre del banco"
                        className="h-9"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="swift_bic" className="text-sm">
                        SWIFT/BIC *
                      </Label>
                      <Input
                        {...register("swift_bic")}
                        placeholder="ABCDUS33XXX"
                        className="font-mono h-9"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="account_number" className="text-sm">
                        Número de cuenta / IBAN *
                      </Label>
                      <Input
                        {...register("account_number")}
                        placeholder="Número de cuenta o IBAN"
                        className="font-mono h-9"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="account_type" className="text-sm">
                      Tipo de cuenta *
                    </Label>
                    <Select onValueChange={(value) => setValue("account_type", value)}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Selecciona" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="checking">Checking</SelectItem>
                        <SelectItem value="savings">Savings</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="beneficiary_bank_address" className="text-sm">
                      Dirección del banco (opcional)
                    </Label>
                    <Input
                      {...register("beneficiary_bank_address")}
                      placeholder="123 Main St, City, State"
                      className="h-9"
                    />
                  </div>
                </>
              )}

              {/* Campos para Crypto */}
              {watchedRail === "crypto" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="wallet_address" className="text-sm">
                      Dirección de la wallet *
                    </Label>
                    <Input
                      {...register("wallet_address")}
                      placeholder="0x..."
                      className="font-mono h-9"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="wallet_network" className="text-sm">
                      Red *
                    </Label>
                    <Select onValueChange={(value) => setValue("wallet_network", value)}>
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

              {/* Campos para Local */}
              {watchedRail === "local" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="country_code" className="text-sm">
                        País *
                      </Label>
                      <Select onValueChange={(value) => {
                        setValue("country_code", value);
                        setValue("currency_code", value === "BO" ? "BOB" : "ARS");
                      }}>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Selecciona" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="BO">Bolivia</SelectItem>
                          <SelectItem value="AR">Argentina</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="beneficiary_name" className="text-sm">
                        Titular *
                      </Label>
                      <Input
                        {...register("beneficiary_name")}
                        placeholder="Nombre completo"
                        className="h-9"
                      />
                    </div>
                  </div>

                  {watch("country_code") === "BO" ? (
                    <div className="space-y-2">
                      <Label htmlFor="bank_name" className="text-sm">
                        Banco *
                      </Label>
                      <Select onValueChange={(value) => setValue("bank_name", value)}>
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
                      <Label htmlFor="bank_name" className="text-sm">
                        Banco *
                      </Label>
                      <Input
                        {...register("bank_name")}
                        placeholder="Nombre del banco"
                        className="h-9"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="identifier_primary_type" className="text-sm">
                        Tipo de identificador primario *
                      </Label>
                      <Select onValueChange={(value) => setValue("identifier_primary_type", value)}>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Ej: CBU, CLABE" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CBU">CBU</SelectItem>
                          <SelectItem value="CLABE">CLABE</SelectItem>
                          <SelectItem value="CVU">CVU</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="identifier_primary" className="text-sm">
                        Identificador primario *
                      </Label>
                      <Input
                        {...register("identifier_primary")}
                        placeholder="Número"
                        className="font-mono h-9"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="identifier_secondary_type" className="text-sm">
                        Tipo de identificador secundario (opcional)
                      </Label>
                      <Select onValueChange={(value) => setValue("identifier_secondary_type", value)}>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Ej: Alias" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Alias">Alias</SelectItem>
                          <SelectItem value="Email">Email</SelectItem>
                          <SelectItem value="Phone">Teléfono</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="identifier_secondary" className="text-sm">
                        Identificador secundario (opcional)
                      </Label>
                      <Input
                        {...register("identifier_secondary")}
                        placeholder="Alias o identificador"
                        className="h-9"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="holder_id" className="text-sm">
                        DNI/CUIT/RUT *
                      </Label>
                      <Input
                        {...register("holder_id")}
                        placeholder="Identificación del titular"
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="account_number" className="text-sm">
                        Número de cuenta (opcional)
                      </Label>
                      <Input
                        {...register("account_number")}
                        placeholder="Número de cuenta"
                        className="font-mono h-9"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Botones */}
              <div className="flex items-center justify-end gap-2 pt-4">
                {onCancel && (
                  <Button 
                    type="button"
                    variant="outline" 
                    onClick={onCancel} 
                    disabled={createMutation.isPending}
                  >
                    Cancelar
                  </Button>
                )}
                <Button 
                  type="submit"
                  variant="cta" 
                  disabled={createMutation.isPending || !watchedRail}
                >
                  {createMutation.isPending ? "Guardando..." : "Guardar cuenta"}
                </Button>
              </div>
            </>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
