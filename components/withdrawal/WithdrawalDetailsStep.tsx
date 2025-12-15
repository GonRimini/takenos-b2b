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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AlertCircle, DollarSign, FileText, Info, X } from "lucide-react";
import { useExternalAccountQuery } from "@/hooks/external-accounts/queries";
import { UseFormRegister, UseFormSetValue, FieldErrors } from "react-hook-form";
import { type WithdrawalFormData } from "@/lib/withdrawal-schema";
import { useToast } from "@/hooks/use-toast";

interface WithdrawalDetailsStepProps {
  selectedAccount: any;
  isCreatingNewAccount: boolean;
  onBack: () => void;
  register: UseFormRegister<WithdrawalFormData>;
  setValue: UseFormSetValue<WithdrawalFormData>;
  errors: FieldErrors<WithdrawalFormData>;
  selectedFiles: File[]; // ✅ Cambiado de File | null a File[]
  setSelectedFiles: (files: File[]) => void; // ✅ Cambiado para aceptar array
  handleAmountChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function WithdrawalDetailsStep({
  selectedAccount,
  isCreatingNewAccount,
  onBack,
  register,
  setValue,
  errors,
  selectedFiles,
  setSelectedFiles,
  handleAmountChange,
}: WithdrawalDetailsStepProps) {
  const { toast } = useToast();
  
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
              <div className="flex items-center gap-1.5">
                <Label htmlFor="amount" className="text-sm">
                  Monto Neto (USD) *
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 text-yellow-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        Este es el monto que recibirás en tu cuenta.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
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

            {/* Comprobantes PDF - Múltiples archivos */}
            <div className="space-y-2">
              <Label htmlFor="receiptFiles" className="text-sm">
                Comprobantes PDF *
              </Label>
              <Input
                id="receiptFiles"
                type="file"
                accept="application/pdf"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  
                  if (files.length === 0) {
                    return;
                  }
                  
                  // Validar cada archivo
                  const validFiles: File[] = [];
                  
                  for (const file of files) {
                    // Validar tipo de archivo
                    if (file.type !== "application/pdf") {
                      toast({
                        title: "Error",
                        description: `${file.name} no es un archivo PDF válido`,
                        variant: "destructive",
                      });
                      continue;
                    }
                    
                    // Validar tamaño (10MB máximo)
                    if (file.size > 10 * 1024 * 1024) {
                      toast({
                        title: "Error",
                        description: `${file.name} supera el tamaño máximo de 10MB`,
                        variant: "destructive",
                      });
                      continue;
                    }
                    
                    validFiles.push(file);
                  }
                  
                  // Agregar archivos válidos a la lista existente
                  if (validFiles.length > 0) {
                    const newFiles = [...selectedFiles, ...validFiles];
                    setSelectedFiles(newFiles);
                    setValue("receiptFiles", newFiles);
                  }
                  
                  // Limpiar el input para permitir subir el mismo archivo de nuevo
                  e.target.value = "";
                }}
                className="h-9 cursor-pointer file:cursor-pointer file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              />
              {errors.receiptFile && (
                <p className="text-xs text-destructive">
                  {String(errors.receiptFile.message)}
                </p>
              )}
              
              {/* Lista de archivos seleccionados */}
              {selectedFiles.length > 0 && (
                <div className="space-y-2 mt-3">
                  <p className="text-xs font-medium text-muted-foreground">
                    {selectedFiles.length} archivo{selectedFiles.length !== 1 ? "s" : ""} seleccionado{selectedFiles.length !== 1 ? "s" : ""}:
                  </p>
                  {selectedFiles.map((file, index) => (
                    <div
                      key={`${file.name}-${index}`}
                      className="flex items-center justify-between gap-2 text-xs bg-muted p-2 rounded hover:bg-muted/80 transition-colors"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <FileText className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                        <span className="truncate">
                          {file.name}
                        </span>
                        <span className="text-muted-foreground flex-shrink-0">
                          ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const newFiles = selectedFiles.filter((_, i) => i !== index);
                          setSelectedFiles(newFiles);
                          setValue("receiptFiles", newFiles);
                        }}
                        className="text-destructive hover:text-destructive/80 flex-shrink-0 p-1 hover:bg-destructive/10 rounded transition-colors"
                        title="Eliminar archivo"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              <p className="text-xs text-muted-foreground">
                Puedes subir múltiples comprobantes (facturas, contratos, etc.). Máx. 10MB por archivo.
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
