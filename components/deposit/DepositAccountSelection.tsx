"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp } from "lucide-react";

interface AccountSelectionStepProps {
  accounts: any[];
  loadingAccounts: boolean;
  onLoadAccounts: () => void;
  onSelectAccount: (account: any) => void;
  onCreateNewAccount: () => void;
}

export const AccountSelectionStep = ({
  accounts,
  loadingAccounts,
  onLoadAccounts,
  onSelectAccount,
  onCreateNewAccount,
}: AccountSelectionStepProps) => {
  const [isAccountsExpanded, setIsAccountsExpanded] = useState(false);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Solicitud de Depósito
        </h1>
        <p className="text-muted-foreground">
          Paso 1: Selecciona la cuenta para el depósito
        </p>
      </div>

      {/* Paso 1: Selección de cuenta */}
      <div className="space-y-6">
        {/* Opción: Usar cuenta guardada */}
        <Card className="rounded-lg">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Usar cuenta guardada</CardTitle>
                <CardDescription>
                  Elige una cuenta bancaria o wallet que ya tengas guardada
                </CardDescription>
              </div>
              {accounts.length > 0 && (
                <Collapsible
                  open={isAccountsExpanded}
                  onOpenChange={setIsAccountsExpanded}
                >
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-2 transition-all duration-200 hover:bg-muted/80 rounded-full"
                    >
                      {isAccountsExpanded ? (
                        <ChevronUp className="h-4 w-4 transition-transform duration-200" />
                      ) : (
                        <ChevronDown className="h-4 w-4 transition-transform duration-200" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                </Collapsible>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!accounts.length ? (
              <div className="text-center py-8">
                <Button
                  variant="cta"
                  onClick={onLoadAccounts}
                  disabled={loadingAccounts}
                  className="mb-4"
                >
                  {loadingAccounts ? "Cargando..." : "Cargar cuentas guardadas"}
                </Button>
                <p className="text-sm text-muted-foreground">
                  Carga tus cuentas guardadas para seleccionar una
                </p>
              </div>
            ) : (
              <Collapsible
                open={isAccountsExpanded}
                onOpenChange={setIsAccountsExpanded}
              >
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {accounts.length} cuenta{accounts.length !== 1 ? "s" : ""}{" "}
                    guardada{accounts.length !== 1 ? "s" : ""}
                  </p>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="cta"
                      size="sm"
                      className="transition-all duration-200"
                    >
                      {isAccountsExpanded ? (
                        <>
                          <ChevronUp className="h-4 w-4 mr-2 transition-transform duration-200" />
                          Ocultar cuentas
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4 mr-2 transition-transform duration-200" />
                          Ver cuentas
                        </>
                      )}
                    </Button>
                  </CollapsibleTrigger>
                </div>
                <CollapsibleContent className="space-y-4 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 duration-300">
                  {accounts.map((account: any, index: number) => (
                    <Card
                      key={account.id || index}
                      className="border-2 hover:border-violet-500 cursor-pointer transition-all duration-200 hover:shadow-md"
                      onClick={() => onSelectAccount(account)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium">
                              {account.nickname || "Cuenta sin nombre"}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {account.category === "usd_bank" &&
                                `${account.method?.toUpperCase()} - ${
                                  account.beneficiary_bank
                                }`}
                              {account.category === "crypto" &&
                                `${
                                  account.wallet_network
                                } - ${account.wallet_address?.slice(0, 10)}...`}
                              {account.category === "local_currency" &&
                                `${account.local_bank} - ${account.country}`}
                            </p>
                          </div>
                          <Button
                            variant="default"
                            size="sm"
                            className="transition-colors duration-200"
                          >
                            Seleccionar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            )}
          </CardContent>
        </Card>

        {/* Divisor */}
        <div className="flex items-center justify-center">
          <div className="flex-1 h-px bg-border"></div>
          <div className="flex-1 h-px bg-border"></div>
        </div>

        {/* Opción: Crear nueva cuenta */}
        <Card className="rounded-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Agregar nueva cuenta</CardTitle>
            <CardDescription>
              Crea una nueva cuenta bancaria o wallet para este depósito
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6">
              <Button
                variant="cta"
                onClick={onCreateNewAccount}
                className="mb-2"
              >
                Crear nueva cuenta
              </Button>
              <p className="text-sm text-muted-foreground">
                Completa los datos de una nueva cuenta origen
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
