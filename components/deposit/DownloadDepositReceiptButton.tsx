"use client";

import { PDFDownloadLink } from "@react-pdf/renderer";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { DepositReceiptPDF, type DepositReceiptData } from "./DepositReceiptPDF";
import { useAuth } from "@/components/auth";

interface DownloadDepositReceiptButtonProps {
  depositData: {
    id: string;
    account_ref: string;
    amount: number;
    description: string;
    date: string;
  };
  className?: string;
  variant?: "default" | "outline" | "ghost" | "link" | "destructive" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
}

export function DownloadDepositReceiptButton({
  depositData,
  className ="text-violet-800",
  variant = "outline",
  size = "sm",
}: DownloadDepositReceiptButtonProps) {
  const { user } = useAuth();
  const companyName = user?.dbUser?.company?.name;

  // Preparar los datos para el PDF incluyendo información del usuario
  const pdfData: DepositReceiptData = {
    ...depositData,
    companyName: companyName || undefined,
    userEmail: user?.email || undefined,
  };

  const fileName = `comprobante-deposito-${depositData.id}.pdf`;

  return (
    <PDFDownloadLink
      document={<DepositReceiptPDF data={pdfData} />}
      fileName={fileName}
    >
      {({ loading }) => (
        <Button
          variant={variant}
          size={size}
          className={className}
          disabled={loading}
        >
          <Download className="h-4 w-4 mr-2" />
          {""}
        </Button>
      )}
    </PDFDownloadLink>
  );
}