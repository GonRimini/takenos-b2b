"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type DepositMethod = "ach" | "swift" | "crypto" | "local";

interface Props {
  externalAccount: any | null;
  destinationAccount: any | null;
  destinationMethod?: DepositMethod;
  file: File | null;
}

function Row({ label, value }: { label: string; value?: string | number | null }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div>
      <span className="font-medium">{label}: </span>
      <span className="break-all">{String(value)}</span>
    </div>
  );
}

function renderFromDetails(externalAccount: any | null) {
  if (!externalAccount) return null;

  const category = externalAccount.category;

  if (category === "usd_bank") {
    return (
      <div className="space-y-1">
        <Row label="Apodo" value={externalAccount.nickname} />
        <Row label="Método" value={externalAccount.method?.toUpperCase?.()} />
        <Row label="Banco" value={externalAccount.beneficiary_bank} />
        <Row label="Tipo de cuenta" value={externalAccount.account_type} />
        <Row label="Últimos 4" value={externalAccount.last4} />
      </div>
    );
  }

  if (category === "crypto") {
    const shortAddress = externalAccount.wallet_address
      ? `${externalAccount.wallet_address.slice(0, 10)}...${externalAccount.wallet_address.slice(-6)}`
      : undefined;
    return (
      <div className="space-y-1">
        <Row label="Apodo" value={externalAccount.nickname || externalAccount.wallet_alias} />
        <Row label="Red" value={externalAccount.wallet_network || externalAccount.network} />
        <Row label="Dirección" value={shortAddress} />
      </div>
    );
  }

  if (category === "local_currency") {
    return (
      <div className="space-y-1">
        <Row label="Apodo" value={externalAccount.nickname || externalAccount.local_account_name} />
        <Row label="Banco" value={externalAccount.local_bank || externalAccount.banco} />
        <Row label="País" value={externalAccount.country} />
        <Row label="Últimos 4" value={externalAccount.last4} />
      </div>
    );
  }

  // Fallback genérico
  return (
    <div className="space-y-1">
      <Row label="Apodo" value={externalAccount.nickname} />
      <Row label="Método" value={externalAccount.method?.toUpperCase?.()} />
    </div>
  );
}

function renderToDetails(destinationMethod: DepositMethod | undefined, destinationAccount: any | null) {
  if (!destinationMethod || !destinationAccount) return null;

  if (destinationMethod === "crypto") {
    const shortAddress = destinationAccount.wallet_address
      ? `${destinationAccount.wallet_address.slice(0, 10)}...${destinationAccount.wallet_address.slice(-6)}`
      : undefined;
    return (
      <div className="space-y-1">
        <Row label="Nombre / Alias" value={destinationAccount.nickname || destinationAccount.wallet_alias} />
        <Row label="Red" value={destinationAccount.wallet_network || destinationAccount.network} />
        <Row label="Dirección" value={shortAddress} />
      </div>
    );
  }

  if (destinationMethod === "ach" || destinationMethod === "swift") {
    return (
      <div className="space-y-1">
        <Row label="Beneficiario" value={destinationAccount.beneficiary_name || destinationAccount.nickname}/>
        <Row label="Banco" value={destinationAccount.beneficiary_bank} />
        <Row label="Tipo de cuenta" value={destinationAccount.account_type} />
        <Row label="Número de cuenta" value={destinationAccount.account_number || destinationAccount.last4} />
        {destinationMethod === "ach" && (
          <Row label="Routing" value={destinationAccount.routing_number} />
        )}
        {destinationMethod === "swift" && (
          <Row label="SWIFT/BIC" value={destinationAccount.swift_bic || destinationAccount.swift} />
        )}
      </div>
    );
  }

  // local
  return (
    <div className="space-y-1">
      <Row label="Nombre" value={destinationAccount.local_account_name || destinationAccount.nickname}/>
      <Row label="Banco" value={destinationAccount.local_bank || destinationAccount.banco} />
      <Row label="Número de cuenta" value={destinationAccount.local_account_number || destinationAccount.last4} />
      <Row label="País" value={destinationAccount.country} />
    </div>
  );
}

export default function ReviewConfirmationCard({ externalAccount, destinationAccount, destinationMethod, file }: Props) {
  return (
    <Card className="rounded-lg">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Revisión y confirmación</CardTitle>
        <CardDescription>Paso 4: Revisá los datos y confirmá tu depósito</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm space-y-4">
          <div>
            <div className="font-bold mb-1 text-md text-[#6d37d5]">Desde</div>
            {renderFromDetails(externalAccount)}
          </div>

          <div>
            <div className="font-bold mb-1 text-md text-[#6d37d5]">Hacia</div>
            {destinationMethod && (
              <div className="text-muted-foreground mb-1">{destinationMethod.toUpperCase()}</div>
            )}
            {renderToDetails(destinationMethod, destinationAccount)}
          </div>

          <div>
            <div className="font-medium mb-1">Comprobante</div>
            <div>{file?.name || "Sin archivo"}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


