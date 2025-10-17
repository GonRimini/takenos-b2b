"use client";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { StatementPDF } from "./StatementPDF";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export const DownloadStatement = ({
  data,
  disabled,
}: {
  data: any[];
  disabled?: boolean;
}) => {
  if (disabled) {
    return (
      <Button variant="cta" size="sm" disabled>
        <Download className="size-4" />
        Descargar PDF
      </Button>
    );
  }

  return (
    <PDFDownloadLink
      document={<StatementPDF data={data} />}
      fileName={`extracto-takenos-${new Date().toISOString().split("T")[0]}.pdf`}
    >
      {({ loading }) => (
        <Button variant="cta" size="sm" disabled={loading}>
          <Download className="size-4" />
          {loading ? "Generando..." : "Descargar PDF"}
        </Button>
      )}
    </PDFDownloadLink>
  );
};