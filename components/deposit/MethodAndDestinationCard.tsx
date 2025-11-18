"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAllDepositAccountsQuery } from "@/hooks/deposits/queries";
import DestinationAccountsList from "@/components/deposit/DestinationAccountsList";

type DepositMethod = "ach" | "swift" | "crypto" | "local";

interface Props {
  userEmail?: string;
  onBack: () => void;
  onSelected: (method: DepositMethod, account: any) => void;
}

export default function MethodAndDestinationCard({ userEmail, onBack, onSelected }: Props) {
  const { data: accounts = [], isLoading } = useAllDepositAccountsQuery();

  return (
    <Card className="rounded-lg">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Cuenta destino</CardTitle>
        <CardDescription>Paso 2: Seleccioná la cuenta de Takenos donde realizaste el depósito</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Cargando cuentas...</div>
        ) : accounts.length === 0 ? (
          <div className="text-sm text-muted-foreground">No hay cuentas disponibles.</div>
        ) : (
          <DestinationAccountsList
            accounts={accounts}
            onSelect={(acc) => onSelected(acc.rail as DepositMethod, acc)}
          />
        )}
      </CardContent>
    </Card>
  );
}


