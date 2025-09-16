import { jsPDF } from "jspdf"
import { getLogoBase64Safe } from "./logo-helper"

interface TransactionReceipt {
  id: string
  date: string
  description: string
  amount: number
  type: "credit" | "debit"
  status: "completed" | "pending" | "failed"
  userEmail: string
}

export const generateTransactionReceipt = (transaction: TransactionReceipt) => {
  const doc = new jsPDF()
  
  // Configuración de colores de Takenos
  const primaryColor = "#6d37d5"
  const secondaryColor = "#f8f9fa"
  
  // Header con logo y branding
  doc.setFillColor(primaryColor)
  doc.rect(0, 0, 210, 30, "F")
  
  // Logo placeholder (texto por ahora)
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(24)
  doc.setFont("helvetica", "bold")
  doc.text("TAKENOS", 20, 20)
  
  // Subtítulo
  doc.setFontSize(12)
  doc.setFont("helvetica", "normal")
  doc.text("Portal Financiero", 20, 28)
  
  // Información del comprobante
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(16)
  doc.setFont("helvetica", "bold")
  doc.text("COMPROBANTE DE TRANSACCIÓN", 20, 50)
  
  // Línea separadora
  doc.setDrawColor(primaryColor)
  doc.setLineWidth(0.5)
  doc.line(20, 55, 190, 55)
  
  // Detalles de la transacción
  doc.setFontSize(12)
  doc.setFont("helvetica", "normal")
  
  const startY = 70
  const lineHeight = 8
  
  // Fecha
  doc.setFont("helvetica", "bold")
  doc.text("Fecha:", 20, startY)
  doc.setFont("helvetica", "normal")
  doc.text(new Date(transaction.date).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }), 80, startY)
  
  // Descripción
  doc.setFont("helvetica", "bold")
  doc.text("Descripción:", 20, startY + lineHeight)
  doc.setFont("helvetica", "normal")
  doc.text(transaction.description, 80, startY + lineHeight)
  
  // Estado
  doc.setFont("helvetica", "bold")
  doc.text("Estado:", 20, startY + lineHeight * 2)
  doc.setFont("helvetica", "normal")
  const statusText = transaction.status === "completed" ? "Completado" : 
                    transaction.status === "pending" ? "Pendiente" : "Fallido"
  doc.text(statusText, 80, startY + lineHeight * 2)
  
  // Email del usuario
  doc.setFont("helvetica", "bold")
  doc.text("Usuario:", 20, startY + lineHeight * 3)
  doc.setFont("helvetica", "normal")
  doc.text(transaction.userEmail, 80, startY + lineHeight * 3)
  
  // Monto destacado
  doc.setFontSize(18)
  doc.setFont("helvetica", "bold")
  doc.text("MONTO:", 20, startY + lineHeight * 5)
  
  const amountColor = transaction.amount > 0 ? "#22c55e" : "#ef4444"
  doc.setTextColor(amountColor)
  doc.setFontSize(24)
  doc.text(`$${Math.abs(transaction.amount).toFixed(2)} USD`, 80, startY + lineHeight * 5)
  
  // Footer
  doc.setTextColor(100, 100, 100)
  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.text("Este documento es generado automáticamente por el sistema de Takenos.", 20, 270)
  doc.text("Para consultas, contacte a soporte@takenos.com", 20, 275)
  
  // Fecha de generación
  doc.text(`Generado el: ${new Date().toLocaleDateString("es-ES")} a las ${new Date().toLocaleTimeString("es-ES")}`, 20, 280)
  
  return doc
}

export const downloadTransactionReceipt = (transaction: TransactionReceipt) => {
  const doc = generateTransactionReceipt(transaction)
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

export const generateDepositInstructionsPDF = async (instructions: DepositInstructions) => {
  const doc = new jsPDF()
  
  // Configuración de colores de Takenos
  const primaryColor = "#6d37d5"
  
  // Header con logo y branding
  doc.setFillColor(primaryColor)
  doc.rect(0, 0, 210, 35, "F")
  
  // Intentar cargar el logo real
  const logoBase64 = await getLogoBase64Safe()
  
  if (logoBase64) {
    try {
      // Agregar logo real más grande y centrado
      doc.addImage(logoBase64, 'PNG', 20, 5, 40, 25)
    } catch (error) {
      console.warn('Error agregando logo al PDF:', error)
      // Fallback a texto simple
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(32)
      doc.setFont("helvetica", "bold")
      doc.text("TAKENOS", 20, 22)
    }
  } else {
    // Fallback a texto si no se puede cargar el logo
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(32)
    doc.setFont("helvetica", "bold")
    doc.text("TAKENOS", 20, 22)
  }
  
  // Título principal
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(18)
  doc.setFont("helvetica", "bold")
  doc.text(`INSTRUCCIONES DE DEPÓSITO - ${instructions.method.toUpperCase()}`, 20, 55)
  
  // Línea separadora
  doc.setDrawColor(primaryColor)
  doc.setLineWidth(0.8)
  doc.line(20, 60, 190, 60)
  
  // Usuario
  doc.setFontSize(12)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(100, 100, 100)
  doc.text(`Usuario: ${instructions.userEmail}`, 20, 70)
  doc.text(`Fecha: ${new Date().toLocaleDateString("es-ES", { 
    year: "numeric", 
    month: "long", 
    day: "numeric" 
  })}`, 20, 78)
  
  // Información bancaria
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(14)
  doc.setFont("helvetica", "bold")
  doc.text("INFORMACIÓN PARA EL DEPÓSITO:", 20, 95)
  
  let currentY = 110
  const lineHeight = 12
  
  // Campos principales
  instructions.fields.forEach((field) => {
    doc.setFontSize(11)
    doc.setFont("helvetica", "bold")
    doc.text(`${field.label}:`, 25, currentY)
    
    doc.setFont("helvetica", "normal")
    let displayValue = field.value
    if (field.maskable && field.value.length > 8) {
      // Mostrar solo los últimos 4 dígitos para campos enmascarables
      displayValue = `****${field.value.slice(-4)}`
    }
    doc.text(displayValue, 25, currentY + 6)
    
    currentY += lineHeight + 3
  })
  
  // Direcciones si están disponibles
  if (instructions.addresses) {
    currentY += 10
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.text("DIRECCIONES:", 20, currentY)
    currentY += 15
    
    if (instructions.addresses.beneficiary) {
      doc.setFontSize(11)
      doc.setFont("helvetica", "bold")
      doc.text("Dirección del Beneficiario:", 25, currentY)
      doc.setFont("helvetica", "normal")
      // Dividir texto largo en múltiples líneas
      const beneficiaryLines = doc.splitTextToSize(instructions.addresses.beneficiary, 160)
      doc.text(beneficiaryLines, 25, currentY + 6)
      currentY += 6 + (beneficiaryLines.length * 5) + 8
    }
    
    if (instructions.addresses.bank) {
      doc.setFontSize(11)
      doc.setFont("helvetica", "bold")
      doc.text("Dirección del Banco:", 25, currentY)
      doc.setFont("helvetica", "normal")
      const bankLines = doc.splitTextToSize(instructions.addresses.bank, 160)
      doc.text(bankLines, 25, currentY + 6)
      currentY += 6 + (bankLines.length * 5) + 8
    }
  }
  
  // Instrucciones importantes
  currentY += 20
  doc.setFontSize(12)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(primaryColor)
  doc.text("INSTRUCCIONES IMPORTANTES:", 20, currentY)
  
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  currentY += 15
  
  const instructions_text = [
    "• Utilice exactamente la información proporcionada arriba para realizar su depósito.",
    "• Conserve el comprobante de transferencia como respaldo de su transacción.",
    "• Los depósitos pueden tardar entre 1-3 días hábiles en procesarse.",
    "• Para consultas sobre su depósito, contacte a soporte@takenos.com.",
    "• Incluya su email de usuario como referencia en la transferencia si es posible."
  ]
  
  instructions_text.forEach((instruction) => {
    const lines = doc.splitTextToSize(instruction, 170)
    doc.text(lines, 20, currentY)
    currentY += lines.length * 5 + 4  // Más espaciado entre líneas
  })
  
  // Separación antes del footer
  currentY += 15
  
  // Footer con mejor espaciado
  doc.setTextColor(100, 100, 100)
  doc.setFontSize(9)
  doc.setFont("helvetica", "italic")
  doc.text("Este documento contiene información confidencial. Manténgalo seguro.", 20, currentY)
  doc.text(`Generado el: ${new Date().toLocaleDateString("es-ES")} a las ${new Date().toLocaleTimeString("es-ES")}`, 20, currentY + 8)
  doc.text("© 2025 Takenos", 20, currentY + 16)
  
  return doc
}

export const downloadDepositInstructions = async (instructions: DepositInstructions) => {
  const doc = await generateDepositInstructionsPDF(instructions)
  const method = instructions.method.toLowerCase()
  const date = new Date().toISOString().split('T')[0]
  const fileName = `instrucciones_deposito_${method}_${date}.pdf`
  doc.save(fileName)
}
