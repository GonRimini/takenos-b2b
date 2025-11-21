import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth';
import { useWithdrawalRepository } from './repository';
import { getUserEmail } from '@/lib/user-helpers';
import { CreateWithdrawalRequestPayload } from './repository';

// Hook para subir archivos
interface FileUploadParams {
  file: File;
  userEmail?: string;
}

interface FileUploadResult {
  publicUrl: string;
  filePath: string;
}

export const useFileUploadMutation = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const repository = useWithdrawalRepository();

  return useMutation<FileUploadResult, Error, FileUploadParams>({
    mutationFn: async ({ file, userEmail: providedEmail }) => {
      const userEmail = providedEmail || getUserEmail(user);
      
      if (!userEmail) {
        throw new Error("No se pudo obtener el email del usuario");
      }

      return repository.uploadFile(file, userEmail);
    },
    onError: (error) => {
      console.error("Error during file upload:", error);
      toast({
        title: "Error",
        description: error.message || "Error al subir el comprobante PDF",
        variant: "destructive"
      });
    },
    onSuccess: (data) => {
      console.log("File uploaded successfully:", data.publicUrl);
    }
  });
};

// Hook para cargar cuentas guardadas
export const useLoadAccountsQuery = (enabled: boolean) => {
  const repository = useWithdrawalRepository();
  
  return useQuery({
    queryKey: ['withdrawal-accounts'],
    queryFn: repository.loadAccounts,
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useSaveAccountMutation = () => {
  const repository = useWithdrawalRepository();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: repository.saveAccount,
    onSuccess: () => {
      toast({
        title: "Cuenta guardada",
        description: "La cuenta fue guardada correctamente para futuros retiros.",
      });
      // Invalidate accounts query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['withdrawal-accounts'] });
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

// Hook para enviar solicitud de retiro
interface SubmitWithdrawalParams {
  formData: any;
  userEmail: string;
}

export const useSubmitWithdrawalMutation = () => {
  const { toast } = useToast();
  const repository = useWithdrawalRepository();

  return useMutation<any, Error, SubmitWithdrawalParams>({
    mutationFn: async ({ formData, userEmail }) => {
      return repository.submitWithdrawal({ formData, userEmail });
    },
    onSuccess: () => {
      toast({
        title: "Solicitud enviada",
        description: "Te contactaremos por email para confirmar tu retiro.",
      });
    },
    onError: (error) => {
      console.error("Error submitting withdrawal:", error);
      toast({
        title: "Error",
        description: error.message || "Hubo un problema al enviar tu solicitud. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });
};

export const useCreateWithdrawalRequestMutation = () => {
  const { toast } = useToast();
  const repository = useWithdrawalRepository();

  return useMutation({
    mutationFn: (payload: CreateWithdrawalRequestPayload) =>
      repository.createWithdrawalRequest(payload),
    onSuccess: (result) => {
      if (result.ok) {
        toast({
          title: "Solicitud enviada",
          description: "Te contactaremos por email para confirmar tu retiro.",
        });
      } else {
        toast({
          title: "Error",
          description:
            result.error || "No se pudo enviar la solicitud de retiro.",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      console.error("Error submitting withdrawal:", error);
      toast({
        title: "Error",
        description:
          error.message ||
          "Hubo un problema al enviar tu solicitud. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });
};

export const useWithdrawalDetailByExternalIdQuery = (
  externalId: string | null,
  enabled: boolean = true
) => {
  const repo = useWithdrawalRepository();

  return useQuery({
    queryKey: ["withdrawal-detail-by-external-id", externalId],
    queryFn: () => {
      if (!externalId) {
        throw new Error("Missing externalId");
      }
      return repo.loadWithdrawalDetailByExternalId(externalId);
    },
    enabled: enabled && !!externalId,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  });
};