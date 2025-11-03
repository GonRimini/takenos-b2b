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

export default function AccountFormLocal({ userEmail, onSaved, onCancel }: Props) {
  const { mutateAsync, isPending } = useSaveAccountMutation();

  const [nickname, setNickname] = useState("");
  const [localAccountName, setLocalAccountName] = useState("");
  const [localBank, setLocalBank] = useState("");
  const [localAccountNumber, setLocalAccountNumber] = useState("");

  const onSubmit = async () => {
    if (!userEmail) return;
    await mutateAsync({
      user_email: userEmail,
      category: "deposit",
      method: "local",
      nickname,
      is_default: false,
      local_account_name: localAccountName,
      local_bank: localBank,
      local_account_number: localAccountNumber,
      last4: localAccountNumber ? localAccountNumber.slice(-4) : undefined,
      details: {
        local_account_name: localAccountName,
        local_bank: localBank,
        local_account_number: localAccountNumber,
      },
    } as any);
    onSaved();
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Alias</Label>
          <Input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="Mi cuenta local" className="mt-2" />
        </div>
        <div>
          <Label>Nombre de cuenta</Label>
          <Input value={localAccountName} onChange={(e) => setLocalAccountName(e.target.value)} className="mt-2" />
        </div>
        <div>
          <Label>Banco</Label>
          <Input value={localBank} onChange={(e) => setLocalBank(e.target.value)} className="mt-2" />
        </div>
        <div>
          <Label>Número de cuenta</Label>
          <Input value={localAccountNumber} onChange={(e) => setLocalAccountNumber(e.target.value)} className="mt-2" />
        </div>
      </div>
      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" onClick={onCancel} disabled={isPending}>Cancelar</Button>
        <Button variant="cta" onClick={onSubmit} disabled={isPending || !nickname || !localAccountName || !localBank || !localAccountNumber}>Guardar</Button>
      </div>
    </div>
  );
}


