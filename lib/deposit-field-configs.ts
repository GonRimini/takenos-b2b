import type { 
  DepositoACH, 
  DepositoSWIFT, 
  DepositoCrypto, 
  DepositoLocal 
} from '@/lib/depositos';

// Configuración de campos por método de depósito
export interface FieldConfig {
  key: string;
  label: string;
  maskable?: boolean;
  copyable?: boolean;
  transform?: (value: any) => string;
}

export const DEPOSIT_FIELD_CONFIGS = {
  ach: [
    { key: 'routing_number', label: 'Routing Number', copyable: true },
    { key: 'account_number', label: 'Número de cuenta', maskable: true, copyable: true },
    { key: 'beneficiary_name', label: 'Nombre del beneficiario', copyable: true },
    { key: 'receiver_bank', label: 'Banco receptor', copyable: true },
    { key: 'account_type', label: 'Tipo de cuenta', copyable: false },
    { key: 'beneficiary_address', label: 'Dirección del beneficiario', copyable: true },
    { key: 'beneficiary_bank_address', label: 'Dirección del banco', copyable: true },
  ] as FieldConfig[],

  swift: [
    { key: 'swift_bic_code', label: 'SWIFT/BIC Code', copyable: true },
    { key: 'account_number', label: 'Número de cuenta', maskable: true, copyable: true },
    { key: 'beneficiary_name', label: 'Nombre del beneficiario', copyable: true },
    { key: 'receiver_bank', label: 'Banco receptor', copyable: true },
    { key: 'account_type', label: 'Tipo de cuenta', copyable: false },
    { key: 'beneficiary_address', label: 'Dirección del beneficiario', copyable: true },
    { key: 'beneficiary_bank_address', label: 'Dirección del banco', copyable: true },
  ] as FieldConfig[],

  crypto: [
    { key: 'title', label: 'Wallet', copyable: false },
    { key: 'wallet_address', label: 'Dirección de Billetera', copyable: true },
    { key: 'wallet_network', label: 'Red/Network', copyable: true },
  ] as FieldConfig[],

  local: [
    { key: 'beneficiary_name', label: 'Beneficiario', copyable: true },
    { key: 'bank_name', label: 'Banco', copyable: true },
    { key: 'account_number', label: 'Número de cuenta', maskable: true, copyable: true },
    { key: 'holder_id', label: 'Identificación', copyable: true },
    { key: 'identifier_primary', label: 'CBU', copyable: true },
    { key: 'identifier_secondary', label: 'Alias', copyable: true },
  ] as FieldConfig[],
} as const;

// Función utilitaria para obtener el valor de un campo de forma segura
export function getFieldValue(data: any, fieldKey: string): string {
  if (!data || typeof data !== 'object') return '';
  
  const value = data[fieldKey];
  if (value === null || value === undefined) return '';
  
  return String(value).trim();
}

// Función para generar datos para PDF de forma genérica
export function generatePDFFields(
  method: keyof typeof DEPOSIT_FIELD_CONFIGS, 
  data: any
): { label: string; value: string; maskable?: boolean }[] {
  const config = DEPOSIT_FIELD_CONFIGS[method];
  if (!config || !data) return [];

  return config
    .map(field => ({
      label: field.label,
      value: getFieldValue(data, field.key),
      maskable: field.maskable,
    }))
    .filter(field => field.value); // Solo incluir campos con valor
}

// Función para obtener direcciones (solo para ACH/SWIFT)
export function getPDFAddresses(method: 'ach' | 'swift', data: DepositoACH | DepositoSWIFT | null) {
  if (!data || (method !== 'ach' && method !== 'swift')) return undefined;

  const beneficiaryAddress = getFieldValue(data, 'beneficiary_address');
  const bankAddress = getFieldValue(data, 'beneficiary_bank_address');

  if (!beneficiaryAddress && !bankAddress) return undefined;

  return {
    beneficiary: beneficiaryAddress,
    bank: bankAddress,
  };
}