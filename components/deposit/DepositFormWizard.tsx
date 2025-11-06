"use client";

import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AccountSelectionStep } from "./DepositAccountSelection";
import CreateDepositAccountPanel from "./CreateDepositAccountPanel";
import MethodAndDestinationCard from "./MethodAndDestinationCard";
import UploadFile from "./UploadFile";
import ReviewConfirmationCard from "./ReviewConfirmationCard";
import { useAuth } from "@/components/auth";
import { useWhitelistedDepositAccountsQuery } from "@/hooks/deposits/queries";
import { useDepositConfirmation } from "@/hooks/deposits/useDepositConfirmation";
import DepositWizardProgress from "./DepositWizardProgress";

type DepositMethod = "ach" | "swift" | "crypto" | "local";

type WizardStep = 1 | 2 | 3 | 4;

export default function DepositFormWizard() {
  const { user } = useAuth();
  const userEmail = user?.email ?? undefined;

  const [step, setStep] = useState<WizardStep>(1);
  const [creatingNewAccount, setCreatingNewAccount] = useState(false);
  const [externalAccount, setExternalAccount] = useState<any | null>(null);
  const [destinationMethod, setDestinationMethod] = useState<
    DepositMethod | undefined
  >(undefined);
  const [destinationAccount, setDestinationAccount] = useState<any | null>(
    null
  );
  const [file, setFile] = useState<File | null>(null);

  const {
    data: accounts = [],
    isLoading,
    refetch,
  } = useWhitelistedDepositAccountsQuery(
    // Para el paso 1 listamos todas las cuentas del usuario sin filtrar por método
    // El endpoint acepta method; usamos undefined y hacemos refetch por método si hiciera falta luego
    userEmail,
    step === 1 && !creatingNewAccount
  );

  const resetWizard = () => {
    setStep(1 as WizardStep);
    setCreatingNewAccount(false);
    setExternalAccount(null);
    setDestinationMethod(undefined);
    setDestinationAccount(null);
    setFile(null);
    refetch(); // opcional, refresca cuentas
  };

  const canGoNext = useMemo(() => {
    if (step === 1) return !!externalAccount;
    if (step === 2) return !!destinationMethod && !!destinationAccount;
    if (step === 3) return !!file;
    if (step === 4) return !!externalAccount && !!destinationAccount; // confirm enabled always if summary is complete
    return false;
  }, [step, externalAccount, destinationMethod, destinationAccount, file]);

  const goNext = () => {
    if (!canGoNext) return;
    setStep((s) => (s === 4 ? 4 : ((s + 1) as WizardStep)));
  };
  const goBack = () => setStep((s) => (s === 1 ? 1 : ((s - 1) as WizardStep)));

  const handleStepClick = (targetStep: number) => {
    // Solo permitir navegar a pasos válidos y no saltar validaciones
    if (targetStep === 1) {
      setStep(1);
    } else if (targetStep === 2 && !!externalAccount) {
      setStep(2);
    } else if (targetStep === 3 && !!externalAccount && !!destinationMethod && !!destinationAccount) {
      setStep(3);
    } else if (targetStep === 4 && !!externalAccount && !!destinationMethod && !!destinationAccount && !!file) {
      setStep(4);
    }
  };

  const canGoToStep = (targetStep: number): boolean => {
    if (targetStep === 1) return true;
    if (targetStep === 2) return !!externalAccount;
    if (targetStep === 3) return !!externalAccount && !!destinationMethod && !!destinationAccount;
    if (targetStep === 4) return !!externalAccount && !!destinationMethod && !!destinationAccount && !!file;
    return false;
  };

  // Si está creando nueva cuenta, mostrar solo ese componente
  if (creatingNewAccount) {
    return (
      <div className="space-y-6">
        <CreateDepositAccountPanel
          userEmail={userEmail}
          onCreated={async () => {
            await refetch();
            setCreatingNewAccount(false);
          }}
          onCancel={() => setCreatingNewAccount(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DepositWizardProgress 
        currentStep={step}
        canGoToStep={canGoToStep}
        onStepClick={handleStepClick}
      />
      {step === 1 && (
        <AccountSelectionStep
          accounts={accounts}
          loadingAccounts={isLoading}
          onLoadAccounts={() => refetch()}
          onSelectAccount={(acc) => {
            setExternalAccount(acc);
            setCreatingNewAccount(false);
            setStep(2 as WizardStep);
          }}
          onCreateNewAccount={() => {
            setCreatingNewAccount(true);
            setExternalAccount(null);
          }}
        />
      )}

      {step === 2 && (
        <MethodAndDestinationCard
          userEmail={userEmail}
          onBack={() => setStep(1 as WizardStep)}
          onSelected={(method, acc) => {
            setDestinationMethod(method);
            setDestinationAccount(acc);
            setStep(3 as WizardStep);
          }}
        />
      )}

      {step === 3 && (
        <Card className="rounded-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Cargar comprobante PDF</CardTitle>
            <CardDescription>Paso 3: Subí el comprobante del depósito</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <UploadFile onFileSelected={(f: File) => setFile(f)} />
          </CardContent>
        </Card>
      )}

      {step === 4 && (
        <ReviewConfirmationCard
          externalAccount={externalAccount}
          destinationAccount={destinationAccount}
          destinationMethod={destinationMethod}
          file={file}
        />
      )}

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={goBack} disabled={step === 1}>
          Atrás
        </Button>
        <div className="space-x-2">
          {step < 4 && (
            <Button variant="cta" onClick={goNext} disabled={!canGoNext}>
              Siguiente
            </Button>
          )}
          {step === 4 && (
            <ConfirmDepositButton
              disabled={!canGoNext || !userEmail}
              userEmail={userEmail}
              externalAccount={externalAccount}
              destinationAccount={destinationAccount}
              destinationMethod={destinationMethod}
              file={file}
              onSuccess={resetWizard}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function ConfirmDepositButton({
  disabled,
  userEmail,
  externalAccount,
  destinationAccount,
  destinationMethod,
  onSuccess,
  file,
}: {
  disabled: boolean;
  userEmail?: string;
  externalAccount: any;
  destinationAccount: any;
  destinationMethod?: DepositMethod;
  onSuccess?: () => void;
  file: File | null;
}) {
  const { confirmDeposit, isLoading } = useDepositConfirmation();

  const handleConfirm = async () => {
    if (!userEmail) return;

    await confirmDeposit({
      userEmail,
      externalAccount,
      destinationAccount,
      file,
      onSuccess
    });
  };

  return (
    <Button variant="cta" onClick={handleConfirm} disabled={disabled || isLoading}>
      {isLoading ? "Confirmando..." : "Confirmar"}
    </Button>
  );
}
