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
  className = ""
}: DepositMethodFieldsProps) {
  if (!data) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No hay datos disponibles para este método
      </div>
    );
  }

  // Extraer los datos específicos del rail (ach, swift, crypto, local)
  const railData = data[method];
 console.log('FULL DATA:', JSON.stringify(data, null, 2));
console.log('METHOD:', method);
console.log('RAIL DATA:', JSON.stringify(railData, null, 2));
  
  if (!railData) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No hay información de {method} disponible
      </div>
    );
  }

  const fieldConfig = DEPOSIT_FIELD_CONFIGS[method];
  
  return (
    <div className={`grid gap-4 ${className}`}>
      {/* Renderizar campos dinámicamente */}
      <div className="grid gap-3 md:grid-cols-2">
        {fieldConfig.map((field) => {
          const value = getFieldValue(railData, field.key);
          
         console.log(`Buscando ${field.key} en railData, encontré:`, value);
          
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