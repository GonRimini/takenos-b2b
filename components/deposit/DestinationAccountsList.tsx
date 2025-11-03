"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type DepositMethod = "ach" | "swift" | "crypto" | "local";

interface DestinationAccountsListProps {
  method: DepositMethod;
  accounts: any[];
  onSelect: (account: any) => void;
}

export default function DestinationAccountsList({ method, accounts, onSelect }: DestinationAccountsListProps) {
  const renderTitle = (acc: any) => {
    if (method === "crypto") {
      return acc.nickname || acc.wallet_alias || "Crypto";
    }
    if (method === "ach" || method === "swift") {
      return acc.beneficiary_name || acc.nickname || "Cuenta";
    }
    // local
    return acc.local_account_name || acc.beneficiario || acc.nickname || "Cuenta";
  };

  const renderSubtitle = (acc: any) => {
    if (method === "crypto") {
      return acc.wallet_network || acc.network || "";
    }
    if (method === "ach" || method === "swift") {
      return acc.account_type || "";
    }
    // local
    return acc.local_bank || acc.banco || "";
  };

  return (
    <div className="space-y-3">
      {accounts.map((acc: any, idx: number) => (
        <Card
          key={acc.id || idx}
          className="border-2 hover:border-violet-500 cursor-pointer transition-all duration-200 hover:shadow-md"
          onClick={() => onSelect(acc)}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">{renderTitle(acc)}</h3>
                <p className="text-sm text-muted-foreground">{renderSubtitle(acc)}</p>
              </div>
              <Button variant="default" size="sm">Seleccionar</Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}


