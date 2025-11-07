"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Download, AlertCircle, RefreshCw } from "lucide-react";
import { useAuth } from "@/components/auth";
import { useDepositInstructionsQuery } from "@/hooks/deposits/queries";
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

  // Queries directas - solo se ejecutan cuando están habilitadas
  const achQuery = useDepositInstructionsQuery('ach', userDisplayEmail, !!userDisplayEmail);
  const swiftQuery = useDepositInstructionsQuery('swift', userDisplayEmail, !!userDisplayEmail);
  const cryptoQuery = useDepositInstructionsQuery('crypto', userDisplayEmail, !!userDisplayEmail);
  const localQuery = useDepositInstructionsQuery('local', userDisplayEmail, !!userDisplayEmail);

  // Helper functions - mucho más simples
  const getQuery = (method: DepositMethod) => {
    switch (method) {
      case 'ach': return achQuery;
      case 'swift': return swiftQuery;
      case 'crypto': return cryptoQuery;
      case 'local': return localQuery;
    }
  };

  const getCurrentMethodData = (method: DepositMethod) => {
    return getQuery(method).data;
  };

  const isLoading = (method: DepositMethod) => getQuery(method).isLoading;
  const getError = (method: DepositMethod) => getQuery(method).error?.message ?? null;
  const hasData = (method: DepositMethod) => {
    const data = getCurrentMethodData(method);
    return method === 'crypto' ? Array.isArray(data) && data.length > 0 : !!data;
  };

  const handleRefresh = () => {
    getQuery(selectedMethod).refetch();
  };

  const handleDownloadPDF = async () => {
    try {
      const data = getCurrentMethodData(selectedMethod);
      if (!data) return;

      // Para crypto, usar el wallet seleccionado
      const displayData = selectedMethod === 'crypto' && Array.isArray(data) 
        ? data[selectedCryptoWallet] || data[0]
        : data;

      if (!displayData) return;

      // Generar campos usando la configuración
      const fields = generatePDFFields(selectedMethod, displayData);
      if (fields.length === 0) return;

      // Obtener direcciones solo para ACH/SWIFT
      const addresses = (selectedMethod === 'ach' || selectedMethod === 'swift') 
        ? getPDFAddresses(selectedMethod, displayData as any)
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
          disabled={isLoading(selectedMethod)}
          className="flex items-center space-x-2"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading(selectedMethod) ? "animate-spin" : ""}`} />
          <span>Actualizar</span>
        </Button>
      </div>

      <div className="space-y-4">
        <InstructionsMethodTabs
          selectedMethod={selectedMethod}
          onMethodChange={setSelectedMethod}
          loading={isLoading(selectedMethod)}
          error={getError(selectedMethod)}
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
