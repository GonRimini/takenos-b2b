import { jsPDF } from "jspdf";

interface DepositInstructions {
  method: string;
  userEmail: string;
  fields: { label: string; value: string; maskable?: boolean }[];
  addresses?: {
    beneficiary?: string;
    bank?: string;
  };
}

export const generateDepositInstructionsPDF = (
  instructions: DepositInstructions
) => {

  console.log("INSTRUCCIONES", instructions);
  const theme = {
    primary: "#6d37d5",
    text: "#0F172A",
    muted: "#6B7280",
    line: "#ECECEC",
    cardBg: "#FAFBFC",
    success: "#166534",
    successBg: "#E9F9EF",
    warning: "#92400E",
    warningBg: "#FEF3C7",
    error: "#991B1B",
    errorBg: "#FEE2E2",
    creditColor: "#22C55E",
    debitColor: "#EF4444",
    radius: 3,
  };
  const doc = new jsPDF();

  // Fondo blanco completo
  doc.setFillColor("#FFFFFF");
  doc.rect(0, 0, 210, 297, "F");

  let currentY = 20;

  // Logo de Takenos arriba a la izquierda
  try {
    // Usar logo directamente con proporciones más horizontales para evitar aplastamiento
    doc.addImage("/logo-takenos-transparent.png", "PNG", 20, currentY, 75, 10);
  } catch (error) {
    console.warn("Error agregando logo al PDF:", error);
    // Fallback a texto
    doc.setTextColor(theme.primary);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("TAKENOS", 20, currentY + 12);
  }

  currentY += 35;

  // BANDA 1 — Encabezado de empresa
  // Nombre de la empresa en grande y negrita
  const companyName =
    instructions.fields.find(
      (field) =>
        field.label.toLowerCase().includes("empresa") ||
        field.label.toLowerCase().includes("company") ||
        field.label.toLowerCase().includes("beneficiary name") ||
        field.label.toLowerCase().includes("nombre del beneficiario")
    )?.value || instructions.method.toUpperCase();

  doc.setTextColor(theme.text);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(companyName, 20, currentY);

  // Texto explicativo a la derecha
  const explanationText =
    instructions.method.toLowerCase() === "ach"
      ? "Utiliza estos datos para realizar transferencias\ndomésticas y ACH a tu cuenta de Takenos."
      : instructions.method.toLowerCase() === "swift"
      ? "Utiliza estos datos para realizar transferencias\ninternacionales a tu cuenta de Takenos."
      : "Utiliza estos datos para realizar transferencias\na tu cuenta de Takenos.";

  doc.setTextColor(theme.text);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  const explanationLines = explanationText.split("\n");
  explanationLines.forEach((line, index) => {
    doc.text(line, 110, currentY - 8 + index * 6);
  });

  currentY += 20;

  // Separador horizontal
  doc.setDrawColor(theme.line);
  doc.setLineWidth(0.3);
  doc.line(20, currentY, 190, currentY);
  currentY += 20;

  // BANDA 2 — Banco receptor
  doc.setTextColor(theme.primary);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Banco Receptor", 20, currentY);
  currentY += 15;

  // Buscar campos específicos del banco
  const routingField = instructions.fields.find(
    (field) =>
      field.label.toLowerCase().includes("routing") ||
      field.label.toLowerCase().includes("aba") ||
      field.label.toLowerCase().includes("swift") ||
      field.label.toLowerCase().includes("bic") ||
      field.label.toLowerCase().includes("swift/bic code")
  );

  // Debug específico para SWIFT
  console.log("🔍 PDF Debug - routingField encontrado:", routingField);
  console.log("🔍 PDF Debug - Método:", instructions.method);

  // Si no encontramos routingField, buscar específicamente "SWIFT/BIC Code"
  if (!routingField && instructions.method.toLowerCase() === "swift") {
    const swiftField = instructions.fields.find(
      (field) => field.label === "SWIFT/BIC Code"
    );
    console.log("🔍 PDF Debug - swiftField específico:", swiftField);
  }

  const bankNameField = instructions.fields.find(
    (field) =>
      field.label.toLowerCase().includes("bank name") ||
      field.label.toLowerCase().includes("nombre del banco") ||
      field.label.toLowerCase().includes("receiver bank") ||
      field.label.toLowerCase().includes("banco receptor")
  );

  const bankAddressField = instructions.addresses?.bank;

  // Debug: mostrar todos los campos disponibles
  console.log(
    "🔍 PDF Debug - Todos los campos disponibles:",
    instructions.fields.map((f) => f.label)
  );
  console.log("🔍 PDF Debug - Direcciones:", instructions.addresses);

  // Buscar también específicamente "SWIFT/BIC Code" si no encontramos routingField
  const swiftBicField = !routingField
    ? instructions.fields.find((field) => field.label === "SWIFT/BIC Code")
    : null;

  const finalRoutingField = routingField || swiftBicField;

  // Tabla de dos columnas para banco receptor
  if (finalRoutingField) {
    const label =
      finalRoutingField.label.toLowerCase().includes("swift") ||
      finalRoutingField.label.includes("SWIFT")
        ? "SWIFT/BIC Code"
        : "Routing Number";
    doc.setTextColor(theme.muted);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(label, 30, currentY);

    doc.setTextColor(theme.text);
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    // Asegurarse de que el valor no esté vacío
    const routingValue = finalRoutingField.value || "N/A";
    doc.text(routingValue, 120, currentY);
    currentY += 12;
  }

  if (bankNameField) {
    doc.setTextColor(theme.muted);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Nombre del Banco", 30, currentY);

    doc.setTextColor(theme.text);
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    const bankNameLines = doc.splitTextToSize(bankNameField.value, 70);
    doc.text(bankNameLines, 120, currentY);
    currentY += bankNameLines.length * 5 + 7;
  }

  if (bankAddressField) {
    doc.setTextColor(theme.muted);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Dirección del Banco", 30, currentY);

    doc.setTextColor(theme.text);
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    const addressLines = doc.splitTextToSize(bankAddressField, 70);
    doc.text(addressLines, 120, currentY);
    currentY += addressLines.length * 5 + 7;
  }

  // Fallback: si no encontramos campos específicos, mostrar todos los que no sean del beneficiario
  if (!finalRoutingField && !bankNameField) {
    const otherBankFields = instructions.fields.filter(
      (field) =>
        !field.label.toLowerCase().includes("cuenta") &&
        !field.label.toLowerCase().includes("account") &&
        !field.label.toLowerCase().includes("beneficiario") &&
        !field.label.toLowerCase().includes("beneficiary") &&
        !field.label.toLowerCase().includes("tipo")
    );

    otherBankFields.forEach((field) => {
      doc.setTextColor(theme.muted);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(field.label, 30, currentY);

      doc.setTextColor(theme.text);
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      const lines = doc.splitTextToSize(field.value, 70);
      doc.text(lines, 120, currentY);
      currentY += lines.length * 5 + 7;
    });
  }

  currentY += 10;

  // Separador horizontal
  doc.setDrawColor(theme.line);
  doc.setLineWidth(0.3);
  doc.line(20, currentY, 190, currentY);
  currentY += 20;

  // BANDA 3 — Beneficiario
  doc.setTextColor(theme.primary);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Beneficiario", 20, currentY);
  currentY += 15;

  // Buscar campos específicos del beneficiario
  const beneficiaryNameField = instructions.fields.find(
    (field) =>
      field.label.toLowerCase().includes("beneficiary name") ||
      field.label.toLowerCase().includes("nombre del beneficiario")
  );

  const accountNumberField = instructions.fields.find(
    (field) =>
      field.label.toLowerCase().includes("account number") ||
      field.label.toLowerCase().includes("número de cuenta")
  );

  const accountTypeField = instructions.fields.find(
    (field) =>
      field.label.toLowerCase().includes("account type") ||
      field.label.toLowerCase().includes("tipo de cuenta") ||
      field.label.toLowerCase().includes("type of account")
  );

  const beneficiaryAddressField = instructions.addresses?.beneficiary;

  // Tabla de dos columnas para beneficiario
  if (beneficiaryNameField) {
    doc.setTextColor(theme.muted);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Nombre del Beneficiario", 30, currentY);

    doc.setTextColor(theme.text);
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(beneficiaryNameField.value, 120, currentY);
    currentY += 12;
  }

  if (accountNumberField) {
    doc.setTextColor(theme.muted);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Número de Cuenta", 30, currentY);

    doc.setTextColor(theme.text);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold"); // Número de cuenta en bold
    doc.text(accountNumberField.value, 120, currentY);
    currentY += 12;
  }

  if (accountTypeField) {
    doc.setTextColor(theme.muted);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Tipo de Cuenta", 30, currentY);

    doc.setTextColor(theme.text);
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(accountTypeField.value, 120, currentY);
    currentY += 12;
  }

  if (beneficiaryAddressField) {
    doc.setTextColor(theme.muted);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Dirección del Beneficiario", 30, currentY);

    doc.setTextColor(theme.text);
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    const addressLines = doc.splitTextToSize(beneficiaryAddressField, 70);
    doc.text(addressLines, 120, currentY);
    currentY += addressLines.length * 5 + 7;
  }

  return doc;
};
