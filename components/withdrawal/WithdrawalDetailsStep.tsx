"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, DollarSign, FileText } from "lucide-react";
import { useExternalAccountQuery } from "@/hooks/external-accounts/queries";
import { UseFormRegister, UseFormSetValue, FieldErrors } from "react-hook-form";
import { type WithdrawalFormData } from "@/lib/withdrawal-schema";

interface WithdrawalDetailsStepProps {
  selectedAccount: any;
  isCreatingNewAccount: boolean;
  onBack: () => void;
  register: UseFormRegister<WithdrawalFormData>;
  setValue: UseFormSetValue<WithdrawalFormData>;
  errors: FieldErrors<WithdrawalFormData>;
  selectedFile: File | null;
  setSelectedFile: (file: File | null) => void;
  handleAmountChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function WithdrawalDetailsStep({
  selectedAccount,
  isCreatingNewAccount,
  onBack,
  register,
  setValue,
  errors,
  selectedFile,
  setSelectedFile,
  handleAmountChange,
}: WithdrawalDetailsStepProps) {
  // React Query hook para detalles de la cuenta seleccionada
  const { data: accountDetails, isLoading: loadingAccountDetails } =
    useExternalAccountQuery(selectedAccount?.id, !!selectedAccount?.id);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="cta" size="sm" onClick={onBack}>
            ← Cambiar cuenta
          </Button>
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Solicitud de retiro
        </h1>
        <p className="text-muted-foreground">
          Paso 2:{" "}
          {isCreatingNewAccount
            ? "Completa los datos de la nueva cuenta"
            : "Confirma los detalles y especifica el monto"}
        </p>
        {selectedAccount && !isCreatingNewAccount && (
          <div className="mt-3 p-3 bg-muted rounded-lg">
            <p className="text-sm">
              <span className="font-medium">Cuenta seleccionada:</span>{" "}
              {selectedAccount.nickname || "Sin nombre"}
            </p>
          </div>
        )}
        {isCreatingNewAccount && (
          <div className="mt-3 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
            <p className="text-sm text-orange-700 dark:text-orange-300">
              <span className="font-medium">Nueva cuenta:</span> Completa todos
              los campos requeridos
            </p>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <Card className="rounded-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Información del retiro</CardTitle>
            <CardDescription>
              Proporciona los detalles según el tipo de retiro
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Loading state */}
            {selectedAccount &&
              !isCreatingNewAccount &&
              loadingAccountDetails && (
                <div className="text-center py-8 text-muted-foreground">
                  Cargando detalles de la cuenta...
                </div>
              )}

            {/* Campos de cuenta seleccionada (disabled y auto-llenados) */}
            {selectedAccount && !isCreatingNewAccount && accountDetails && (
              <>
                {/* Información básica */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Tipo de cuenta</Label>
                    <Input
                      value={
                        accountDetails.rail === "ach"
                          ? "ACH/Wire"
                          : accountDetails.rail === "swift"
                          ? "SWIFT"
                          : accountDetails.rail === "crypto"
                          ? "Criptomonedas"
                          : "Moneda Local"
                      }
                      disabled
                      className="h-9 bg-muted"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Moneda</Label>
                    <Input
                      value={accountDetails.currency_code || ""}
                      disabled
                      className="h-9 bg-muted"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Alias de la cuenta</Label>
                  <Input
                    value={accountDetails.nickname || ""}
                    disabled
                    className="h-9 bg-muted"
                  />
                </div>
                {/* Campo Beneficiary URL - Mostrar solo si existe */}
                {accountDetails.beneficiary_url && (
                  <div className="space-y-2">
                    <Label className="text-sm">URL del beneficiario</Label>
                    <Input
                      value={accountDetails.beneficiary_url}
                      disabled
                      className="h-9 bg-muted font-mono text-xs"
                    />
                  </div>
                )}

                {/* Campos para ACH */}
                {accountDetails.rail === "ach" && accountDetails.ach && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm">
                          Nombre del beneficiario
                        </Label>
                        <Input
                          value={accountDetails.ach?.beneficiary_name || ""}
                          disabled
                          className="h-9 bg-muted"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Banco receptor</Label>
                        <Input
                          value={accountDetails.ach?.receiver_bank || ""}
                          disabled
                          className="h-9 bg-muted"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm">Tipo de cuenta</Label>
                        <Input
                          value={accountDetails.ach?.account_type || ""}
                          disabled
                          className="h-9 bg-muted"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Número de cuenta</Label>
                        <Input
                          value={accountDetails.ach?.account_number || ""}
                          disabled
                          className="h-9 bg-muted"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm">Routing Number</Label>
                        <Input
                          value={accountDetails.ach?.routing_number || ""}
                          disabled
                          className="h-9 bg-muted"
                        />
                      </div>
                      {accountDetails.ach?.beneficiary_bank_address && (
                        <div className="space-y-2">
                          <Label className="text-sm">Dirección del banco</Label>
                          <Input
                            value={
                              accountDetails.ach?.beneficiary_bank_address || ""
                            }
                            disabled
                            className="h-9 bg-muted"
                          />
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Campos para SWIFT */}
                {accountDetails.rail === "swift" && accountDetails.swift && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm">
                          Nombre del beneficiario
                        </Label>
                        <Input
                          value={accountDetails.swift?.beneficiary_name || ""}
                          disabled
                          className="h-9 bg-muted"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Banco receptor</Label>
                        <Input
                          value={accountDetails.swift?.receiver_bank || ""}
                          disabled
                          className="h-9 bg-muted"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm">SWIFT/BIC</Label>
                        <Input
                          value={accountDetails.swift?.swift_bic || ""}
                          disabled
                          className="h-9 bg-muted"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Número de cuenta</Label>
                        <Input
                          value={accountDetails.swift?.account_number || ""}
                          disabled
                          className="h-9 bg-muted"
                        />
                      </div>
                    </div>

                    {accountDetails.swift?.beneficiary_bank_address && (
                      <div className="space-y-2">
                        <Label className="text-sm">Dirección del banco</Label>
                        <Input
                          value={
                            accountDetails.swift?.beneficiary_bank_address || ""
                          }
                          disabled
                          className="h-9 bg-muted"
                        />
                      </div>
                    )}
                  </>
                )}

                {/* Campos para Crypto */}
                {accountDetails.rail === "crypto" && accountDetails.crypto && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm">Red</Label>
                        <Input
                          value={accountDetails.crypto?.wallet_network || ""}
                          disabled
                          className="h-9 bg-muted"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm">Dirección del wallet</Label>
                      <Input
                        value={accountDetails.crypto?.wallet_address || ""}
                        disabled
                        className="h-9 bg-muted font-mono text-xs"
                      />
                    </div>
                  </>
                )}

                {/* Campos para Local Currency */}
                {accountDetails.rail === "local" && accountDetails.local && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm">País</Label>
                        <Input
                          value={accountDetails.local?.country_code || ""}
                          disabled
                          className="h-9 bg-muted"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Banco</Label>
                        <Input
                          value={accountDetails.local?.bank_name || ""}
                          disabled
                          className="h-9 bg-muted"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm">
                          Nombre del beneficiario
                        </Label>
                        <Input
                          value={accountDetails.local?.beneficiary_name || ""}
                          disabled
                          className="h-9 bg-muted"
                        />
                      </div>
                      {accountDetails.local?.holder_id && (
                        <div className="space-y-2">
                          <Label className="text-sm">ID del titular</Label>
                          <Input
                            value={accountDetails.local.holder_id}
                            disabled
                            className="h-9 bg-muted"
                          />
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {accountDetails.local?.identifier_primary && (
                        <div className="space-y-2">
                          <Label className="text-sm">
                            {accountDetails.local.identifier_primary_type ||
                              "Identificador primario"}
                          </Label>
                          <Input
                            value={accountDetails.local.identifier_primary}
                            disabled
                            className="h-9 bg-muted"
                          />
                        </div>
                      )}
                      {accountDetails.local?.identifier_secondary && (
                        <div className="space-y-2">
                          <Label className="text-sm">
                            {accountDetails.local.identifier_secondary_type ||
                              "Identificador secundario"}
                          </Label>
                          <Input
                            value={accountDetails.local.identifier_secondary}
                            disabled
                            className="h-9 bg-muted"
                          />
                        </div>
                      )}
                    </div>

                    {accountDetails.local?.account_number && (
                      <div className="space-y-2">
                        <Label className="text-sm">Número de cuenta</Label>
                        <Input
                          value={accountDetails.local.account_number}
                          disabled
                          className="h-9 bg-muted"
                        />
                      </div>
                    )}
                  </>
                )}

                {/* Separador visual */}
                <div className="border-t pt-4 mt-6">
                  <h3 className="text-base font-medium mb-4">
                    Detalles del retiro
                  </h3>
                </div>
              </>
            )}

            {/* Campos de retiro */}
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-sm">
                Monto Bruto (USD) *
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="amount"
                  {...register("amount")}
                  onChange={handleAmountChange}
                  placeholder="0.00"
                  className="pl-10 font-mono h-9"
                />
              </div>
              {errors.amount && (
                <p className="text-xs text-destructive">
                  {errors.amount.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="reference" className="text-sm">
                Concepto / Referencia
              </Label>
              <Textarea
                id="reference"
                {...register("reference")}
                placeholder="Descripción opcional del retiro"
                rows={2}
                className="resize-none"
              />
              {errors.reference && (
                <p className="text-xs text-destructive">
                  {errors.reference.message}
                </p>
              )}
            </div>

            {/* Comprobante PDF */}
            <div className="space-y-2">
              <Label htmlFor="receiptFile" className="text-sm">
                Comprobante PDF *
              </Label>
              <Input
                id="receiptFile"
                type="file"
                accept="application/pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    // Validar tipo de archivo
                    if (file.type !== "application/pdf") {
                      e.target.value = "";
                      setSelectedFile(null);
                      setValue("receiptFile", undefined);
                      return;
                    }
                    // Validar tamaño (10MB máximo)
                    if (file.size > 10 * 1024 * 1024) {
                      e.target.value = "";
                      setSelectedFile(null);
                      setValue("receiptFile", undefined);
                      return;
                    }
                    setSelectedFile(file);
                    setValue("receiptFile", file);
                  } else {
                    setSelectedFile(null);
                    setValue("receiptFile", undefined);
                  }
                }}
                className="h-9 cursor-pointer file:cursor-pointer file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              />
              {errors.receiptFile && (
                <p className="text-xs text-destructive">
                  {String(errors.receiptFile.message)}
                </p>
              )}
              {selectedFile && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted p-2 rounded">
                  <FileText className="h-3 w-3" />
                  <span>
                    {selectedFile.name} (
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Sube una factura, contrato, o documento PDF que justifique tu
                retiro (máx. 10MB)
              </p>
            </div>
          </CardContent>
        </Card>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            Verifica que todos los datos sean correctos. Los errores pueden
            causar retrasos o devoluciones con cargos adicionales.
          </AlertDescription>
        </Alert>

        <div className="flex justify-end">
          <Button type="submit" className="px-6">
            Revisar solicitud
          </Button>
        </div>
      </div>
    </div>
  );
}
