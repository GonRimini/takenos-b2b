"use client";

import { useEffect } from "react";
import { UseFormRegister, UseFormSetValue, UseFormWatch } from "react-hook-form";
import { COUNTRY_CURRENCY_MAP, ACH_COUNTRIES } from "@/utils/countries";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AchFormProps {
  register: UseFormRegister<any>;
  setValue: UseFormSetValue<any>;
  errors: Record<string, any>;
  watch: UseFormWatch<any>;
}

export default function AchForm({ register, setValue, errors, watch }: AchFormProps) {
  const currentCountryCode = watch("country_code");

  // Setear valor por defecto de country_code usando useEffect
  useEffect(() => {
    if (!currentCountryCode) {
      setValue("country_code", "US");
    }
  }, [currentCountryCode, setValue]);

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="beneficiary_name" className="text-sm">
            Titular de la cuenta *
          </Label>
          <Input
            {...register("beneficiary_name", { required: true })}
            placeholder="Nombre completo"
            className="h-9"
          />
          {errors.beneficiary_name && (
            <p className="text-xs text-red-500">
              {errors.beneficiary_name.message as string}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="receiver_bank" className="text-sm">
            Banco *
          </Label>
          <Input
            {...register("receiver_bank", { required: true })}
            placeholder="Nombre del banco"
            className="h-9"
          />
          {errors.receiver_bank && (
            <p className="text-xs text-red-500">
              {errors.receiver_bank.message as string}
            </p>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="country_code" className="text-sm">
            País *
          </Label>
          <Select
            onValueChange={(value) => {
              setValue("country_code", value);
              setValue("currency_code", COUNTRY_CURRENCY_MAP[value] ?? "USD");
            }}
            value={watch("country_code") || "US"}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Selecciona el país" />
            </SelectTrigger>
            <SelectContent>
              {ACH_COUNTRIES.map((country) => (
                <SelectItem key={country.code} value={country.code}>
                  {country.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.country_code && (
            <p className="text-xs text-red-500">
              {errors.country_code.message as string}
            </p>
          )}
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
          {errors.account_type && (
            <p className="text-xs text-red-500">
              {errors.account_type.message as string}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="account_number" className="text-sm">
            Número de cuenta *
          </Label>
          <Input
            {...register("account_number", { required: true })}
            placeholder="123456789"
            className="font-mono h-9"
          />
          {errors.account_number && (
            <p className="text-xs text-red-500">
              {errors.account_number.message as string}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="routing_number" className="text-sm">
          Routing Number *
        </Label>
        <Input
          {...register("routing_number", { required: true })}
          placeholder="123456789"
          className="font-mono h-9"
          maxLength={9}
        />
        {errors.routing_number && (
          <p className="text-xs text-red-500">
            {errors.routing_number.message as string}
          </p>
        )}
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
  );
}

