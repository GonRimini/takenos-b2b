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

export default function AccountFormCrypto({ userEmail, onSaved, onCancel }: Props) {
  const { mutateAsync, isPending } = useSaveAccountMutation();

  const [nickname, setNickname] = useState("");
  const [walletAlias, setWalletAlias] = useState("");
  const [walletNetwork, setWalletNetwork] = useState("");

  const onSubmit = async () => {
    if (!userEmail) return;
    await mutateAsync({
      user_email: userEmail,
      category: "deposit",
      method: "crypto",
      nickname,
      is_default: false,
      wallet_alias: walletAlias,
      wallet_network: walletNetwork,
      details: {
        wallet_alias: walletAlias,
        wallet_network: walletNetwork,
      },
    } as any);
    onSaved();
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Alias</Label>
          <Input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="Mi wallet" className="mt-2" />
        </div>
        <div>
          <Label>Wallet alias / dirección</Label>
          <Input value={walletAlias} onChange={(e) => setWalletAlias(e.target.value)} className="mt-2" />
        </div>
        <div>
          <Label>Red</Label>
          <Input value={walletNetwork} onChange={(e) => setWalletNetwork(e.target.value)} placeholder="USDT-TRC20 / ETH / etc." className="mt-2" />
        </div>
      </div>
      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" onClick={onCancel} disabled={isPending}>Cancelar</Button>
        <Button variant="cta" onClick={onSubmit} disabled={isPending || !nickname || !walletAlias || !walletNetwork}>Guardar</Button>
      </div>
    </div>
  );
}


