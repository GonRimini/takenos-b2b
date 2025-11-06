import React from 'react';
import { DepositField } from './DepositField';
import { DEPOSIT_FIELD_CONFIGS, getFieldValue } from '@/lib/deposit-field-configs';
type DepositMethod = "ach" | "swift" | "crypto" | "local";

interface DepositMethodFieldsProps {
  method: DepositMethod;
  data: any;
  selectedCryptoWallet?: number;
  onSelectCryptoWallet?: (index: number) => void;
  className?: string;
}

export function DepositMethodFields({ 
  method, 
  data, 
  selectedCryptoWallet = 0,
  onSelectCryptoWallet,
  className = ""
}: DepositMethodFieldsProps) {
  if (!data) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No hay datos disponibles para este método
      </div>
    );
  }

  // Para crypto, usar el wallet seleccionado
  const displayData = method === 'crypto' && Array.isArray(data) 
    ? data[selectedCryptoWallet] || data[0]
    : data;

  if (!displayData) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No hay datos disponibles
      </div>
    );
  }

  const fieldConfig = DEPOSIT_FIELD_CONFIGS[method];
  
  return (
    <div className={`grid gap-4 ${className}`}>
      {/* Para crypto, mostrar selector de wallet si hay múltiples */}
      {method === 'crypto' && Array.isArray(data) && data.length > 1 && (
        <div className="mb-4">
          <label className="text-sm font-medium text-muted-foreground mb-2 block">
            Wallet disponibles ({data.length})
          </label>
          <select 
            value={selectedCryptoWallet} 
            onChange={(e) => {
              onSelectCryptoWallet?.(Number(e.target.value));
            }}
            className="w-full p-2 border rounded-md"
          >
            {data.map((wallet, index) => (
              <option key={index} value={index}>
                {wallet.title || `Wallet ${index + 1}`} - {wallet.network}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Renderizar campos dinámicamente */}
      <div className="grid gap-3 md:grid-cols-2">
        {fieldConfig.map((field) => {
          const value = getFieldValue(displayData, field.key);
          
          // No mostrar campos vacíos
          if (!value) return null;

          return (
            <DepositField
              key={field.key}
              label={field.label}
              value={value}
              maskable={field.maskable}
              copyable={field.copyable}
            />
          );
        })}
      </div>
    </div>
  );
}