import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  useExternalAccountsRepository,
  type CreateExternalAccountPayload,
  type ExternalAccountRail,
} from "./repository";

/**
 * Hook para cargar todas las cuentas externas de la empresa
 * Opcionalmente filtrado por rail
 */
export const useExternalAccountsQuery = (
  rail?: ExternalAccountRail,
  enabled: boolean = true
) => {
  const repository = useExternalAccountsRepository();

  return useQuery({
    queryKey: ["external-accounts", rail ?? "all"],
    queryFn: () => repository.loadExternalAccounts(rail),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });
};

/**
 * Hook para cargar una cuenta externa específica por ID
 */
export const useExternalAccountQuery = (
  id: string | undefined,
  enabled: boolean = true
) => {
  const repository = useExternalAccountsRepository();

  return useQuery({
    queryKey: ["external-account", id],
    queryFn: () => repository.loadExternalAccountById(id!),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook para crear una nueva cuenta externa
 */
export const useCreateExternalAccountMutation = () => {
  const repository = useExternalAccountsRepository();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateExternalAccountPayload) =>
      repository.createExternalAccount(payload),
    onSuccess: (result) => {
      if (result.ok) {
        toast({
          title: "Cuenta creada",
          description: "La cuenta externa fue creada correctamente.",
        });

        // Invalidar queries para refrescar la lista
        queryClient.invalidateQueries({ queryKey: ["external-accounts"] });
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudo crear la cuenta.",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error al crear cuenta",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

/**
 * Hook para actualizar una cuenta externa
 */
export const useUpdateExternalAccountMutation = () => {
  const repository = useExternalAccountsRepository();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<CreateExternalAccountPayload>;
    }) => repository.updateExternalAccount(id, updates),
    onSuccess: (result, variables) => {
      if (result.ok) {
        toast({
          title: "Cuenta actualizada",
          description: "Los cambios fueron guardados correctamente.",
        });

        // Invalidar queries específicas
        queryClient.invalidateQueries({ queryKey: ["external-accounts"] });
        queryClient.invalidateQueries({
          queryKey: ["external-account", variables.id],
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudo actualizar la cuenta.",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error al actualizar",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

/**
 * Hook para eliminar una cuenta externa
 */
export const useDeleteExternalAccountMutation = () => {
  const repository = useExternalAccountsRepository();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => repository.deleteExternalAccount(id),
    onSuccess: (result) => {
      if (result.ok) {
        toast({
          title: "Cuenta eliminada",
          description: "La cuenta fue eliminada correctamente.",
        });

        // Invalidar queries
        queryClient.invalidateQueries({ queryKey: ["external-accounts"] });
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudo eliminar la cuenta.",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error al eliminar",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useExternalAccountDetailQuery = (
  id?: string,
  enabled: boolean = true
) => {
  const repository = useExternalAccountsRepository();
  const { toast } = useToast();

  return useQuery({
    queryKey: ["external-account-detail", id],
    enabled: enabled && !!id,
    retry: 1,
    queryFn: async () => {
      if (!id) {
        throw new Error("Missing external account id");
      }

      const data = await repository.loadExternalAccountById(id);

      if (!data) {
        throw new Error("No se encontró la cuenta externa");
      }

      return data;
    },
  });
};
