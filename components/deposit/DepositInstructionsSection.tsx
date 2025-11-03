"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Download, AlertCircle, RefreshCw } from "lucide-react";
import { useAuth } from "@/components/auth";
import { useDepositInstructions, DepositMethod } from "@/hooks/deposits/useDepositInstructions";
import InstructionsMethodTabs from "./InstructionsMethodTabs";
import InstructionsContent from "./InstructionsContent";

export default function DepositInstructionsSection() {
  const [selectedMethod, setSelectedMethod] = useState<DepositMethod>("ach");
  const { user } = useAuth();
  const userDisplayEmail = user?.email || "";

  const {
    achData,
    swiftData,
    cryptoData,
    localData,
    selectedCryptoWallet,
    isLoading,
    getError,
    loadMethod,
    setSelectedCryptoWallet,
    downloadPDF,
    hasData,
  } = useDepositInstructions(userDisplayEmail);

  // Cargar datos cuando cambia el método seleccionado o el email
  useEffect(() => {
    if (!userDisplayEmail) return;
    loadMethod(selectedMethod);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMethod, userDisplayEmail]);

  const handleRefresh = () => {
    loadMethod(selectedMethod);
  };

  const handleDownloadPDF = async () => {
    try {
      await downloadPDF(selectedMethod);
    } catch (error: any) {
      alert(error.message || "Error al generar el PDF. Por favor, inténtelo de nuevo.");
    }
  };

  const renderContent = (method: DepositMethod) => {
    return (
      <>
        <InstructionsContent
          method={method}
          achData={achData}
          swiftData={swiftData}
          cryptoData={cryptoData}
          localData={localData}
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
