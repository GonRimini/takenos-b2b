/**
 * Types for deposit receipt PDF components
 */

import { DepositReceiptData } from "./DepositReceiptPDF";

// Re-export para facilitar el uso
export type { DepositReceiptData };

// Tipos adicionales para uso en el contexto de depósitos
export interface DepositReceiptContext {
  depositData: DepositReceiptData;
  userContext: {
    companyName?: string;
    userEmail?: string;
  };
}

// Ejemplo de cómo mapear datos de API a DepositReceiptData
export function mapApiDepositToReceiptData(
  apiDeposit: any,
  userContext: { companyName?: string; userEmail?: string }
): DepositReceiptData {
  return {
    id: apiDeposit.id || apiDeposit.deposit_id || '',
    account_ref: apiDeposit.account_ref || apiDeposit.account_reference || '',
    amount: Number(apiDeposit.amount) || 0,
    description: apiDeposit.description || apiDeposit.concept || 'Depósito',
    date: apiDeposit.date || apiDeposit.created_at || new Date().toISOString(),
    companyName: userContext.companyName,
    userEmail: userContext.userEmail,
  };
}