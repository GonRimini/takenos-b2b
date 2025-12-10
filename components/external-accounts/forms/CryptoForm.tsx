"use client";

import { UseFormRegister, UseFormSetValue } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { walletNetworks } from "@/lib/withdrawal-config";

interface CryptoFormProps {
  register: UseFormRegister<any>;
  setValue: UseFormSetValue<any>;
  errors: Record<string, any>;
}

export default function CryptoForm({
  register,
  setValue,
  errors,
}: CryptoFormProps) {
  return (
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
        {errors.wallet_address && (
          <p className="text-xs text-destructive">
            {errors.wallet_address.message as string}
          </p>
        )}
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
            {walletNetworks?.map((network, i) => (
              <SelectItem key={i} value={network.value}>
                {network.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  );
}

