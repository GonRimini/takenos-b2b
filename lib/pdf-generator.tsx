import { jsPDF } from "jspdf"

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
