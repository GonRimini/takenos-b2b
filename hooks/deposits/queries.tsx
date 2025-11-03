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