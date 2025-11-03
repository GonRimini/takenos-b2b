/**
 * Types and interfaces for deposit operations
 */

export interface DepositConfirmationParams {
  userEmail: string;
  externalAccount: any;
  destinationAccount: any;
  file: File | null;
  onSuccess?: () => void;
}

export interface DepositRequestInsert {
  user_email: string;
  file_url: string | null;
  date: string; // ISO format
  deposit_account_id: string;
  payout_account_id: string;
}