"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLoadDepositAccountsQuery } from "@/hooks/deposits/queries";
import DestinationAccountsList from "@/components/deposit/DestinationAccountsList";

type DepositMethod = "ach" | "swift" | "crypto" | "local";

interface Props {
  userEmail?: string;
  onBack: () => void;
  onSelected: (method: DepositMethod, account: any) => void;
}

export default function MethodAndDestinationCard({ userEmail, onBack, onSelected }: Props) {
  const [method, setMethod] = useState<DepositMethod | undefined>(undefined);

  const { data: accounts = [], isLoading } = useLoadDepositAccountsQuery(
    method,
    !!method,
    userEmail
  );

  // Reset selection when method changes
  useEffect(() => {
    // Nothing to keep locally for account; parent handles when selected
  }, [method]);

  const noAccountsForMethod = !!method && !isLoading && accounts.length === 0;

  return (
    <Card className="rounded-lg">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Cuenta destino</CardTitle>
        <CardDescription>Paso 2: Elegí el método y seleccioná la cuenta de Takenos</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Método</label>
          <Select value={method} onValueChange={(v) => setMethod(v as DepositMethod)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Seleccioná un método" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ach">ACH/Wire</SelectItem>
              <SelectItem value="swift">SWIFT</SelectItem>
              <SelectItem value="crypto">Crypto</SelectItem>
              <SelectItem value="local">Moneda Local</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {!method ? (
          <div className="text-sm text-muted-foreground">Elegí un método para ver la cuenta de destino.</div>
        ) : noAccountsForMethod ? (
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">No tienes cuentas asociadas a este método.</div>
            <Button variant="outline" onClick={onBack}>Volver</Button>
          </div>
        ) : isLoading ? (
          <div className="text-sm text-muted-foreground">Cargando cuentas...</div>
        ) : (
          <DestinationAccountsList
            method={method}
            accounts={accounts}
            onSelect={(acc) => onSelected(method, acc)}
          />
        )}
      </CardContent>
    </Card>
  );
}


