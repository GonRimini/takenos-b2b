export type ExternalAccountRail = "ach" | "swift" | "crypto" | "local";

export interface ExternalAccountACH {
  account_number: string;
  routing_number: string;
  receiver_bank: string;
  beneficiary_bank_address?: string;
  beneficiary_name: string;
  account_type: "checking" | "savings";
}

export interface ExternalAccountSWIFT {
  swift_bic: string;
  account_number: string;
  receiver_bank: string;
  beneficiary_bank_address?: string;
  beneficiary_name: string;
  account_type: "checking" | "savings";
}

export interface ExternalAccountCrypto {
  wallet_address: string;
  wallet_network: string;
}

export interface ExternalAccountLocal {
  country_code: string;
  bank_name: string;
  identifier_primary: string;
  identifier_secondary?: string;
  identifier_primary_type: string;
  identifier_secondary_type?: string;
  holder_id: string;
  account_number?: string;
  beneficiary_name: string;
}

export interface CreateExternalAccountPayload {
  nickname: string;
  currency_code: string;
  rail: ExternalAccountRail;
  beneficiary_url: string;
  is_default?: boolean;
  
  // Solo uno de estos debe estar presente según el rail
  ach?: ExternalAccountACH;
  swift?: ExternalAccountSWIFT;
  crypto?: ExternalAccountCrypto;
  local?: ExternalAccountLocal;
}

export interface ExternalAccount {
  id: string;
  company_id: string;
  nickname: string;
  currency_code: string;
  rail: ExternalAccountRail;
  status: string;
  beneficiary_url: string;
  is_default: boolean;
  created_at: string;
  
  // Datos específicos del rail (uno de estos estará presente)
  ach?: ExternalAccountACH & { id: string };
  swift?: ExternalAccountSWIFT & { id: string };
  crypto?: ExternalAccountCrypto & { id: string };
  local?: ExternalAccountLocal & { id: string };
}