// Helper functions para el componente de withdrawals

/**
 * Obtiene el texto de ayuda según la categoría y método de retiro seleccionados
 */
export const getWithdrawalHelperText = (
  category?: string, 
  method?: string
): string => {
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
};

/**
 * Formatea un valor de moneda eliminando caracteres no válidos y limitando decimales
 */
export const formatCurrencyValue = (value: string): string => {
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
    return decimalPart !== undefined ? `${formattedInteger}.${decimalPart}` : formattedInteger;
  } else {
    // Solo números enteros
    return new Intl.NumberFormat("en-US").format(Number.parseInt(cleanValue));
  }
};

/**
 * Obtiene el email del usuario desde localStorage o el objeto user
 */
export const getUserEmailFromStorage = (user?: any): string | null => {
  try {
    const storedUser = localStorage.getItem("takenos_user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      return parsedUser.email;
    }
  } catch (e) {
    console.error("Error reading from localStorage:", e);
  }

  return user?.email || null;
};

/**
 * Rellena el formulario con los datos de una cuenta guardada
 */
export const fillFormFromAccount = (account: any, setValue: any) => {
  const { category } = account;
  const methodFromAccount = account.method as string | undefined;
  const details = account.details || {};

  // Limpiar todos los campos primero
  setValue("category", undefined);
  setValue("method", undefined);
  setValue("accountOwnership", undefined);
  setValue("beneficiaryName", "");
  setValue("beneficiaryBank", "");
  setValue("accountType", undefined);
  setValue("accountNumber", "");
  setValue("routingNumber", "");
  setValue("swiftBic", "");
  setValue("walletAlias", "");
  setValue("walletAddress", "");
  setValue("walletNetwork", undefined);
  setValue("country", "");
  setValue("localAccountName", "");
  setValue("localBank", "");
  setValue("localAccountNumber", "");

  // Establecer categoría y método inmediatamente
  setValue("category", category);
  if (category === "usd_bank" && methodFromAccount) {
    setValue("method", methodFromAccount);
  }

  // Rellenar campos según la categoría con fallbacks desde el objeto raíz
  if (category === "usd_bank") {
    setValue("accountOwnership", details.accountOwnership ?? account.account_ownership);
    setValue("beneficiaryName", details.beneficiaryName ?? account.beneficiary_name ?? "");
    setValue("beneficiaryBank", details.beneficiaryBank ?? account.beneficiary_bank ?? "");
    setValue("accountType", details.accountType ?? account.account_type);
    setValue("accountNumber", details.accountNumber ?? account.account_number ?? "");
    
    if ((methodFromAccount ?? details.method) === "ach") {
      setValue("routingNumber", details.routingNumber ?? account.routing_number ?? "");
    }
    if ((methodFromAccount ?? details.method) === "wire") {
      setValue("swiftBic", details.swiftBic ?? account.swift_bic ?? "");
    }
  } else if (category === "crypto") {
    setValue("walletAlias", details.walletAlias ?? account.wallet_alias ?? "");
    setValue("walletAddress", details.walletAddress ?? account.wallet_address ?? "");
    setValue("walletNetwork", details.walletNetwork ?? account.wallet_network);
  } else if (category === "local_currency") {
    setValue("country", details.country ?? account.country ?? "");
    setValue("localAccountName", details.localAccountName ?? account.local_account_name ?? "");
    setValue("localBank", details.localBank ?? account.local_bank ?? "");
    setValue("localAccountNumber", details.localAccountNumber ?? account.local_account_number ?? "");
  }
};

/**
 * Resetea todos los campos del formulario de withdrawal
 */
export const resetWithdrawalForm = (setValue: any, setters?: {
  setUsedSavedAccount?: (value: boolean) => void;
  setSelectedFile?: (value: File | null) => void;
  setUploadedFileUrl?: (value: string | null) => void;
}) => {
  setValue("category", undefined);
  setValue("method", undefined);
  setValue("accountOwnership", undefined);
  setValue("beneficiaryName", "");
  setValue("beneficiaryBank", "");
  setValue("accountType", undefined);
  setValue("accountNumber", "");
  setValue("routingNumber", "");
  setValue("swiftBic", "");
  setValue("walletAlias", "");
  setValue("walletAddress", "");
  setValue("walletNetwork", undefined);
  setValue("country", "");
  setValue("localAccountName", "");
  setValue("localBank", "");
  setValue("localAccountNumber", "");
  setValue("amount", "");
  setValue("reference", "");
  setValue("receiptFile", undefined);
  
  // Ejecutar setters opcionales
  if (setters?.setUsedSavedAccount) setters.setUsedSavedAccount(false);
  if (setters?.setSelectedFile) setters.setSelectedFile(null);
  if (setters?.setUploadedFileUrl) setters.setUploadedFileUrl(null);
};

/**
 * Valida los datos básicos para guardar una cuenta
 */
export const validateAccountData = (formData: any) => {
  const { category, method } = formData;

  // Validar que tengamos datos básicos
  if (!category) {
    return {
      isValid: false,
      error: {
        title: "Selecciona una categoría",
        description: "Primero completa la información básica de la cuenta"
      }
    };
  }

  // Validar que tengamos un alias/apodo según la categoría
  let nickname = null;
  if (category === "crypto") {
    if (!formData.walletAlias) {
      return {
        isValid: false,
        error: {
          title: "Apodo requerido",
          description: "Para guardar una cuenta crypto, debes completar el 'Apodo de la billetera'"
        }
      };
    }
    nickname = formData.walletAlias;
  } else if (category === "usd_bank") {
    if (!formData.saveNickname) {
      return {
        isValid: false,
        error: {
          title: "Alias requerido",
          description: "Para guardar una cuenta bancaria, debes agregar un alias"
        }
      };
    }
    nickname = formData.saveNickname;
  } else if (category === "local_currency") {
    if (!formData.saveNickname) {
      return {
        isValid: false,
        error: {
          title: "Alias requerido",
          description: "Para guardar una cuenta local, debes agregar un alias"
        }
      };
    }
    nickname = formData.saveNickname;
  }

  return { isValid: true, nickname };
};

/**
 * Construye los detalles de la cuenta según la categoría
 */
export const buildAccountDetails = (formData: any) => {
  const { category, method } = formData;
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
};