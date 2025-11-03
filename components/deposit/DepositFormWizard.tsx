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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AccountSelectionStep } from "./DepositAccountSelection";
import CreateDepositAccountPanel from "./CreateDepositAccountPanel";
import MethodAndDestinationCard from "./MethodAndDestinationCard";
import UploadFile from "./UploadFile";
import ReviewConfirmationCard from "./ReviewConfirmationCard";
import { useSubmitDepositMutation } from "@/hooks/deposits/queries";
import { useDepositsRepository } from "@/hooks/deposits/repository";
//import UploadFile from "./UploadFile";
import { useAuth } from "@/components/auth";
import { useWhitelistedDepositAccountsQuery } from "@/hooks/deposits/queries";

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

  return (
    <div className="space-y-6">
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

      {step === 1 && creatingNewAccount && (
        <CreateDepositAccountPanel
          userEmail={userEmail}
          onCreated={async () => {
            await refetch();
            setCreatingNewAccount(false);
          }}
          onCancel={() => setCreatingNewAccount(false)}
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
            <CardDescription>Subí el comprobante del depósito</CardDescription>
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
  const { mutateAsync, isPending } = useSubmitDepositMutation();
  const repo = useDepositsRepository();

  type IDLike = { id: string } | string | null | undefined;
  const getId = (x: IDLike) =>
    (x && typeof x === "object" ? (x as any).id : x) ?? undefined;

  type DepositRequestInsert = {
    user_email: string;
    file_url: string | null;
    date: string; // ISO
    deposit_account_id: string;
    payout_account_id: string;
  };

  const onConfirm = async () => {
    if (!userEmail) return;

    // Subir archivo (opcional)
    let fileUrl: string | null = null;
    if (file) {
      const uploaded = await repo.uploadFile(file, userEmail);
      fileUrl = uploaded?.publicUrl ?? null;
    }

    const depositAccountId = getId(externalAccount);
    const payoutAccountId = getId(destinationAccount);
    if (!depositAccountId || !payoutAccountId) {
      console.error("Faltan IDs: deposit_account_id o payout_account_id");
      return;
    }

    // 👇 EXACTO como lo espera la mutación: { formData, userEmail }
    const formData: DepositRequestInsert = {
      user_email: userEmail,
      file_url: fileUrl,
      date: new Date().toISOString(),
      deposit_account_id: String(depositAccountId),
      payout_account_id: String(payoutAccountId),
    };

    console.log("submit deposits_request", formData);
    await mutateAsync({ formData, userEmail },{ onSuccess: () => onSuccess?.() });
  };

  return (
    <Button variant="cta" onClick={onConfirm} disabled={disabled || isPending}>
      {isPending ? "Confirmando..." : "Confirmar"}
    </Button>
  );
}
