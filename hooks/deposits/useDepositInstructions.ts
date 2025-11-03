import { useState } from "react";
import {
  getDepositoACH,
  getDepositoSWIFT,
  getDepositosCrypto,
  getDepositoLocal,
  DepositoACH,
  DepositoSWIFT,
  DepositoCrypto,
  DepositoLocal,
} from "@/lib/depositos";
import { downloadDepositInstructions } from "@/lib/pdf-generator";

export type DepositMethod = "ach" | "swift" | "crypto" | "local";

interface DepositInstructionsState {
  achData: DepositoACH | null;
  achLoading: boolean;
  achError: string | null;
  
  swiftData: DepositoSWIFT | null;
  swiftLoading: boolean;
  swiftError: string | null;
  
  cryptoData: DepositoCrypto[];
  cryptoLoading: boolean;
  cryptoError: string | null;
  selectedCryptoWallet: number;
  
  localData: DepositoLocal | null;
  localLoading: boolean;
  localError: string | null;
}

interface PDFData {
  method: string;
  userEmail: string;
  fields: { label: string; value: string; maskable?: boolean }[];
  addresses?: { beneficiary?: string; bank?: string };
}

export function useDepositInstructions(userEmail: string) {
  const [state, setState] = useState<DepositInstructionsState>({
    achData: null,
    achLoading: false,
    achError: null,
    swiftData: null,
    swiftLoading: false,
    swiftError: null,
    cryptoData: [],
    cryptoLoading: false,
    cryptoError: null,
    selectedCryptoWallet: 0,
    localData: null,
    localLoading: false,
    localError: null,
  });

  const loadACH = async () => {
    if (!userEmail) return;
    try {
      setState((prev) => ({ ...prev, achLoading: true, achError: null, achData: null }));
      const data = await getDepositoACH(userEmail);
      setState((prev) => ({
        ...prev,
        achData: data,
        achError: data ? null : "No se encontraron datos ACH para este usuario",
        achLoading: false,
      }));
    } catch (e: any) {
      setState((prev) => ({
        ...prev,
        achError: e?.message || "Error cargando datos ACH",
        achData: null,
        achLoading: false,
      }));
    }
  };

  const loadSWIFT = async () => {
    if (!userEmail) return;
    try {
      setState((prev) => ({ ...prev, swiftLoading: true, swiftError: null, swiftData: null }));
      const data = await getDepositoSWIFT(userEmail);
      setState((prev) => ({
        ...prev,
        swiftData: data,
        swiftError: data ? null : "No se encontraron datos SWIFT para este usuario",
        swiftLoading: false,
      }));
    } catch (e: any) {
      setState((prev) => ({
        ...prev,
        swiftError: e?.message || "Error cargando datos SWIFT",
        swiftData: null,
        swiftLoading: false,
      }));
    }
  };

  const loadCrypto = async () => {
    if (!userEmail) return;
    try {
      setState((prev) => ({ 
        ...prev, 
        cryptoLoading: true, 
        cryptoError: null, 
        cryptoData: [],
        selectedCryptoWallet: 0,
      }));
      const data = await getDepositosCrypto(userEmail);
      setState((prev) => ({
        ...prev,
        cryptoData: data,
        cryptoError: data.length === 0 ? "No se encontraron wallets crypto para este usuario" : null,
        cryptoLoading: false,
      }));
    } catch (e: any) {
      setState((prev) => ({
        ...prev,
        cryptoError: e?.message || "Error cargando datos Crypto",
        cryptoData: [],
        cryptoLoading: false,
      }));
    }
  };

  const loadLocal = async () => {
    if (!userEmail) return;
    try {
      setState((prev) => ({ ...prev, localLoading: true, localError: null, localData: null }));
      const data = await getDepositoLocal(userEmail);
      setState((prev) => ({
        ...prev,
        localData: data,
        localError: data ? null : "No se encontraron datos de moneda local para este usuario",
        localLoading: false,
      }));
    } catch (e: any) {
      setState((prev) => ({
        ...prev,
        localError: e?.message || "Error cargando datos de moneda local",
        localData: null,
        localLoading: false,
      }));
    }
  };

  const setSelectedCryptoWallet = (index: number) => {
    setState((prev) => ({ ...prev, selectedCryptoWallet: index }));
  };

  const loadMethod = async (method: DepositMethod) => {
    switch (method) {
      case "ach":
        await loadACH();
        break;
      case "swift":
        await loadSWIFT();
        break;
      case "crypto":
        await loadCrypto();
        break;
      case "local":
        await loadLocal();
        break;
    }
  };

  const generatePDFData = (method: DepositMethod): PDFData | null => {
    const fields: { label: string; value: string; maskable?: boolean }[] = [];
    let addresses: { beneficiary?: string; bank?: string } | undefined;

    if (method === "ach" && state.achData) {
      fields.push(
        { label: "Routing Number", value: state.achData.routing_number || "" },
        { label: "Número de cuenta", value: state.achData.account_number || "", maskable: true },
        { label: "Nombre del beneficiario", value: state.achData.beneficiary_name || "" },
        { label: "Banco receptor", value: state.achData.receiver_bank || "" },
        { label: "Tipo de cuenta", value: state.achData.account_type || "" }
      );
      addresses = {
        beneficiary: state.achData.beneficiary_address || "",
        bank: state.achData.beneficiary_bank_address || "",
      };
    } else if (method === "swift" && state.swiftData) {
      fields.push(
        { label: "SWIFT/BIC Code", value: state.swiftData.swift_bic_code || "" },
        { label: "Número de cuenta", value: state.swiftData.account_number || "", maskable: true },
        { label: "Nombre del beneficiario", value: state.swiftData.beneficiary_name || "" },
        { label: "Banco receptor", value: state.swiftData.receiver_bank || "" },
        { label: "Tipo de cuenta", value: state.swiftData.account_type || "" }
      );
      addresses = {
        beneficiary: state.swiftData.beneficiary_address || "",
        bank: state.swiftData.beneficiary_bank_address || "",
      };
    } else if (method === "crypto" && state.cryptoData.length > 0) {
      const selectedWallet = state.cryptoData[state.selectedCryptoWallet] || state.cryptoData[0];
      fields.push(
        { label: "Wallet", value: selectedWallet.title || "" },
        { label: "Dirección de depósito", value: selectedWallet.deposit_address || "" },
        { label: "Red/Network", value: selectedWallet.network || "" }
      );
    } else if (method === "local" && state.localData) {
      fields.push(
        { label: "Beneficiario", value: state.localData.beneficiario || "" },
        { label: "Banco", value: state.localData.banco || "" },
        { label: "Número de cuenta", value: state.localData.nro_de_cuenta || "", maskable: true },
        { label: "Identificación", value: state.localData.identificacion || "" },
        { label: "CBU", value: state.localData.cbu || "" },
        { label: "Alias", value: state.localData.alias || "" }
      );
    }

    if (fields.length === 0) return null;

    return {
      method:
        method === "ach"
          ? "ACH/Wire"
          : method === "crypto"
          ? "Crypto"
          : method === "local"
          ? "Moneda Local"
          : method,
      userEmail,
      fields,
      addresses,
    };
  };

  const downloadPDF = async (method: DepositMethod) => {
    const pdfData = generatePDFData(method);
    if (pdfData) {
      try {
        await downloadDepositInstructions(pdfData);
      } catch (error) {
        console.error("Error generando PDF:", error);
        throw new Error("Error al generar el PDF. Por favor, inténtelo de nuevo.");
      }
    }
  };

  const hasData = (method: DepositMethod): boolean => {
    switch (method) {
      case "ach":
        return state.achData !== null;
      case "swift":
        return state.swiftData !== null;
      case "crypto":
        return state.cryptoData.length > 0;
      case "local":
        return state.localData !== null;
      default:
        return false;
    }
  };

  const isLoading = (method: DepositMethod): boolean => {
    switch (method) {
      case "ach":
        return state.achLoading;
      case "swift":
        return state.swiftLoading;
      case "crypto":
        return state.cryptoLoading;
      case "local":
        return state.localLoading;
      default:
        return false;
    }
  };

  const getError = (method: DepositMethod): string | null => {
    switch (method) {
      case "ach":
        return state.achError;
      case "swift":
        return state.swiftError;
      case "crypto":
        return state.cryptoError;
      case "local":
        return state.localError;
      default:
        return null;
    }
  };

  return {
    // Data
    achData: state.achData,
    swiftData: state.swiftData,
    cryptoData: state.cryptoData,
    localData: state.localData,
    selectedCryptoWallet: state.selectedCryptoWallet,

    // Loading
    isLoading,
    achLoading: state.achLoading,
    swiftLoading: state.swiftLoading,
    cryptoLoading: state.cryptoLoading,
    localLoading: state.localLoading,

    // Errors
    getError,
    achError: state.achError,
    swiftError: state.swiftError,
    cryptoError: state.cryptoError,
    localError: state.localError,

    // Actions
    loadMethod,
    loadACH,
    loadSWIFT,
    loadCrypto,
    loadLocal,
    setSelectedCryptoWallet,
    downloadPDF,
    hasData,
  };
}


