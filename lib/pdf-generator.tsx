import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import React, { createRef } from "react";
import { createRoot } from "react-dom/client";
import DepositInstructions from "@/components/DepositInstructions";

// Tema central para consistencia visual
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
  radius: 3
}

// Helpers para formateo y utilidades
function nowEs() { 
  return new Date() 
}

function fmtMoneyUSD(n: number) { 
  return Math.abs(n).toLocaleString("es-AR", { 
    style: "currency", 
    currency: "USD" 
  }) 
}

function fmtDateTimeEs(d: Date) { 
  return d.toLocaleString("es-ES", { 
    day: "2-digit", 
    month: "long", 
    year: "numeric", 
    hour: "2-digit", 
    minute: "2-digit" 
  }) 
}

function ensureSpace(doc: jsPDF, currentY: number, needed = 24) { 
  if (currentY + needed > 280) { 
    doc.addPage()
    return 20 
  } 
  return currentY 
}

function drawCard(doc: jsPDF, x: number, y: number, w: number, h: number) { 
  // Fondo de la tarjeta
  doc.setFillColor(theme.cardBg)
  doc.roundedRect(x, y, w, h, theme.radius, theme.radius, "F")
  
  // Borde de la tarjeta
  doc.setDrawColor(theme.line)
  doc.setLineWidth(0.3)
  doc.roundedRect(x, y, w, h, theme.radius, theme.radius, "S")
}

function label(doc: jsPDF, txt: string, x: number, y: number) { 
  doc.setFont("helvetica", "bold")
  doc.setFontSize(10)
  doc.setTextColor(theme.muted)
  doc.text(txt.toUpperCase(), x, y)
}

function value(doc: jsPDF, txt: string, x: number, y: number, maxWidth = 160) { 
  doc.setFont("helvetica", "normal")
  doc.setFontSize(12)
  doc.setTextColor(theme.text)
  const lines = doc.splitTextToSize(String(txt), maxWidth)
  doc.text(lines, x, y)
  return y + (lines.length * 5)
}

function chip(doc: jsPDF, txt: string, x: number, y: number, fg: string, bg: string) { 
  doc.setFillColor(bg)
  doc.setTextColor(fg)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(10)
  const w = doc.getTextWidth(txt) + 8
  doc.roundedRect(x, y - 5, w, 8, 3, 3, "F")
  doc.text(txt, x + 4, y + 1)
  return w + 4 // Retorna el ancho usado para posicionamiento
}

function sectionTitle(doc: jsPDF, txt: string, x: number, y: number) {
  doc.setFont("helvetica", "bold")
  doc.setFontSize(14)
  doc.setTextColor(theme.text)
  doc.text(txt.toUpperCase(), x, y)
  return y + 8
}

function drawHeader(doc: jsPDF, title: string, subtitle: string) {
  // Franja superior de color primario
  doc.setFillColor(theme.primary)
  doc.rect(0, 0, 210, 32, "F")
  
  // Agregar logo directamente con proporciones más horizontales
  try {
    doc.addImage('/logo-takenos-transparent.png', 'PNG', 20, 9, 60, 8)
  } catch (error) {
    console.warn('Error agregando logo al PDF:', error)
    // Fallback a texto
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(24)
    doc.setFont("helvetica", "bold")
    doc.text("TAKENOS", 20, 20)
  }
    
  // Bloque de información a la derecha
  doc.setTextColor(255, 255, 255)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(16)
  doc.text(title, 140, 16)
  
  doc.setFont("helvetica", "normal")
  doc.setFontSize(12)
  doc.text(subtitle, 140, 24)
  
  return doc
}

interface TransactionReceipt {
  id: string
  date: string
  description: string
  amount: number
  type: "credit" | "debit"
  status: "completed" | "pending" | "failed"
  userEmail: string
}

export const generateTransactionReceipt = async (transaction: TransactionReceipt) => {
  const doc = new jsPDF()
  const now = nowEs()
  
  // Header moderno con logo
  drawHeader(doc, "COMPROBANTE", `ID: ${transaction.id}`)
  
  let currentY = 45
  
  // Título principal
  currentY = sectionTitle(doc, "Comprobante de Transacción", 20, currentY)
  currentY += 10
  
  // Card principal con detalles de la transacción
  const cardHeight = 85
  currentY = ensureSpace(doc, currentY, cardHeight)
  drawCard(doc, 20, currentY, 170, cardHeight)
  
  let cardY = currentY + 12
  
  // Fecha y hora
  label(doc, "Fecha y Hora", 30, cardY)
  cardY = value(doc, fmtDateTimeEs(new Date(transaction.date)), 30, cardY + 6, 140)
  cardY += 8
  
  // Descripción con wrap
  label(doc, "Descripción", 30, cardY)
  cardY = value(doc, transaction.description, 30, cardY + 6, 140)
  cardY += 8
  
  // Estado como chip
  label(doc, "Estado", 30, cardY)
  cardY += 6
  
  let statusText: string
  let statusFg: string
  let statusBg: string
  
  switch (transaction.status) {
    case "completed":
      statusText = "COMPLETADO"
      statusFg = theme.success
      statusBg = theme.successBg
      break
    case "pending":
      statusText = "PENDIENTE"
      statusFg = theme.warning
      statusBg = theme.warningBg
      break
    case "failed":
      statusText = "FALLIDO"
      statusFg = theme.error
      statusBg = theme.errorBg
      break
    default:
      statusText = "DESCONOCIDO"
      statusFg = theme.muted
      statusBg = "#F3F4F6"
  }
  
  chip(doc, statusText, 30, cardY + 4, statusFg, statusBg)
  cardY += 12
  
  // Usuario con wrap
  label(doc, "Usuario", 30, cardY)
  cardY = value(doc, transaction.userEmail, 30, cardY + 6, 140)
  
  currentY += cardHeight + 20
  
  // Card destacada para el monto
  const amountCardHeight = 45
  currentY = ensureSpace(doc, currentY, amountCardHeight)
  drawCard(doc, 20, currentY, 170, amountCardHeight)
  
  // Monto con formato y color
  const amountColor = transaction.type === "credit" ? theme.creditColor : theme.debitColor
  const amountPrefix = transaction.type === "credit" ? "+" : "-"
  
  doc.setFont("helvetica", "bold")
  doc.setFontSize(12)
  doc.setTextColor(theme.muted)
  doc.text("MONTO", 30, currentY + 18)
  
  doc.setFont("helvetica", "bold")
  doc.setFontSize(28)
  doc.setTextColor(amountColor)
  doc.text(`${amountPrefix}${fmtMoneyUSD(transaction.amount)}`, 30, currentY + 35)
  
  currentY += amountCardHeight + 30
  
  // Footer moderno
  currentY = ensureSpace(doc, currentY, 40)
  
  // Línea separadora
  doc.setDrawColor(theme.line)
  doc.setLineWidth(0.3)
  doc.line(20, currentY, 190, currentY)
  currentY += 10
  
  // Información del footer
  doc.setTextColor(theme.muted)
  doc.setFontSize(9)
  doc.setFont("helvetica", "normal")
  
  doc.text("Este documento contiene información confidencial. Manténgalo seguro.", 20, currentY)
  currentY += 6
  
  doc.text(`Generado el: ${fmtDateTimeEs(now)}`, 20, currentY)
  currentY += 6
  
  doc.text("© 2025 Takenos – soporte@takenos.com", 20, currentY)
  
  return doc
}

export const downloadTransactionReceipt = async (transaction: TransactionReceipt) => {
  const doc = await generateTransactionReceipt(transaction)
  const fileName = `comprobante_${transaction.id}_${new Date().toISOString().split('T')[0]}.pdf`
  doc.save(fileName)
}

// Interfaces para instrucciones de depósito
interface DepositInstructions {
  method: string
  userEmail: string
  fields: { label: string; value: string; maskable?: boolean }[]
  addresses?: {
    beneficiary?: string
    bank?: string
  }
}

// export const generateDepositInstructionsPDF = (instructions: DepositInstructions) => {
//   const doc = new jsPDF()
//   const now = nowEs()
  
//   // Fondo blanco completo
//   doc.setFillColor("#FFFFFF")
//   doc.rect(0, 0, 210, 297, "F")
  
//   let currentY = 20
  
//   // Logo de Takenos arriba a la izquierda
//   try {
//     // Usar logo directamente con proporciones más horizontales para evitar aplastamiento
//     doc.addImage('/logo-takenos-transparent.png', 'PNG', 20, currentY, 75, 10)
//   } catch (error) {
//     console.warn('Error agregando logo al PDF:', error)
//     // Fallback a texto
//     doc.setTextColor(theme.primary)
//     doc.setFontSize(16)
//     doc.setFont("helvetica", "bold")
//     doc.text("TAKENOS", 20, currentY + 12)
//   }
  
//   currentY += 35
  
//   // BANDA 1 — Encabezado de empresa
//   // Nombre de la empresa en grande y negrita
//   const companyName = instructions.fields.find(field => 
//     field.label.toLowerCase().includes('empresa') || 
//     field.label.toLowerCase().includes('company') ||
//     field.label.toLowerCase().includes('beneficiary name') ||
//     field.label.toLowerCase().includes('nombre del beneficiario')
//   )?.value || instructions.method.toUpperCase()
  
//   doc.setTextColor(theme.text)
//   doc.setFontSize(18)
//   doc.setFont("helvetica", "bold")
//   doc.text(companyName, 20, currentY)
  
//   // Texto explicativo a la derecha
//   const explanationText = instructions.method.toLowerCase() === 'ach' ?
//     "Utiliza estos datos para realizar transferencias\ndomésticas y ACH a tu cuenta de Takenos." :
//     instructions.method.toLowerCase() === 'swift' ?
//     "Utiliza estos datos para realizar transferencias\ninternacionales a tu cuenta de Takenos." :
//     "Utiliza estos datos para realizar transferencias\na tu cuenta de Takenos."
  
//   doc.setTextColor(theme.text)
//   doc.setFontSize(11)
//   doc.setFont("helvetica", "normal")
//   const explanationLines = explanationText.split('\n')
//   explanationLines.forEach((line, index) => {
//     doc.text(line, 110, currentY - 8 + (index * 6))
//   })
  
//   currentY += 20
  
//   // Separador horizontal
//   doc.setDrawColor(theme.line)
//   doc.setLineWidth(0.3)
//   doc.line(20, currentY, 190, currentY)
//   currentY += 20
  
//   // BANDA 2 — Banco receptor
//   doc.setTextColor(theme.primary)
//   doc.setFontSize(14)
//   doc.setFont("helvetica", "bold")
//   doc.text("Banco Receptor", 20, currentY)
//   currentY += 15
  
//   // Buscar campos específicos del banco
//   const routingField = instructions.fields.find(field => 
//     field.label.toLowerCase().includes('routing') ||
//     field.label.toLowerCase().includes('aba') ||
//     field.label.toLowerCase().includes('swift') ||
//     field.label.toLowerCase().includes('bic') ||
//     field.label.toLowerCase().includes('swift/bic code')
//   )
  
//   // Debug específico para SWIFT
//   console.log('🔍 PDF Debug - routingField encontrado:', routingField)
//   console.log('🔍 PDF Debug - Método:', instructions.method)
  
//   // Si no encontramos routingField, buscar específicamente "SWIFT/BIC Code"
//   if (!routingField && instructions.method.toLowerCase() === 'swift') {
//     const swiftField = instructions.fields.find(field => 
//       field.label === "SWIFT/BIC Code"
//     )
//     console.log('🔍 PDF Debug - swiftField específico:', swiftField)
//   }
  
//   const bankNameField = instructions.fields.find(field => 
//     field.label.toLowerCase().includes('bank name') ||
//     field.label.toLowerCase().includes('nombre del banco') ||
//     field.label.toLowerCase().includes('receiver bank') ||
//     field.label.toLowerCase().includes('banco receptor')
//   )
  
//   const bankAddressField = instructions.addresses?.bank
  
//   // Debug: mostrar todos los campos disponibles
//   console.log('🔍 PDF Debug - Todos los campos disponibles:', instructions.fields.map(f => f.label))
//   console.log('🔍 PDF Debug - Direcciones:', instructions.addresses)
  
//   // Buscar también específicamente "SWIFT/BIC Code" si no encontramos routingField
//   const swiftBicField = !routingField ? instructions.fields.find(field => 
//     field.label === "SWIFT/BIC Code"
//   ) : null
  
//   const finalRoutingField = routingField || swiftBicField
  
//   // Tabla de dos columnas para banco receptor
//   if (finalRoutingField) {
//     const label = finalRoutingField.label.toLowerCase().includes('swift') || finalRoutingField.label.includes('SWIFT') ? "SWIFT/BIC Code" : "Routing Number"
//     doc.setTextColor(theme.muted)
//     doc.setFontSize(10)
//     doc.setFont("helvetica", "normal")
//     doc.text(label, 30, currentY)
    
//     doc.setTextColor(theme.text)
//     doc.setFontSize(11)
//     doc.setFont("helvetica", "normal")
//     // Asegurarse de que el valor no esté vacío
//     const routingValue = finalRoutingField.value || "N/A"
//     doc.text(routingValue, 120, currentY)
//     currentY += 12
//   }
  
//   if (bankNameField) {
//     doc.setTextColor(theme.muted)
//     doc.setFontSize(10)
//     doc.setFont("helvetica", "normal")
//     doc.text("Nombre del Banco", 30, currentY)
    
//     doc.setTextColor(theme.text)
//     doc.setFontSize(11)
//     doc.setFont("helvetica", "normal")
//     const bankNameLines = doc.splitTextToSize(bankNameField.value, 70)
//     doc.text(bankNameLines, 120, currentY)
//     currentY += (bankNameLines.length * 5) + 7
//   }
  
//   if (bankAddressField) {
//     doc.setTextColor(theme.muted)
//     doc.setFontSize(10)
//     doc.setFont("helvetica", "normal")
//     doc.text("Dirección del Banco", 30, currentY)
    
//     doc.setTextColor(theme.text)
//     doc.setFontSize(11)
//     doc.setFont("helvetica", "normal")
//     const addressLines = doc.splitTextToSize(bankAddressField, 70)
//     doc.text(addressLines, 120, currentY)
//     currentY += (addressLines.length * 5) + 7
//   }
  
//   // Fallback: si no encontramos campos específicos, mostrar todos los que no sean del beneficiario
//   if (!finalRoutingField && !bankNameField) {
//     const otherBankFields = instructions.fields.filter(field => 
//       !field.label.toLowerCase().includes('cuenta') &&
//       !field.label.toLowerCase().includes('account') &&
//       !field.label.toLowerCase().includes('beneficiario') &&
//       !field.label.toLowerCase().includes('beneficiary') &&
//       !field.label.toLowerCase().includes('tipo')
//     )
    
//     otherBankFields.forEach((field) => {
//       doc.setTextColor(theme.muted)
//       doc.setFontSize(10)
//       doc.setFont("helvetica", "normal")
//       doc.text(field.label, 30, currentY)
      
//       doc.setTextColor(theme.text)
//       doc.setFontSize(11)
//       doc.setFont("helvetica", "normal")
//       const lines = doc.splitTextToSize(field.value, 70)
//       doc.text(lines, 120, currentY)
//       currentY += (lines.length * 5) + 7
//     })
//   }
  
//   currentY += 10
  
//   // Separador horizontal
//   doc.setDrawColor(theme.line)
//   doc.setLineWidth(0.3)
//   doc.line(20, currentY, 190, currentY)
//   currentY += 20
  
//   // BANDA 3 — Beneficiario
//   doc.setTextColor(theme.primary)
//   doc.setFontSize(14)
//   doc.setFont("helvetica", "bold")
//   doc.text("Beneficiario", 20, currentY)
//   currentY += 15
  
//   // Buscar campos específicos del beneficiario
//   const beneficiaryNameField = instructions.fields.find(field => 
//     field.label.toLowerCase().includes('beneficiary name') ||
//     field.label.toLowerCase().includes('nombre del beneficiario')
//   )
  
//   const accountNumberField = instructions.fields.find(field => 
//     field.label.toLowerCase().includes('account number') ||
//     field.label.toLowerCase().includes('número de cuenta')
//   )
  
//   const accountTypeField = instructions.fields.find(field => 
//     field.label.toLowerCase().includes('account type') ||
//     field.label.toLowerCase().includes('tipo de cuenta') ||
//     field.label.toLowerCase().includes('type of account')
//   )
  
//   const beneficiaryAddressField = instructions.addresses?.beneficiary
  
//   // Tabla de dos columnas para beneficiario
//   if (beneficiaryNameField) {
//     doc.setTextColor(theme.muted)
//     doc.setFontSize(10)
//     doc.setFont("helvetica", "normal")
//     doc.text("Nombre del Beneficiario", 30, currentY)
    
//     doc.setTextColor(theme.text)
//     doc.setFontSize(11)
//     doc.setFont("helvetica", "normal")
//     doc.text(beneficiaryNameField.value, 120, currentY)
//     currentY += 12
//   }
  
//   if (accountNumberField) {
//     doc.setTextColor(theme.muted)
//     doc.setFontSize(10)
//     doc.setFont("helvetica", "normal")
//     doc.text("Número de Cuenta", 30, currentY)
    
//     doc.setTextColor(theme.text)
//     doc.setFontSize(11)
//     doc.setFont("helvetica", "bold") // Número de cuenta en bold
//     doc.text(accountNumberField.value, 120, currentY)
//     currentY += 12
//   }
  
//   if (accountTypeField) {
//     doc.setTextColor(theme.muted)
//     doc.setFontSize(10)
//     doc.setFont("helvetica", "normal")
//     doc.text("Tipo de Cuenta", 30, currentY)
    
//     doc.setTextColor(theme.text)
//     doc.setFontSize(11)
//     doc.setFont("helvetica", "normal")
//     doc.text(accountTypeField.value, 120, currentY)
//     currentY += 12
//   }
  
//   if (beneficiaryAddressField) {
//     doc.setTextColor(theme.muted)
//     doc.setFontSize(10)
//     doc.setFont("helvetica", "normal")
//     doc.text("Dirección del Beneficiario", 30, currentY)
    
//     doc.setTextColor(theme.text)
//     doc.setFontSize(11)
//     doc.setFont("helvetica", "normal")
//     const addressLines = doc.splitTextToSize(beneficiaryAddressField, 70)
//     doc.text(addressLines, 120, currentY)
//     currentY += (addressLines.length * 5) + 7
//   }
  
//   return doc
// }

export const downloadDepositInstructions = async (instructions: any) => {
  try {
    // 1️⃣ Crear contenedor temporal invisible
    const container = document.createElement("div");
    container.style.position = "absolute";
    container.style.left = "-9999px";
    container.style.top = "0";
    container.style.background = "#fff";
    container.style.width = "900px";
    container.style.padding = "20px";
    container.style.zIndex = "-1";
    document.body.appendChild(container);

    // 2️⃣ Adaptar los datos según el método
    console.log(instructions)
    const normalized = adaptInstructions(instructions);

    // 3️⃣ Renderizar el comprobante
    const root = createRoot(container);
    root.render(
      <DepositInstructions
        logoUrl={`${window.location.origin}/logo-takenos-transparent.png`}
        companyName={normalized.companyName}
        method={normalized.method}
        data={normalized.data}
      />
    );

    // 4️⃣ Esperar montaje completo
    await new Promise((r) => setTimeout(r, 500));

    // 5️⃣ Inyectar estilos seguros contra OKLCH
    const style = document.createElement("style");
    style.innerHTML = `
      * {
        color-scheme: light;
        --background: #ffffff !important;
        --foreground: #0F172A !important;
        --muted: #6B7280 !important;
        --primary: #6d37d5 !important;
        color: #0F172A !important;
        background: #ffffff !important;
        border-color: #ECECEC !important;
      }
      body, html {
        background: #ffffff !important;
        color: #0F172A !important;
      }
    `;
    container.prepend(style);

    // 6️⃣ Sanitizar colores
    sanitizeColors(container);

    // 7️⃣ Capturar y generar PDF
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

    // 8️⃣ Guardar archivo
    const method = instructions.method.toLowerCase().replace(/\s+/g, "_");
    const date = new Date().toISOString().split("T")[0];
    pdf.save(`instrucciones_deposito_${method}_${date}.pdf`);

    // 9️⃣ Limpiar DOM
    root.unmount();
    document.body.removeChild(container);
  } catch (error) {
    console.error("Error generando PDF:", error);
    alert("Error al generar el PDF. Por favor, inténtelo de nuevo.");
  }
};

const findValue = (fields: any[], label: string) =>
  fields.find((f) => f.label.toLowerCase().includes(label.toLowerCase()))?.value || "";

/* 🧩 Normaliza los distintos tipos de métodos */
function adaptInstructions(instructions: any) {
  const m = instructions.method.toLowerCase();

  /* 🟣 Moneda Local */
  if (m.includes("local")) {
    return {
      companyName: findValue(instructions.fields, "Beneficiario"),
      method: "LOCAL" as const,
      data: {
        bankName: findValue(instructions.fields, "Banco"),
        routingNumber: "",
        bankAddress: "",
        beneficiaryName: findValue(instructions.fields, "Beneficiario"),
        accountNumber: findValue(instructions.fields, "Número de cuenta"),
        accountType: "Cuenta local",
        beneficiaryAddress: `NIT/Carnet: ${findValue(instructions.fields, "NIT o Carnet")}`,
      },
    };
  }

  /* 🪙 CRYPTO */
  if (m.includes("crypto")) {
    return {
      companyName: "Cuenta Crypto",
      method: "CRYPTO" as const,
      data: {
        bankName: findValue(instructions.fields, "Red") || findValue(instructions.fields, "Red/Network"),
        routingNumber: "",
        bankAddress: "",
        beneficiaryName: "Wallet",
        accountNumber: findValue(instructions.fields, "Dirección de depósito") || "—",
        accountType: findValue(instructions.fields, "Wallet") || "USDT / USDC",
        beneficiaryAddress: "",
      },
    };
  }

  /* 🟢 ACH / SWIFT */
  return {
    companyName: findValue(instructions.fields, "Nombre del beneficiario"),
    method: normalizeMethod(instructions.method),
    data: {
      bankName: findValue(instructions.fields, "Banco receptor"),
      routingNumber: findValue(instructions.fields, "SWIFT/BIC Code"),
      bankAddress: instructions.addresses?.bank || "",
      beneficiaryName: findValue(instructions.fields, "Nombre del beneficiario"),
      accountNumber: findValue(instructions.fields, "Número de cuenta"),
      accountType: findValue(instructions.fields, "Tipo de cuenta"),
      beneficiaryAddress: instructions.addresses?.beneficiary || "",
    },
  };
}

/* 🔧 Normaliza el método para el componente */
const normalizeMethod = (method: string): "ACH" | "SWIFT" | "CRYPTO" | "LOCAL" => {
  const m = method.toLowerCase();
  if (m.includes("ach")) return "ACH";
  if (m.includes("swift")) return "SWIFT";
  if (m.includes("crypto")) return "CRYPTO";
  if (m.includes("local")) return "LOCAL";
  return "ACH";
};

/* 🔧 Limpieza de colores problemáticos */
function sanitizeColors(root: HTMLElement) {
  const all = root.querySelectorAll("*");
  all.forEach((el) => {
    const style = getComputedStyle(el);
    if (style.color.includes("oklch")) (el as HTMLElement).style.color = "#0F172A";
    if (style.backgroundColor.includes("oklch"))
      (el as HTMLElement).style.backgroundColor = "#ffffff";
  });
}
