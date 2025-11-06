import React from 'react';
import { Eye, EyeOff, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DepositFieldProps {
  label: string;
  value: string;
  maskable?: boolean;
  copyable?: boolean;
  className?: string;
}

export function DepositField({ 
  label, 
  value, 
  maskable = false, 
  copyable = true,
  className = ""
}: DepositFieldProps) {
  const [isVisible, setIsVisible] = React.useState(!maskable);
  const [justCopied, setJustCopied] = React.useState(false);

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setJustCopied(true);
      setTimeout(() => setJustCopied(false), 2000);
    } catch (err) {
      console.error('Error copying to clipboard:', err);
    }
  };

  const displayValue = maskable && !isVisible 
    ? '••••••••••••••••' 
    : value;

  return (
    <div className={`border rounded-lg p-3 bg-card ${className}`}>
      <div className="flex justify-between items-start mb-1">
        <label className="text-sm font-medium text-muted-foreground">
          {label}
        </label>
        <div className="flex gap-1">
          {maskable && (
            <Button
              onClick={toggleVisibility}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              type="button"
            >
              {isVisible ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            </Button>
          )}
          {copyable && value && (
            <Button
              onClick={() => copyToClipboard(value)}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              type="button"
              title={justCopied ? "¡Copiado!" : "Copiar"}
            >
              {justCopied ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
            </Button>
          )}
        </div>
      </div>
      <p className={`font-mono text-sm break-all ${
        maskable && !isVisible ? 'select-none' : ''
      }`}>
        {displayValue || 'No disponible'}
      </p>
    </div>
  );
}