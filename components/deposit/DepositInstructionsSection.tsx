"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Download, AlertCircle, RefreshCw } from "lucide-react";
import { useAuth } from "@/components/auth";
import { useAllDepositAccountsQuery } from "@/hooks/deposits/queries";
import { generatePDFFields, getPDFAddresses } from "@/lib/deposit-field-configs";
import { downloadDepositInstructions } from "@/lib/pdf-generator";
import InstructionsMethodTabs from "./InstructionsMethodTabs";
import { DepositMethodFields } from "./DepositMethodFields";

export type DepositMethod = "ach" | "swift" | "crypto" | "local";

export default function DepositInstructionsSection() {
  const [selectedMethod, setSelectedMethod] = useState<DepositMethod>("ach");
  const [selectedCryptoWallet, setSelectedCryptoWallet] = useState(0);
  const { user } = useAuth();
  const userDisplayEmail = user?.email || "";

  // Cargar todas las cuentas de una vez con la RPC
  const { data: allAccounts, isLoading, error, refetch } = useAllDepositAccountsQuery();

  // Helper function para obtener la cuenta del método
  const getCurrentMethodData = (method: DepositMethod) => {
    if (!allAccounts || !Array.isArray(allAccounts)) {
      return null;
    }

    // Buscar la cuenta que coincide con el rail y devolver el objeto completo
    const account = allAccounts.find((acc: any) => acc.rail === method);
    

console.log(`ALL ACCOUNTS:`, JSON.stringify(allAccounts, null, 2));
console.log(`Looking for rail: ${method}`);
console.log(`Found account:`, JSON.stringify(account, null, 2));    
    return account || null;
  };

  const getError = () => error?.message ?? null;
  const hasData = (method: DepositMethod) => {
    const data = getCurrentMethodData(method);
    return data !== null && data !== undefined;
  };

  const handleRefresh = () => {
    refetch();
  };

  const handleDownloadPDF = async () => {
    try {
      const accountData = getCurrentMethodData(selectedMethod);
      if (!accountData) return;

      // Extraer los datos específicos del rail
      const railData = accountData[selectedMethod];
      if (!railData) return;

      console.log('PDF - Method:', selectedMethod);
      console.log('PDF - Rail Data:', railData);

      // Generar campos usando la configuración
      const fields = generatePDFFields(selectedMethod, railData);
      
      console.log('PDF - Generated Fields:', fields);
      
      if (fields.length === 0) return;

      // Obtener direcciones solo para ACH/SWIFT
      const addresses = (selectedMethod === 'ach' || selectedMethod === 'swift') 
        ? getPDFAddresses(selectedMethod, railData as any)
        : undefined;

      const pdfData = {
        method: selectedMethod === "ach" ? "ACH/Wire" 
              : selectedMethod === "crypto" ? "Crypto" 
              : selectedMethod === "local" ? "Moneda Local" 
              : selectedMethod.toUpperCase(),
        userEmail: userDisplayEmail,
        fields,
        addresses,
      };

      await downloadDepositInstructions(pdfData);
    } catch (error: any) {
      alert(error.message || "Error al generar el PDF. Por favor, inténtelo de nuevo.");
    }
  };

  const renderContent = (method: DepositMethod) => {
    return (
      <>
        <DepositMethodFields
          method={method}
          data={getCurrentMethodData(method)}
          selectedCryptoWallet={selectedCryptoWallet}
          onSelectCryptoWallet={setSelectedCryptoWallet}
        />

        {/* Botón de descarga de PDF */}
        {hasData(method) && (
          <div className="mt-6 pt-4 border-t">
            <Button onClick={handleDownloadPDF} variant="cta" className="w-full sm:w-auto">
              <Download className="w-4 h-4 mr-2" />
              Descargar Instrucciones PDF
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Descarga un PDF con toda la información de depósito para conservar
            </p>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-1">
            Instrucciones de depósito
          </h2>
          <p className="text-sm text-muted-foreground">
            Selecciona el método de depósito para obtener la información bancaria necesaria
          </p>
        </div>

        <Button
          variant="cta"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading}
          className="flex items-center space-x-2"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          <span>Actualizar</span>
        </Button>
      </div>

      <div className="space-y-4">
        <InstructionsMethodTabs
          selectedMethod={selectedMethod}
          onMethodChange={setSelectedMethod}
          loading={isLoading}
          error={getError()}
          hasData={hasData(selectedMethod)}
          userEmail={userDisplayEmail}
          renderContent={renderContent}
        />

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            Verifica con tu banco los costos y tiempos de procesamiento. Los pagos internacionales
            pueden requerir información adicional.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
