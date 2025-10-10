"use client";
import React, { useRef } from "react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import DepositInstructions from "@/components/DepositInstructions";

interface DepositInstructionsContainerProps {
  pdfData: any;
}

export default function DepositInstructionsContainer({ pdfData }: DepositInstructionsContainerProps) {
  const pdfRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = React.useState(false);

  const handleDownloadPDF = async () => {
    if (!pdfRef.current) return;
    try {
      setLoading(true);

      // Capturamos el componente visual con html2canvas
      const canvas = await html2canvas(pdfRef.current, {
        scale: 2, // mejora la calidad
        useCORS: true, // permite cargar logos externos
        backgroundColor: "#ffffff"
      });

      // Convertimos a imagen
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

      const method = pdfData.method.toLowerCase().replace(/\s+/g, "_");
      const date = new Date().toISOString().split("T")[0];
      const fileName = `instrucciones_deposito_${method}_${date}.pdf`;

      pdf.save(fileName);
    } catch (err) {
      console.error("Error generando PDF:", err);
      alert("Error al generar el PDF. Por favor, inténtelo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleDownloadPDF}
        disabled={loading}
        style={{
          background: "#6d37d5",
          color: "#fff",
          border: "none",
          padding: "10px 20px",
          borderRadius: 8,
          cursor: "pointer"
        }}
      >
        {loading ? "Generando..." : "Descargar PDF"}
      </button>

      {/* Render oculto: se captura con html2canvas */}
      <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
        <div ref={pdfRef}>
          <DepositInstructions
            logoUrl="/logo-takenos-transparent.png"
            companyName={findValue(pdfData.fields, "Nombre del beneficiario")}
            method={normalizeMethod(pdfData.method)}
            data={{
              bankName: findValue(pdfData.fields, "Banco receptor"),
              routingNumber: findValue(pdfData.fields, "Routing Number"),
              bankAddress: pdfData.addresses?.bank,
              beneficiaryName: findValue(pdfData.fields, "Nombre del beneficiario"),
              accountNumber: findValue(pdfData.fields, "Número de cuenta"),
              accountType: findValue(pdfData.fields, "Tipo de cuenta"),
              beneficiaryAddress: pdfData.addresses?.beneficiary
            }}
          />
        </div>
      </div>
    </div>
  );
}

/* Helpers */
const findValue = (fields: any[], label: string) =>
  fields.find((f) => f.label.toLowerCase().includes(label.toLowerCase()))?.value || "";

const normalizeMethod = (method: string): "ACH" | "SWIFT" | "CRYPTO" | "LOCAL" => {
  const m = method.toLowerCase();
  if (m.includes("ach")) return "ACH";
  if (m.includes("swift")) return "SWIFT";
  if (m.includes("crypto")) return "CRYPTO";
  if (m.includes("local")) return "LOCAL";
  return "ACH";
};