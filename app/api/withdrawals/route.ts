import { type NextRequest, NextResponse } from "next/server"
import { withdrawalSchema } from "@/lib/withdrawal-schema"
import { Resend } from "resend"
import { supabaseServer } from "@/lib/supabase-server"

export const runtime = "nodejs"

function parseAmountToNumber(v?: string) {
  if (!v) return null
  const onlyDigits = v.replace(/[^\d.]/g, "")
  if (!onlyDigits) return null
  return Number.parseFloat(onlyDigits)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validar con Zod
    const validatedData = withdrawalSchema.parse(body)
    
    console.log("Withdrawal request received:", validatedData)
    
    // Obtener el email del usuario desde el header o query param
    const userEmail = request.headers.get("x-user-email") || "usuario@takenos.com"
    
    // Generar HTML del email según la categoría
    const emailHtml = generateEmailHtml(validatedData)
    
    // Enviar email usando Resend
    const resendApiKey = process.env.RESEND_API_KEY
    
    console.log("RESEND_API_KEY found:", resendApiKey ? "Yes" : "No")
    
    if (!resendApiKey) {
      console.warn("RESEND_API_KEY not found, skipping email send")
      console.log("Email HTML that would be sent:", emailHtml)
    } else {
      const resend = new Resend(resendApiKey)
      
      try {
        const recipients = ["grimini@takenos.com"]
        const emailResults = []
        
        // Enviar emails por separado para debug
        for (const recipient of recipients) {
          console.log(`Sending email to: ${recipient}`)
          
          const { data, error } = await resend.emails.send({
            from: "onboarding@resend.dev",
            to: [recipient],
            subject: `Withdrawal Request de ${userEmail} - ${formatAmount(validatedData.amount)}`,
            html: emailHtml,
          })
          
          if (error) {
            console.error(`Error sending email to ${recipient}:`, error)
            emailResults.push({ recipient, success: false, error })
          } else {
            console.log(`Email sent successfully to ${recipient}:`, data)
            emailResults.push({ recipient, success: true, data })
          }
        }
        
        // Verificar si al menos uno se envió exitosamente
        const successfulEmails = emailResults.filter(result => result.success)
        const failedEmails = emailResults.filter(result => !result.success)
        
        console.log(`Email summary: ${successfulEmails.length} successful, ${failedEmails.length} failed`)
        
        if (successfulEmails.length === 0) {
          console.error("All emails failed:", failedEmails)
          return NextResponse.json({ 
            success: false, 
            message: "Error al enviar todas las notificaciones por email",
            emailResults 
          }, { status: 500 })
        }
        
        if (failedEmails.length > 0) {
          console.warn("Some emails failed:", failedEmails)
        }
        
      } catch (emailError) {
        console.error("Error sending email:", emailError)
        return NextResponse.json({ 
          success: false, 
          message: `Error al enviar la notificación por email: ${emailError instanceof Error ? emailError.message : 'Unknown error'}` 
        }, { status: 500 })
      }
    }
    
    // 2) Insertar en Supabase
    const supa = supabaseServer()
    const amountNumeric = parseAmountToNumber(validatedData.amount)
    const insertPayload = {
      status: "pending",
      category: validatedData.category,
      method: validatedData.method ?? null,
      amount_numeric: amountNumeric,
      currency: "USD",
      requester_email: userEmail,
      user_id: null, // TODO: Add user_id if available from auth context
      payload: validatedData,
    }

    const { data: inserted, error } = await supa
      .from("withdrawals")
      .insert(insertPayload)
      .select("id, created_at")
      .single()

    if (error) {
      console.error("Supabase insert error:", error)
      return NextResponse.json({ 
        success: false, 
        message: "Error al guardar en la base de datos",
        error: error.message 
      }, { status: 500 })
    }

    console.log("Withdrawal saved to database:", inserted)

    return NextResponse.json({ 
      success: true, 
      message: "Solicitud de retiro recibida correctamente",
      data: validatedData,
      withdrawalId: inserted.id,
      createdAt: inserted.created_at
    })
    
  } catch (error) {
    console.error("Error processing withdrawal request:", error)
    
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ 
        success: false, 
        message: "Datos de formulario inválidos",
        errors: error.message 
      }, { status: 400 })
    }
    
    return NextResponse.json({ 
      success: false, 
      message: "Error interno del servidor" 
    }, { status: 500 })
  }
}

function formatAmount(amount: string) {
  if (!amount || typeof amount !== "string") {
    return "$0.00"
  }
  const num = Number.parseFloat(amount.replace(/[,$]/g, ""))
  if (isNaN(num)) {
    return "$0.00"
  }
  return new Intl.NumberFormat("es-US", {
    style: "currency",
    currency: "USD",
  }).format(num)
}

function generateEmailHtml(data: any) {
  const getCategoryLabel = (category: string) => {
    const labels = {
      usd_bank: "USD - Cuenta bancaria",
      crypto: "Criptomonedas", 
      local_currency: "Moneda local",
    }
    return labels[category as keyof typeof labels] || category
  }

  const getMethodLabel = (method: string) => {
    const labels = {
      ach: "ACH",
      wire: "Wire Transfer",
    }
    return labels[method as keyof typeof labels] || method
  }

  const getAccountOwnershipLabel = (ownership: string) => {
    const labels = {
      yo: "Yo mismo",
      otra_persona: "Otra persona", 
      empresa: "Empresa",
    }
    return labels[ownership as keyof typeof labels] || ownership
  }

  const getAccountTypeLabel = (type: string) => {
    const labels = {
      checking: "Checking",
      saving: "Saving",
    }
    return labels[type as keyof typeof labels] || type
  }

  const getWalletNetworkLabel = (network: string) => {
    const labels = {
      BEP20: "Binance Smart Chain - BEP20",
      MATIC: "Polygon - MATIC",
      TRC20: "Tron - TRC20",
    }
    return labels[network as keyof typeof labels] || network
  }



  let categoryFields = ""
  
  if (data.category === "usd_bank") {
    categoryFields = `
      <tr><td><strong>Propietario:</strong></td><td>${getAccountOwnershipLabel(data.accountOwnership)}</td></tr>
      <tr><td><strong>Método:</strong></td><td>${getMethodLabel(data.method)}</td></tr>
      <tr><td><strong>Titular:</strong></td><td>${data.beneficiaryName}</td></tr>
      <tr><td><strong>Banco:</strong></td><td>${data.beneficiaryBank}</td></tr>
      <tr><td><strong>Tipo de cuenta:</strong></td><td>${getAccountTypeLabel(data.accountType)}</td></tr>
      <tr><td><strong>Número de cuenta:</strong></td><td>${data.accountNumber}</td></tr>
      ${data.method === "ach" && data.routingNumber ? `<tr><td><strong>Routing Number:</strong></td><td>${data.routingNumber}</td></tr>` : ""}
      ${data.method === "wire" && data.swiftBic ? `<tr><td><strong>SWIFT/BIC:</strong></td><td>${data.swiftBic}</td></tr>` : ""}
    `
  } else if (data.category === "crypto") {
    categoryFields = `
      <tr><td><strong>Apodo de la billetera:</strong></td><td>${data.walletAlias}</td></tr>
      <tr><td><strong>Dirección:</strong></td><td>${data.walletAddress}</td></tr>
      <tr><td><strong>Red:</strong></td><td>${getWalletNetworkLabel(data.walletNetwork)}</td></tr>
    `
  } else if (data.category === "local_currency") {
    categoryFields = `
      <tr><td><strong>País:</strong></td><td>${data.country}</td></tr>
      <tr><td><strong>Nombre de la cuenta:</strong></td><td>${data.localAccountName}</td></tr>
      <tr><td><strong>Banco:</strong></td><td>${data.localBank}</td></tr>
      <tr><td><strong>Número de cuenta:</strong></td><td>${data.localAccountNumber}</td></tr>
    `
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Solicitud de Retiro - Takenos</title>
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
          line-height: 1.6; 
          color: #1f2937; 
          margin: 0; 
          padding: 0; 
          background-color: #f9fafb; 
        }
        .container { 
          max-width: 600px; 
          margin: 0 auto; 
          background-color: #ffffff; 
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); 
        }
        .header { 
          background: linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%); 
          color: white; 
          padding: 30px 20px; 
          text-align: center; 
          border-radius: 8px 8px 0 0; 
        }
        .logo { 
          width: 120px; 
          height: auto; 
          margin-bottom: 15px; 
        }
        .header h1 { 
          margin: 0; 
          font-size: 24px; 
          font-weight: 600; 
        }
        .content { 
          padding: 30px 20px; 
          background: #ffffff; 
        }
        .amount { 
          font-size: 32px; 
          font-weight: 700; 
          color: #7c3aed; 
          text-align: center; 
          padding: 25px; 
          background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); 
          border-radius: 8px; 
          margin: 20px 0; 
          border: 2px solid #8b5cf6; 
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin: 25px 0; 
          background: #ffffff; 
          border-radius: 8px; 
          overflow: hidden; 
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1); 
        }
        th, td { 
          padding: 15px; 
          text-align: left; 
          border-bottom: 1px solid #e5e7eb; 
        }
        th { 
          background: #f8fafc; 
          font-weight: 600; 
          color: #374151; 
          font-size: 14px; 
        }
        td { 
          font-size: 14px; 
          color: #1f2937; 
        }
        .status-badge { 
          display: inline-block; 
          background: #fef3c7; 
          color: #92400e; 
          padding: 6px 12px; 
          border-radius: 20px; 
          font-size: 12px; 
          font-weight: 600; 
          text-transform: uppercase; 
          letter-spacing: 0.5px; 
        }
        .footer { 
          text-align: center; 
          padding: 25px 20px; 
          color: #6b7280; 
          font-size: 13px; 
          background: #f9fafb; 
          border-top: 1px solid #e5e7eb; 
        }
        .footer-logo { 
          width: 80px; 
          height: auto; 
          margin-bottom: 10px; 
          opacity: 0.7; 
        }
        .info-box { 
          background: #faf5ff; 
          border: 1px solid #8b5cf6; 
          border-radius: 6px; 
          padding: 15px; 
          margin: 20px 0; 
        }
        .info-box p { 
          margin: 0; 
          color: #581c87; 
          font-size: 14px; 
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <svg width="120" height="40" viewBox="0 0 120 40" style="margin-bottom: 15px;">
            <defs>
              <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#7c3aed;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#8b5cf6;stop-opacity:1" />
              </linearGradient>
            </defs>
            <!-- Taco icon -->
            <path d="M8 12 Q8 8 12 8 L20 8 Q24 8 24 12 L24 20 Q24 24 20 24 L12 24 Q8 24 8 20 Z" fill="url(#logoGradient)"/>
            <path d="M10 14 Q10 12 12 12 L20 12 Q22 12 22 14 L22 18 Q22 20 20 20 L12 20 Q10 20 10 18 Z" fill="white"/>
            <path d="M14 16 Q16 16 18 16" stroke="white" stroke-width="1" fill="none"/>
            <!-- Text -->
            <text x="32" y="18" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="white">takenos</text>
          </svg>
          <h1>Nueva Solicitud de Retiro</h1>
        </div>
        
        <div class="content">
          <div class="amount">
            ${formatAmount(data.amount)}
          </div>
          
          <table>
            <tr><td><strong>Categoría:</strong></td><td>${getCategoryLabel(data.category)}</td></tr>
            ${categoryFields}
            ${data.reference ? `<tr><td><strong>Referencia:</strong></td><td>${data.reference}</td></tr>` : ""}
          </table>
          
          <div class="info-box">
            <p><strong>Estado:</strong> <span class="status-badge">Pendiente de revisión</span></p>
            <p>Te contactaremos pronto para confirmar los detalles de tu retiro.</p>
          </div>
        </div>
        
        <div class="footer">
          <svg width="80" height="30" viewBox="0 0 80 30" style="margin-bottom: 10px; opacity: 0.7;">
            <defs>
              <linearGradient id="footerLogoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#7c3aed;stop-opacity:0.7" />
                <stop offset="100%" style="stop-color:#8b5cf6;stop-opacity:0.7" />
              </linearGradient>
            </defs>
            <!-- Taco icon -->
            <path d="M6 9 Q6 6 9 6 L15 6 Q18 6 18 9 L18 15 Q18 18 15 18 L9 18 Q6 18 6 15 Z" fill="url(#footerLogoGradient)"/>
            <path d="M7.5 10.5 Q7.5 9 9 9 L15 9 Q16.5 9 16.5 10.5 L16.5 13.5 Q16.5 15 15 15 L9 15 Q7.5 15 7.5 13.5 Z" fill="white"/>
            <path d="M10.5 12 Q12 12 13.5 12" stroke="white" stroke-width="0.8" fill="none"/>
            <!-- Text -->
            <text x="22" y="14" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#6b7280">takenos</text>
          </svg>
          <p><strong>Takenos</strong> - Plataforma de pagos internacionales</p>
          <p>Este es un email automático. No respondas a este mensaje.</p>
          <p style="font-size: 11px; color: #9ca3af; margin-top: 15px;">
            © 2024 Takenos. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}
