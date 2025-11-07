import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth';
import { useDepositsRepository } from './repository';

// Hook para cargar cuentas guardadas
type DepositMethod = 'ach' | 'swift' | 'crypto' | 'local';

export const useLoadDepositAccountsQuery = (
  method: DepositMethod | undefined,
  enabled: boolean,
  userEmail?: string
) => {
  const repository = useDepositsRepository();

  return useQuery({
    queryKey: ['deposit-accounts', method, userEmail ?? null],
    queryFn: () => repository.loadDepositAccounts(method!, userEmail),
    enabled: enabled && !!method,
    staleTime: 5 * 60 * 1000,
  });
};

export const useSaveAccountMutation = () => {
  const repository = useDepositsRepository();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: repository.saveAccount,
    onSuccess: () => {
      toast({
        title: "Cuenta guardada",
        description: "La cuenta fue guardada correctamente para futuros depósitos.",
      });
      // Invalidate accounts query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['deposits-accounts'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al guardar cuenta",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useSubmitDepositMutation = () => {
  const { toast } = useToast();
  const repository = useDepositsRepository();

  return useMutation<any, Error, { formData: any; userEmail: string }>({
    mutationFn: async ({ formData, userEmail }) => {
      return repository.submitDeposit({ formData, userEmail });
    },
    onSuccess: () => {
      toast({
        title: "Solicitud enviada",
        description: "Te contactaremos por email para confirmar tu depósito.",
      });
    },
    onError: (error) => {
      console.error("Error submitting deposit:", error);
      toast({
        title: "Error",
        description: error.message || "Hubo un problema al informar tu depósito. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });
};

export const useWhitelistedDepositAccountsQuery = (
  userEmail: string | undefined,
  enabled: boolean
) => {
  const repository = useDepositsRepository();

  return useQuery({
    queryKey: ['whitelisted-deposit-accounts', userEmail ?? null],
    queryFn: () => repository.loadWhitelistedDepositAccounts(userEmail!),
    enabled: enabled && !!userEmail,
    staleTime: 5 * 60 * 1000,
  });
};

// Nuevas queries para instrucciones de depósito
export const useDepositInstructionsQuery = (
  method: DepositMethod,
  userEmail: string | undefined,
  enabled: boolean = true
) => {
  const repository = useDepositsRepository();

  return useQuery({
    queryKey: ['deposit-instructions', method, userEmail ?? null],
    queryFn: () => repository.loadDepositInstructions(method, userEmail!),
    enabled: enabled && !!userEmail && !!method,
    staleTime: 10 * 60 * 1000, // Cache por 10 minutos
    gcTime: 30 * 60 * 1000, // Mantener en cache 30 minutos
    retry: 2,
    refetchOnWindowFocus: false, // No refetch al cambiar tabs del browser
  });
};

/**
 * Hook provisional para determinar si un usuario es boliviano
 * Busca en las cuentas locales del usuario si alguna tiene banco = "CIDRE IFD"
 * Esto es temporal hasta que la tabla user tenga el campo nacionalidad
 */
export const useIsBolivianQuery = (
  userEmail: string | undefined,
  enabled: boolean = true
) => {
  const repository = useDepositsRepository();

  return useQuery({
    queryKey: ['is-bolivian', userEmail ?? null],
    queryFn: () => repository.checkIsBolivian(userEmail!),
    enabled: enabled && !!userEmail,
    staleTime: 30 * 60 * 1000, // Cache por 30 minutos (relativamente estable)
    gcTime: 60 * 60 * 1000, // Mantener en cache 1 hora
    retry: 1,
    refetchOnWindowFocus: false,
  });
};