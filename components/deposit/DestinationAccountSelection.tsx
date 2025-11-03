"use client";

import { useLoadDepositAccountsQuery } from "@/hooks/deposits/queries";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type DepositMethod = "ach" | "swift" | "crypto" | "local";

interface Props {
  method: DepositMethod | undefined;
  userEmail?: string;
  onSelected: (account: any) => void;
}

export default function DestinationAccountSelection({ method, userEmail, onSelected }: Props) {
  const { data: destinationAccounts = [], isLoading, refetch } = useLoadDepositAccountsQuery(
    method,
    !!method,
    userEmail
  );

  return (
    <Card className="rounded-lg">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Confirmá la cuenta destino</CardTitle>
        <CardDescription>Traeremos y mostraremos la cuenta asignada según el tipo</CardDescription>
      </CardHeader>
      <CardContent>
        {!method ? (
          <div className="text-sm text-muted-foreground">Elegí el tipo de cuenta destino primero.</div>
        ) : !destinationAccounts.length ? (
          <div className="text-center py-6">
            <Button variant="cta" onClick={() => refetch()} disabled={isLoading}>
              {isLoading ? "Cargando..." : "Cargar cuentas destino"}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {destinationAccounts.map((acc: any, idx: number) => (
              <Card
                key={acc.id || idx}
                className="border-2 hover:border-violet-500 cursor-pointer transition-all duration-200 hover:shadow-md"
                onClick={() => onSelected(acc)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{acc.nickname || acc.alias || "Cuenta destino"}</h3>
                      <p className="text-sm text-muted-foreground">
                        {acc.beneficiary_bank || acc.local_bank || acc.wallet_network || acc.method}
                      </p>
                    </div>
                    <Button variant="default" size="sm">Seleccionar</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}


