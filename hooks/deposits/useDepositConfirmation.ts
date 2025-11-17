// import { useSubmitDepositMutation } from "@/hooks/deposits/queries";
// import { useDepositsRepository } from "@/hooks/deposits/repository";
// import { useDepositNotification } from "@/hooks/notifications/useDepositNotification";
// import { getId } from "@/utils/id-helpers";
// import type { DepositConfirmationParams, DepositRequestInsert } from "@/types/deposit-types";

// export const useDepositConfirmation = () => {
//   const { mutateAsync, isPending } = useSubmitDepositMutation();
//   const repo = useDepositsRepository();
//   const { sendDepositNotification } = useDepositNotification();

//   const confirmDeposit = async ({
//     userEmail,
//     externalAccount,
//     destinationAccount,
//     file,
//     onSuccess
//   }: DepositConfirmationParams): Promise<void> => {
//     if (!userEmail) return;

//     // Subir archivo (opcional)
//     let fileUrl: string | null = null;
//     if (file) {
//       const uploaded = await repo.uploadFile(file, userEmail);
//       fileUrl = uploaded?.publicUrl ?? null;
//     }

//     const depositAccountId = getId(externalAccount);
//     const payoutAccountId = getId(destinationAccount);
    
//     if (!depositAccountId || !payoutAccountId) {
//       console.error("Faltan IDs: deposit_account_id o payout_account_id");
//       return;
//     }

//     const formData: DepositRequestInsert = {
//       user_email: userEmail,
//       file_url: fileUrl,
//       date: new Date().toISOString(),
//       deposit_account_id: String(depositAccountId),
//       payout_account_id: String(payoutAccountId),
//     };
    
//     // Enviar deposit request
//     await mutateAsync({ formData, userEmail });

//     // Enviar notificación después del éxito
//     if (fileUrl) {
//       await sendDepositNotification({
//         userEmail,
//         fileName: file?.name || "comprobante_deposito.pdf",
//         fileUrl
//       });
//     }

//     // Ejecutar callback de éxito
//     onSuccess?.();
//   };

//   return {
//     confirmDeposit,
//     isLoading: isPending
//   };
// };