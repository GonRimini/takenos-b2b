"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useSaveAccountMutation } from "@/hooks/deposits/queries";

interface Props {
  userEmail?: string;
  onSaved: () => void;
  onCancel: () => void;
}

export default function AccountFormACH({ userEmail, onSaved, onCancel }: Props) {
  const { mutateAsync, isPending } = useSaveAccountMutation();

  const [nickname, setNickname] = useState("");
  const [beneficiaryName, setBeneficiaryName] = useState("");
  const [beneficiaryBank, setBeneficiaryBank] = useState("");
  const [accountType, setAccountType] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [routingNumber, setRoutingNumber] = useState("");

  const onSubmit = async () => {
    if (!userEmail) return;
    await mutateAsync({
      user_email: userEmail,
      category: "deposit",
      method: "ach",
      nickname,
      is_default: false,
      beneficiary_name: beneficiaryName,
      beneficiary_bank: beneficiaryBank,
      account_type: accountType,
      account_number: accountNumber,
      routing_number: routingNumber,
      last4: accountNumber ? accountNumber.slice(-4) : undefined,
      details: {
        beneficiary_name: beneficiaryName,
        beneficiary_bank: beneficiaryBank,
        account_type: accountType,
        account_number: accountNumber,
        routing_number: routingNumber,
      },
    } as any);
    onSaved();
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <Label>Alias</Label>
          <Input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="Mi cuenta ACH" className="mt-2"/>
        </div>
        <div>
          <Label>Beneficiario</Label>
          <Input value={beneficiaryName} onChange={(e) => setBeneficiaryName(e.target.value)} className="mt-2" />
        </div>
        <div>
          <Label>Banco</Label>
          <Input value={beneficiaryBank} onChange={(e) => setBeneficiaryBank(e.target.value)} className="mt-2" />
        </div>
        <div>
          <Label>Tipo de cuenta</Label>
          <Input value={accountType} onChange={(e) => setAccountType(e.target.value)} placeholder="checking/savings" className="mt-2" />
        </div>
        <div>
          <Label>Número de cuenta</Label>
          <Input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} className="mt-2" />
        </div>
        <div>
          <Label>Routing number</Label>
          <Input value={routingNumber} onChange={(e) => setRoutingNumber(e.target.value)} className="mt-2" />
        </div>
      </div>
      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" onClick={onCancel} disabled={isPending}>Cancelar</Button>
        <Button variant="cta" onClick={onSubmit} disabled={isPending || !nickname || !accountNumber || !routingNumber}>Guardar</Button>
      </div>
    </div>
  );
}


