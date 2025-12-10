"use client";

import { UseFormRegister, UseFormSetValue, UseFormWatch } from "react-hook-form";
import {
  LOCAL_WITHDRAW_COUNTRIES,
  COUNTRY_CURRENCY_MAP,
} from "@/utils/countries";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { boliviaBanks } from "@/lib/withdrawal-config";

interface LocalFormProps {
  register: UseFormRegister<any>;
  setValue: UseFormSetValue<any>;
  watch: UseFormWatch<any>;
  errors: Record<string, any>;
}

export default function LocalForm({
  register,
  setValue,
  watch,
  errors,
}: LocalFormProps) {
  const selectedCountry = watch("country_code");

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="country_code" className="text-sm">
            País *
          </Label>
          <Select
            onValueChange={(value) => {
              setValue("country_code", value);
              setValue("currency_code", COUNTRY_CURRENCY_MAP[value] ?? "USD");
              // Limpiar banco si cambia el país
              setValue("bank_name", "");
            }}
            value={selectedCountry}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Selecciona" />
            </SelectTrigger>
            <SelectContent>
              {LOCAL_WITHDRAW_COUNTRIES.map((country) => (
                <SelectItem key={country.code} value={country.code}>
                  {country.label}
                </SelectItem>
              ))}
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
          {errors.beneficiary_name && (
            <p className="text-xs text-destructive">
              {errors.beneficiary_name.message as string}
            </p>
          )}
        </div>
      </div>

      {selectedCountry === "BO" ? (
        <div className="space-y-2">
          <Label htmlFor="bank_name" className="text-sm">
            Banco *
          </Label>
          <Select onValueChange={(value) => setValue("bank_name", value)}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Selecciona el banco" />
            </SelectTrigger>
            <SelectContent>
              {boliviaBanks?.map((bank, i) => (
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
          {errors.bank_name && (
            <p className="text-xs text-destructive">
              {errors.bank_name.message as string}
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="identifier_primary_type" className="text-sm">
            Tipo de identificador primario *
          </Label>
          <Select
            onValueChange={(value) => setValue("identifier_primary_type", value)}
          >
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
          {errors.identifier_primary && (
            <p className="text-xs text-destructive">
              {errors.identifier_primary.message as string}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="identifier_secondary_type" className="text-sm">
            Tipo de identificador secundario (opcional)
          </Label>
          <Select
            onValueChange={(value) =>
              setValue("identifier_secondary_type", value)
            }
          >
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
          {errors.holder_id && (
            <p className="text-xs text-destructive">
              {errors.holder_id.message as string}
            </p>
          )}
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
  );
}

