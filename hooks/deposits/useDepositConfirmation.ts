import { useDepositsRepository } from "@/hooks/deposits/repository";
import { useAuthenticatedFetch } from "@/hooks/use-authenticated-fetch";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import type { DepositConfirmationParams } from "@/types/deposit-types";
import { useAuth } from "@/components/auth";

export const useDepositConfirmation = () => {
  const repo = useDepositsRepository();
  const { authenticatedFetch } = useAuthenticatedFetch();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isPending, setIsPending] = useState(false);

  const confirmDeposit = async ({
    userEmail,
    externalAccount,
    destinationAccount,
    file,
    onSuccess
  }: DepositConfirmationParams): Promise<void> => {
    if (!userEmail) return;

    setIsPending(true);

    try {
      // Subir archivo (opcional)
      let fileUrl: string | null = null;
      if (file) {
        const uploaded = await repo.uploadFile(file, userEmail);
        fileUrl = uploaded?.publicUrl ?? null;
      }

      const externalAccountId = externalAccount?.id;
      const fundingAccountId = destinationAccount?.id;
      const rail = destinationAccount?.rail;
      const currencyCode = destinationAccount?.currency_code;
      
      if (!fundingAccountId || !rail || !currencyCode) {
        console.error("Faltan campos requeridos:", { fundingAccountId, rail, currencyCode });
        throw new Error("Datos incompletos para crear la solicitud de depósito");
      }

      // Preparar datos enriquecidos para notificaciones
      const buildAccountDetails = (account: any): string | null => {
        if (!account?.details) return null;
        const details = account.details;
        const parts = [];
        if (details.account_number) parts.push(`Cuenta: ${details.account_number}`);
        if (details.bank_name) parts.push(`Banco: ${details.bank_name}`);
        if (details.wallet_address) parts.push(`Wallet: ${details.wallet_address}`);
        return parts.length > 0 ? parts.join(", ") : null;
      };

      // Llamar al nuevo endpoint /api/deposit-request
      const response = await authenticatedFetch("/api/deposit-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          externalAccountId: externalAccountId || null,
          fundingAccountId,
          rail,
          currencyCode,
          fileUrl: fileUrl || null,
          // Datos para notificaciones
          companyName: user?.dbUser?.company?.name ?? null,
          externalAccountNickname: externalAccount?.nickname ?? null,
          externalAccountDetails: buildAccountDetails(externalAccount),
          fundingAccountNickname: destinationAccount?.nickname ?? null,
          fundingAccountDetails: buildAccountDetails(destinationAccount),
        }),
      });

      const result = await response.json();

      if (!response.ok || !result?.ok) {
        throw new Error(result?.error || "Error al crear la solicitud de depósito");
      }

      toast({
        title: "Solicitud enviada",
        description: "Tu depósito fue registrado correctamente. Te contactaremos pronto.",
      });

      // Ejecutar callback de éxito
      onSuccess?.();
    } catch (error) {
      console.error("Error al confirmar depósito:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo confirmar el depósito",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsPending(false);
    }
  };

  return {
    confirmDeposit,
    isLoading: isPending
  };
};