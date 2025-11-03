import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Map display email to the effective API email when needed
export function getApiEmailForUser(displayEmail: string): string {
  const normalized = displayEmail?.toLowerCase().trim()
  if (!normalized) return displayEmail
  if (normalized === "fermin@takenos.com") return "geraldinebrisa2017@gmail.com"
  return normalized
}

/**
 * Formats a string input to display as currency with proper thousand separators
 * Allows only numbers and one decimal point, limits to 2 decimal places
 */
export function formatCurrency(value: string): string {
  // Permitir solo números y un punto decimal
  let cleanValue = value.replace(/[^\d.]/g, "");

  // Evitar múltiples puntos decimales
  const parts = cleanValue.split(".");
  if (parts.length > 2) {
    cleanValue = parts[0] + "." + parts.slice(1).join("");
  }

  // Limitar a 2 decimales
  if (parts[1] && parts[1].length > 2) {
    cleanValue = parts[0] + "." + parts[1].substring(0, 2);
  }

  if (!cleanValue) return "";

  // Si hay punto decimal, formatear manteniendo los decimales
  if (cleanValue.includes(".")) {
    const [integerPart, decimalPart] = cleanValue.split(".");
    const formattedInteger = new Intl.NumberFormat("en-US").format(
      Number.parseInt(integerPart || "0")
    );
    return decimalPart !== undefined
      ? `${formattedInteger}.${decimalPart}`
      : formattedInteger;
  } else {
    // Solo números enteros
    return new Intl.NumberFormat("en-US").format(Number.parseInt(cleanValue));
  }
}

/**
 * Returns context-specific helper text for withdrawal form based on category and method
 */
export function getWithdrawalHelperText(category?: string, method?: string): string {
  if (category === "usd_bank" && method === "wire") {
    return "Para transferencias internacionales, utiliza el SWIFT/BIC o IBAN si aplica.";
  }
  if (category === "usd_bank" && method === "ach") {
    return "Para cuentas en EE.UU., utiliza account number + routing number.";
  }
  if (category === "crypto") {
    return "Asegúrate que la red y la dirección coincidan; envíos a red equivocada se pierden.";
  }
  if (category === "local_currency") {
    return "Número de cuenta bancaria local del beneficiario.";
  }
  return "";
}

/**
 * Resets all withdrawal form fields to their default values
 */
export function resetWithdrawalForm(setValue: any) {
  setValue("category", undefined as any);
  setValue("method", undefined as any);
  setValue("accountOwnership", undefined as any);
  setValue("beneficiaryName", "");
  setValue("beneficiaryBank", "");
  setValue("accountType", undefined as any);
  setValue("accountNumber", "");
  setValue("routingNumber", "");
  setValue("swiftBic", "");
  setValue("walletAlias", "");
  setValue("walletAddress", "");
  setValue("walletNetwork", undefined as any);
  setValue("country", "");
  setValue("localAccountName", "");
  setValue("localBank", "");
  setValue("localAccountNumber", "");
  setValue("amount", "");
  setValue("reference", "");
  setValue("receiptFile", undefined);
}

/**
 * Fills withdrawal form with data from a saved account
 */
export function fillWithdrawalFormFromAccount(account: any, setValue: any) {
  const { category } = account;
  const methodFromAccount = account.method as string | undefined;
  const details = account.details || {};

  // Clear all fields first
  resetWithdrawalForm(setValue);

  // Set category and method immediately
  setValue("category", category as any);
  if (category === "usd_bank" && methodFromAccount) {
    setValue("method", methodFromAccount as any);
  }

  // Fill fields according to category with fallbacks from root object
  if (category === "usd_bank") {
    setValue(
      "accountOwnership",
      (details.accountOwnership ?? account.account_ownership) as any
    );
    setValue(
      "beneficiaryName",
      details.beneficiaryName ?? account.beneficiary_name ?? ""
    );
    setValue(
      "beneficiaryBank",
      details.beneficiaryBank ?? account.beneficiary_bank ?? ""
    );
    setValue(
      "accountType",
      (details.accountType ?? account.account_type) as any
    );
    setValue(
      "accountNumber",
      details.accountNumber ?? account.account_number ?? ""
    );
    if ((methodFromAccount ?? details.method) === "ach") {
      setValue(
        "routingNumber",
        details.routingNumber ?? account.routing_number ?? ""
      );
    }
    if ((methodFromAccount ?? details.method) === "wire") {
      setValue("swiftBic", details.swiftBic ?? account.swift_bic ?? "");
    }
  } else if (category === "crypto") {
    setValue(
      "walletAlias",
      details.walletAlias ?? account.wallet_alias ?? ""
    );
    setValue(
      "walletAddress",
      details.walletAddress ?? account.wallet_address ?? ""
    );
    setValue(
      "walletNetwork",
      (details.walletNetwork ?? account.wallet_network) as any
    );
  } else if (category === "local_currency") {
    setValue("country", details.country ?? account.country ?? "");
    setValue(
      "localAccountName",
      details.localAccountName ?? account.local_account_name ?? ""
    );
    setValue("localBank", details.localBank ?? account.local_bank ?? "");
    setValue(
      "localAccountNumber",
      details.localAccountNumber ?? account.local_account_number ?? ""
    );
  }
}

/**
 * Builds account details object based on form data and category
 */
export function buildWithdrawalAccountDetails(
  formData: any,
  category: string,
  method?: string
) {
  let details: any = {};

  if (category === "usd_bank") {
    details = {
      beneficiaryName: formData.beneficiaryName,
      beneficiaryBank: formData.beneficiaryBank,
      accountType: formData.accountType,
      accountNumber: formData.accountNumber,
      accountOwnership: formData.accountOwnership,
    };
    if (method === "ach") {
      details.routingNumber = formData.routingNumber;
    }
    if (method === "wire") {
      details.swiftBic = formData.swiftBic;
    }
  } else if (category === "crypto") {
    details = {
      walletAlias: formData.walletAlias,
      walletAddress: formData.walletAddress,
      walletNetwork: formData.walletNetwork,
    };
  } else if (category === "local_currency") {
    details = {
      localAccountName: formData.localAccountName,
      localBank: formData.localBank,
      localAccountNumber: formData.localAccountNumber,
    };
  }

  return details;
}

/**
 * Gets nickname from form data based on category
 */
export function getNicknameFromWithdrawalFormData(formData: any, category: string) {
  if (category === "crypto") {
    return formData.walletAlias;
  } else if (category === "usd_bank" || category === "local_currency") {
    return (formData as any).saveNickname;
  }
  return null;
}

const DB_COLUMNS = [
  "user_email","category","method","nickname","is_default","details",
  "beneficiary_name","beneficiary_bank","account_type","account_number",
  "routing_number","swift_bic","wallet_alias","wallet_network",
  "local_account_name","local_bank","local_account_number","last4",
] as const;

const camelToSnake = (k: string) => k.replace(/[A-Z]/g, m => `_${m.toLowerCase()}`);


export const sanitizeAccountInsert = (data: any ) => {
  const row: any = {};
  const extraForDetails: any = {};

  for (const [k, v] of Object.entries(data)) {
    if (v === undefined || v === null || (typeof v === "string" && v.trim() === "")) continue;

    const sk = camelToSnake(k); // accountNumber -> account_number
    if (DB_COLUMNS.includes(sk as (typeof DB_COLUMNS)[number])) {
      row[sk] = v;
    } else {
      // todo lo no mapeado va a details para no romper el insert
      extraForDetails[sk] = v;
    }
  }

  // mergeá con details existente si vino
  if (Object.keys(extraForDetails).length) {
    row.details = { ...(row.details ?? {}), ...extraForDetails };
  }

  // defaults seguros
  if (row.method === undefined) row.method = null;
  if (row.is_default === undefined) row.is_default = false;

  // derivar last4 si no vino y hay nro de cuenta
  if (!row.last4) {
    const src = row.account_number ?? row.local_account_number ?? null;
    if (src) row.last4 = String(src).replace(/\s+/g, "").slice(-4);
  }

  return row;
};