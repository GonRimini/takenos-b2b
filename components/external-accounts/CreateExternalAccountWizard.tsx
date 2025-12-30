"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateExternalAccountMutation } from "@/hooks/external-accounts/queries";
import type { ExternalAccountRail } from "@/types/external-accounts-types";

import { AchForm, SwiftForm, CryptoForm, LocalForm } from "./forms";

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
  defaultRail,
}: CreateExternalAccountWizardProps) {
  const createMutation = useCreateExternalAccountMutation();

  const [selectedRail, setSelectedRail] = useState<
    ExternalAccountRail | undefined
  >(defaultRail);

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
          country_code: data.country_code || "US",
        };
      } else if (data.rail === "swift") {
        payload.swift = {
          swift_bic: data.swift_bic,
          account_number: data.account_number,
          receiver_bank: data.receiver_bank,
          beneficiary_bank_address: data.beneficiary_bank_address || "",
          beneficiary_name: data.beneficiary_name,
          account_type: data.account_type,
          country_code: data.country_code,
          intermediary_bank: data.intermediary_bank || "",
          intermediary_routing_number: data.intermediary_routing_number || "",
          intermediary_swift_bic: data.intermediary_swift_bic || "",
          intermediary_account_number: data.intermediary_account_number || "",
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

  const renderRailForm = () => {
    const formProps = { register, setValue, watch, errors };

    switch (watchedRail) {
      case "ach":
        return <AchForm {...formProps} />;
      case "swift":
        return <SwiftForm {...formProps} />;
      case "crypto":
        return <CryptoForm {...formProps} />;
      case "local":
        return <LocalForm {...formProps} />;
      default:
        return null;
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
                <SelectItem value="ach">ACH/Wire</SelectItem>
                <SelectItem value="swift">SWIFT</SelectItem>
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
                    <p className="text-xs text-destructive">
                      {errors.nickname.message as string}
                    </p>
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
                    disabled
                  />
                </div>
              </div>

              {/* Formulario específico del rail */}
              {renderRailForm()}

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
