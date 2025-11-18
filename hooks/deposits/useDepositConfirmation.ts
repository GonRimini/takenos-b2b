import { useDepositsRepository } from "@/hooks/deposits/repository";
import { useDepositNotification } from "@/hooks/notifications/useDepositNotification";
import { useAuthenticatedFetch } from "@/hooks/use-authenticated-fetch";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import type { DepositConfirmationParams } from "@/types/deposit-types";

export const useDepositConfirmation = () => {
  const repo = useDepositsRepository();
  const { sendDepositNotification } = useDepositNotification();
  const { authenticatedFetch } = useAuthenticatedFetch();
  const { toast } = useToast();
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
        }),
      });

      const result = await response.json();

      if (!response.ok || !result?.ok) {
        throw new Error(result?.error || "Error al crear la solicitud de depósito");
      }

      if (fileUrl && file) {
        await sendDepositNotification({
          userEmail,
          fileName: file.name || "comprobante_deposito.pdf",
          fileUrl
        });
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