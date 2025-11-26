"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface DestinationAccountsListProps {
  accounts: any[];
  onSelect: (account: any) => void;
}

export default function DestinationAccountsList({ accounts, onSelect }: DestinationAccountsListProps) {
  const getRailLabel = (rail: string) => {
    const labels: Record<string, string> = {
      ach: "ACH/Wire",
      swift: "SWIFT",
      crypto: "Crypto",
      local: "Moneda Local",
    };
    return labels[rail] || rail.toUpperCase();
  };

  const getRailColor = (rail: string) => {
    const colors: Record<string, string> = {
      ach: "bg-blue-200",
      swift: "bg-green-200",
      crypto: "bg-purple-200",
      local: "bg-orange-200",
    };
    return colors[rail] || "bg-gray-500";
  };

  const renderTitle = (acc: any) => {
    const rail = acc.rail;
    if (rail === "crypto") {
      return acc.nickname || acc.crypto?.wallet_alias || "Crypto Wallet";
    }
    if (rail === "ach" || rail === "swift") {
      const railData = acc[rail];
      return railData?.beneficiary_name || acc.nickname || "Cuenta";
    }
    // local
    const localData = acc.local;
    return localData?.beneficiary_name || acc.nickname || "Cuenta";
  };

  const renderSubtitle = (acc: any) => {
    const rail = acc.rail;
    if (rail === "crypto") {
      return acc.crypto?.wallet_network || "";
    }
    if (rail === "ach" || rail === "swift") {
      const railData = acc[rail];
      return railData?.account_type || railData?.receiver_bank || "";
    }
    // local
    const localData = acc.local;
    return localData?.bank_name || "";
  };

  const renderCurrency = (acc: any) => {
    return acc.currency_code || "";
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
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge className={getRailColor(acc.rail)}>{getRailLabel(acc.rail)}</Badge>
                  {renderCurrency(acc) && (
                    <Badge variant="outline">{renderCurrency(acc)}</Badge>
                  )}
                </div>
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


