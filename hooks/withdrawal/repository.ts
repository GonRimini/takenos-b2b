import { supabase } from '@/lib/supabase-client';
import { useAuthenticatedFetch } from '@/hooks/use-authenticated-fetch';
import { getApiEmailForUser } from '@/lib/utils';

interface Account {
  id: string;
  nickname: string;
  category: string;
  method?: string;
  details: any;
}

// --- Tipos útiles
export type PayoutAccountPayload = {
  user_email: string;
  category: string;                 // "usd_bank" | "local" | "crypto" | etc.
  method?: string | null;           // "ACH" | "SWIFT" | ...
  nickname: string;
  is_default?: boolean;             // default false
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


export const useWithdrawalRepository = () => {
  const { authenticatedFetch } = useAuthenticatedFetch();

  const uploadFile = async (file: File, userEmail: string) => {
    // Crear nombre de archivo único y seguro
    const timestamp = Date.now();
    const safeFileName = file.name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9.\-_ ]/g, "")
      .replace(/\s+/g, "_");

    const filePath = `withdrawal-proofs/${userEmail}/${timestamp}_${safeFileName}`;

    // Subir archivo a Supabase
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("proofs")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false
      });

    if (uploadError) {
      throw new Error("Error al subir el archivo: " + uploadError.message);
    }

    // Generar URL pública del archivo
    const { data: publicUrlData } = supabase.storage
      .from("proofs")
      .getPublicUrl(uploadData.path);

    if (!publicUrlData.publicUrl) {
      throw new Error("No se pudo generar la URL del archivo");
    }

    return {
      publicUrl: publicUrlData.publicUrl,
      filePath: uploadData.path
    };
  };

  const submitWithdrawal = async ({ formData, userEmail }: { formData: any; userEmail: string }) => {
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
      const response = await authenticatedFetch('/api/payout-accounts', {
        method: 'GET',
      });
      
      if (!response.ok) {
        throw new Error('Failed to load accounts');
      }
      
      const result = await response.json();
      return Array.isArray(result?.data) ? result.data : [];
    } catch (error) {
      console.error('Error loading accounts:', error);
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
      throw new Error(result?.error || "No se pudo guardar la cuenta. Intentá más tarde.");
    }
  } catch (error) {
    console.error("Error saving account:", error);
    throw error;
  }
};

  return {
    uploadFile,
    submitWithdrawal,
    loadAccounts,
    saveAccount,
  };
};