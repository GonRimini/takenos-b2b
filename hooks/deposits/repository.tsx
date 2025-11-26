import { supabase } from "@/lib/supabase-client";
import { useAuthenticatedFetch } from "@/hooks/use-authenticated-fetch";
//import { getApiEmailForUser } from '@/lib/utils';
import { useAuth } from "@/components/auth";


interface Account {
  id: string;
  nickname: string;
  category: string;
  method?: string;
  details: any;
}

type DepositAccount = any;

type DepositMethod = "ach" | "swift" | "crypto" | "local";

type PayoutMethod = "ach" | "swift" | "crypto" | "local";

type DepositAccountPayload = {
  user_email: string;
  category: string; // ej: "deposit"
  method: PayoutMethod;
  nickname: string;
  is_default?: boolean;
  details?: any;

  // Campos opcionales según método
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

export const useDepositsRepository = () => {
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
  const submitDeposit = async ({
    formData,
    userEmail,
  }: {
    formData: any;
    userEmail: string;
  }) => {
    try {
      console.log(formData, userEmail);
      const response = await authenticatedFetch("/api/deposit-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ formData, userEmail }),
      });

      return response.json();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error("Error submitting deposit:", errorMessage, error);
      throw error instanceof Error ? error : new Error(String(error));
    }
  };

  const loadDepositAccounts = async (
    method: DepositMethod,
    userEmail?: string
  ): Promise<Account[]> => {
    try {
      const qs = new URLSearchParams({ method });
      // Podés pasar el email por query o por header; dejo ambos por compatibilidad
      if (userEmail) qs.set("email", userEmail.toLowerCase().trim());

      console.log("qs", qs.toString());
      console.log("userEmail", userEmail);
      console.log("headers", {
        "x-user-email": userEmail?.toLowerCase().trim(),
      });

      const response = await authenticatedFetch(
        `/api/accounts?${qs.toString()}`,
        {
          method: "GET",
          headers: userEmail
            ? { "x-user-email": userEmail.toLowerCase().trim() }
            : undefined,
        }
      );

      const result = await response.json();
      return Array.isArray(result?.data) ? result.data : [];
    } catch (error) {
      console.error("Error loading accounts:", error);
      throw Error((error as Error).message);
    }
  };

  const saveAccount = async (payload: DepositAccountPayload): Promise<void> => {
    try {
      const response = await authenticatedFetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload), // ⬅️ se envía tal cual
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

  const loadWhitelistedDepositAccounts = async (
    userEmail: string
  ): Promise<Account[]> => {
    try {
      const qs = new URLSearchParams();
      if (userEmail) qs.set("email", userEmail.toLowerCase().trim());

      const response = await authenticatedFetch(
        `/api/deposit-accounts?${qs.toString()}`,
        {
          method: "GET",
          headers: userEmail
            ? { "x-user-email": userEmail.toLowerCase().trim() }
            : undefined,
        }
      );

      const result = await response.json();
      return Array.isArray(result?.data) ? result.data : [];
    } catch (error) {
      console.error("Error loading whitelisted deposit accounts:", error);
      throw Error((error as Error).message);
    }
  };

  const loadDepositInstructions = async (
    method: DepositMethod,
    userEmail: string
  ) => {
    // Import the deposit functions
    const {
      getDepositoACH,
      getDepositoSWIFT,
      getDepositosCrypto,
      getDepositoLocal,
    } = await import("@/lib/depositos");

    switch (method) {
      case "ach":
        return await getDepositoACH(userEmail);
      case "swift":
        return await getDepositoSWIFT(userEmail);
      case "crypto":
        return await getDepositosCrypto(userEmail);
      case "local":
        return await getDepositoLocal(userEmail);
      default:
        throw new Error(`Método de depósito no soportado: ${method}`);
    }
  };

  const loadDepositAccount = async (
    method: DepositMethod
  ): Promise<DepositAccount[]> => {
    const resp = await authenticatedFetch("/api/deposit-rails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ method }),
      cache: "no-store",
    });

    const json = await resp.json();

    if (!resp.ok || !json?.ok) {
      throw new Error(json?.error || "Failed to load deposit accounts");
    }

    console.log("Deposit account data:", json);

    return Array.isArray(json?.data) ? json.data : [];
  };

  /**
   * Nueva función que trae TODAS las cuentas de depósito de una vez
   * usando la RPC get_funding_accounts
   */
  const loadAllDepositAccounts = async (): Promise<DepositAccount[]> => {
    const resp = await authenticatedFetch("/api/deposit-rails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    const json = await resp.json();

    if (!resp.ok || !json?.ok) {
      throw new Error(json?.error || "Failed to load deposit accounts");
    }

    console.log("All deposit accounts data:", json);

    return Array.isArray(json?.data) ? json.data : [];
  };

  // Método provisional para verificar si un usuario es boliviano
  // basándose en si tiene una cuenta local con banco = "CIDRE IFD"
  const checkIsBolivian = async (userEmail: string): Promise<boolean> => {
    try {
      // Buscar cuentas locales del usuario
      const localAccounts = await loadDepositAccounts("local", userEmail);

      console.log("Local accounts for", userEmail, localAccounts);

      if (!Array.isArray(localAccounts) || localAccounts.length === 0) {
        return false;
      }

      // Verificar si alguna cuenta tiene banco = "CIDRE IFD"
      const isBolivian = localAccounts.some(
        (account: any) => account.banco?.toLowerCase() === "cidre ifd"
      );

      return isBolivian;
    } catch (error) {
      console.error("Error checking if user is Bolivian:", error);
      return false;
    }
  };

  return {
    uploadFile,
    submitDeposit,
    loadDepositAccounts,
    saveAccount,
    loadWhitelistedDepositAccounts,
    loadDepositInstructions,
    checkIsBolivian,
    loadDepositAccount,
    loadAllDepositAccounts,
  };
};
