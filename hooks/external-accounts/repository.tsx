import { useAuthenticatedFetch } from "@/hooks/use-authenticated-fetch";
import type { CreateExternalAccountPayload, ExternalAccount, ExternalAccountRail } from "@/types/external-accounts-types";

export const useExternalAccountsRepository = () => {
  const { authenticatedFetch } = useAuthenticatedFetch();

  const createExternalAccount = async (
    payload: CreateExternalAccountPayload
  ): Promise<{ ok: boolean; data?: ExternalAccount; error?: string }> => {
    try {
      const response = await authenticatedFetch("/api/external-accounts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result?.ok) {
        throw new Error(result?.error || "Failed to create external account");
      }

      return {
        ok: true,
        data: result.data,
      };
    } catch (error) {
      console.error("Error creating external account:", error);
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  };

  const loadExternalAccounts = async (
    rail?: ExternalAccountRail
  ): Promise<ExternalAccount[]> => {
    try {
      const params = new URLSearchParams();
      if (rail) params.set("rail", rail);

      const response = await authenticatedFetch(
        `/api/external-accounts?${params.toString()}`,
        {
          method: "GET",
        }
      );

      const result = await response.json();

      if (!response.ok || !result?.ok) {
        throw new Error(result?.error || "Failed to load external accounts");
      }

      return Array.isArray(result.data) ? result.data : [];
    } catch (error) {
      console.error("Error loading external accounts:", error);
      return [];
    }
  };

  /**
   * Obtener una cuenta externa específica por ID
   */
  const loadExternalAccountById = async (
    id: string
  ): Promise<ExternalAccount | null> => {
    try {
      const response = await authenticatedFetch(
        `/api/external-accounts/${id}`,
        {
          method: "GET",
        }
      );

      const result = await response.json();

      if (!response.ok || !result?.ok) {
        throw new Error(result?.error || "Failed to load external account");
      }

      return result.data || null;
    } catch (error) {
      console.error("Error loading external account:", error);
      return null;
    }
  };

  /**
   * Actualizar una cuenta externa
   */
  const updateExternalAccount = async (
    id: string,
    updates: Partial<CreateExternalAccountPayload>
  ): Promise<{ ok: boolean; error?: string }> => {
    try {
      const response = await authenticatedFetch(
        `/api/external-accounts/${id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updates),
        }
      );

      const result = await response.json();

      if (!response.ok || !result?.ok) {
        throw new Error(result?.error || "Failed to update external account");
      }

      return { ok: true };
    } catch (error) {
      console.error("Error updating external account:", error);
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  };

  /**
   * Eliminar una cuenta externa (soft delete cambiando status)
   */
  const deleteExternalAccount = async (
    id: string
  ): Promise<{ ok: boolean; error?: string }> => {
    try {
      const response = await authenticatedFetch(
        `/api/external-accounts/${id}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (!response.ok || !result?.ok) {
        throw new Error(result?.error || "Failed to delete external account");
      }

      return { ok: true };
    } catch (error) {
      console.error("Error deleting external account:", error);
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  };

  return {
    createExternalAccount,
    loadExternalAccounts,
    loadExternalAccountById,
    updateExternalAccount,
    deleteExternalAccount,
  };
};
