"use client";

import { AccountField } from "@/components/account-field";
import { DepositoACH, DepositoSWIFT, DepositoCrypto, DepositoLocal } from "@/lib/depositos";
import { DepositMethod } from "@/hooks/deposits/useDepositInstructions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface InstructionsContentProps {
  method: DepositMethod;
  achData: DepositoACH | null;
  swiftData: DepositoSWIFT | null;
  cryptoData: DepositoCrypto[];
  localData: DepositoLocal | null;
  selectedCryptoWallet: number;
  onSelectCryptoWallet: (index: number) => void;
}

export default function InstructionsContent({
  method,
  achData,
  swiftData,
  cryptoData,
  localData,
  selectedCryptoWallet,
  onSelectCryptoWallet,
}: InstructionsContentProps) {
  // ACH Content
  if (method === "ach" && achData) {
    return (
      <>
        <AccountField label="Routing Number" value={achData.routing_number || ""} />
        <AccountField label="Número de cuenta" value={achData.account_number || ""} maskable />
        <AccountField label="Nombre del beneficiario" value={achData.beneficiary_name || ""} />
        <AccountField label="Banco receptor" value={achData.receiver_bank || ""} />
        <AccountField label="Tipo de cuenta" value={achData.account_type || ""} />
      </>
    );
  }

  // SWIFT Content
  if (method === "swift" && swiftData) {
    return (
      <>
        <AccountField label="SWIFT/BIC Code" value={swiftData.swift_bic_code || ""} />
        <AccountField label="Número de cuenta" value={swiftData.account_number || ""} maskable />
        <AccountField label="Nombre del beneficiario" value={swiftData.beneficiary_name || ""} />
        <AccountField label="Banco receptor" value={swiftData.receiver_bank || ""} />
        <AccountField label="Tipo de cuenta" value={swiftData.account_type || ""} />
      </>
    );
  }

  // Crypto Content
  if (method === "crypto" && cryptoData.length > 0) {
    return (
      <>
        {cryptoData.length > 1 && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Selecciona tu wallet</label>
            <Select
              value={selectedCryptoWallet.toString()}
              onValueChange={(value) => onSelectCryptoWallet(parseInt(value))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona una wallet" />
              </SelectTrigger>
              <SelectContent>
                {cryptoData.map((wallet, index) => (
                  <SelectItem key={index} value={index.toString()}>
                    {wallet.title || `Wallet ${index + 1}`} - {wallet.network || ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {cryptoData[selectedCryptoWallet] && (
          <>
            <AccountField
              label="Dirección de depósito"
              value={cryptoData[selectedCryptoWallet].deposit_address || ""}
            />
            <AccountField label="Red/Network" value={cryptoData[selectedCryptoWallet].network || ""} />
          </>
        )}
      </>
    );
  }

  // Local Content
  if (method === "local" && localData) {
    return (
      <>
        <AccountField label="Beneficiario" value={localData.beneficiario || ""} />
        <AccountField label="Banco" value={localData.banco || ""} />
        <AccountField label="Número de cuenta" value={localData.nro_de_cuenta || ""} maskable />
        <AccountField label="Identificación" value={localData.identificacion || ""} />
        {localData.cbu && <AccountField label="CBU" value={localData.cbu || ""} />}
        {localData.alias && <AccountField label="Alias" value={localData.alias || ""} />}
      </>
    );
  }

  return null;
}

