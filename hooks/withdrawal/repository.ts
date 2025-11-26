import { useAuthenticatedFetch } from "@/hooks/use-authenticated-fetch";
import { getApiEmailForUser } from "@/lib/utils";
import { useAuth } from "@/components/auth";

interface Account {
  id: string;
  nickname: string;
  category: string;
  method?: string;
  details: any;
  // Campos legacy para compatibilidad con el componente existente
  account_ownership?: string;
  beneficiary_name?: string;
  beneficiary_bank?: string;
  account_type?: string;
  account_number?: string;
  routing_number?: string;
  swift_bic?: string;
  wallet_alias?: string;
  wallet_address?: string;
  wallet_network?: string;
  country?: string;
  local_account_name?: string;
  local_bank?: string;
  local_account_number?: string;
}

// --- Tipos útiles
export type PayoutAccountPayload = {
  user_email: string;
  category: string; // "usd_bank" | "local" | "crypto" | etc.
  method?: string | null; // "ACH" | "SWIFT" | ...
  nickname: string;
  is_default?: boolean; // default false
  details?: any;
  // Campos planos posibles (solo si vienen en el form)
  beneficiary_name?: string;
  beneficiary_bank?: string;
  account_type?: string;
  account_number?: string;
  routing_number?: string;
  swift_bic?: string;
  wallet_alias?: string;
  wallet_network?: string;
  local_account_name?: string;
  local_bank?: string;
  local_account_number?: string;
  last4?: string;
};

export type WithdrawalRail = "ach" | "swift" | "crypto" | "local";

export interface CreateWithdrawalRequestPayload {
  external_account_id: string;
  currency_code: string;
  rail: WithdrawalRail;
  initial_amount: number;
  external_reference?: string | null;
  file_url?: string | null;
  // si querés, podés meter acá external_id, fee, etc. cuando los uses
}

export interface CreateWithdrawalResult {
  ok: boolean;
  data?: {
    withdrawal_request_id: string;
  };
  error?: string;
}

export const useWithdrawalRepository = () => {
  const { authenticatedFetch } = useAuthenticatedFetch();
  const { session } = useAuth();

  const uploadFile = async (file: File, userEmail: string) => {
    if (!session?.access_token) {
      throw new Error("No authentication token available");
    }

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/upload-proof", {
      method: "POST",
      // 👇 NO ponemos Content-Type, solo el Authorization
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
      body: formData,
    });

    const result = await response.json();

    if (!response.ok || !result?.ok) {
      throw new Error(result?.error || "Error al subir el archivo");
    }

    return {
      publicUrl: result.data.publicUrl,
      filePath: result.data.filePath,
    };
  };

  const submitWithdrawal = async ({
    formData,
    userEmail,
  }: {
    formData: any;
    userEmail: string;
  }) => {
    const response = await authenticatedFetch("/api/withdrawals", {
      method: "POST",
      headers: {
        "x-user-email": getApiEmailForUser(userEmail),
      },
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      const responseData = await response.json().catch(() => ({}));
      const errorMessage =
        responseData.message ||
        responseData.error ||
        "Error al enviar la solicitud";
      throw new Error(errorMessage);
    }

    return response.json();
  };

  const loadAccounts = async (): Promise<Account[]> => {
    try {
      // Usar el endpoint de external accounts que trae todas las cuentas de la company
      const response = await authenticatedFetch("/api/external-accounts", {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error("Failed to load accounts");
      }

      const result = await response.json();
      return Array.isArray(result?.data) ? result.data : [];
    } catch (error) {
      console.error("Error loading accounts:", error);
      throw error;
    }
  };

  // --- saveAccount: ahora acepta TODO el payload
  const saveAccount = async (payload: PayoutAccountPayload): Promise<void> => {
    try {
      // Chequeo alias duplicado (sigue siendo útil client-side; ideal mover al server también)
      const existingAccounts = await loadAccounts();
      const aliasExists = existingAccounts.some(
        (a: any) =>
          (a.nickname || "").toLowerCase() ===
          (payload.nickname || "").toLowerCase()
      );
      if (aliasExists) {
        throw new Error(
          "Alias ya usado. Elegí un alias diferente para esta cuenta."
        );
      }

      const response = await authenticatedFetch("/api/payout-accounts", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result?.ok) {
        throw new Error(
          result?.error || "No se pudo guardar la cuenta. Intentá más tarde."
        );
      }
    } catch (error) {
      console.error("Error saving account:", error);
      throw error;
    }
  };

  const createWithdrawalRequest = async (
    payload: CreateWithdrawalRequestPayload
  ): Promise<CreateWithdrawalResult> => {
    try {
      const response = await authenticatedFetch("/api/withdrawal-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result?.ok) {
        throw new Error(result?.error || "Failed to create withdrawal request");
      }

      return {
        ok: true,
        data: result.data,
      };
    } catch (error) {
      console.error("Error creating withdrawal request:", error);
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  };


  const loadWithdrawalDetailByExternalId = async (
    externalId: string
  ): Promise<any> => {
    const resp = await authenticatedFetch(
      "/api/withdrawals/detail-by-external-id",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ externalId }),
      }
    );

    const json = await resp.json();

    if (!resp.ok || !json?.ok) {
      throw new Error(json?.error || "Failed to load withdrawal detail");
    }

    // La RPC devuelve un jsonb con todo el blob enriquecido
    return json.data;
  };


  return {
    uploadFile,
    submitWithdrawal,
    loadAccounts,
    saveAccount,
    createWithdrawalRequest,
    loadWithdrawalDetailByExternalId,
  };
};
