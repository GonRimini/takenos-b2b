import { Resend } from "resend"
import { sendSlackNotification } from "@/lib/slack"

export interface WithdrawalNotificationPayload {
  userEmail: string
  requestId?: string | null
  externalAccountId: string
  rail: string
  currencyCode: string
  amount: number
  externalReference?: string | null
  fileUrl?: string | null
  fileName?: string | null
  // Datos enriquecidos
  companyName?: string | null
  externalAccountNickname?: string | null
  externalAccountDetails?: string | null
}

const formatAmount = (amount: number): string => {
  if (!Number.isFinite(amount)) return "N/D"
  return new Intl.NumberFormat("es-US", {
    style: "currency",
    currency: "USD",
  }).format(amount)
}

const buildPlainText = (payload: WithdrawalNotificationPayload): string => {
  const lines = [
    "Nueva Solicitud de Retiro - Takenos B2B Portal",
    "",
    "EMPRESA Y USUARIO:",
    payload.companyName ? `- Empresa: ${payload.companyName}` : null,
    `- Usuario: ${payload.userEmail}`,
    payload.requestId ? `- ID de solicitud: ${payload.requestId}` : null,
    "",
    "CUENTA DESTINO (External Account):",
    `- ID: ${payload.externalAccountId}`,
    payload.externalAccountNickname ? `- Alias: ${payload.externalAccountNickname}` : null,
    payload.externalAccountDetails ? `- Detalles: ${payload.externalAccountDetails}` : null,
    "",
    "DETALLES DE LA TRANSACCIÓN:",
    `- Rail: ${payload.rail}`,
    `- Moneda: ${payload.currencyCode}`,
    `- Monto: ${formatAmount(payload.amount)}`,
    payload.externalReference ? `- Referencia externa: ${payload.externalReference}` : null,
    "",
    "COMPROBANTE:",
    payload.fileUrl ? `- URL: ${payload.fileUrl}` : "- No adjuntado",
    payload.fileUrl && payload.fileName ? `- Archivo: ${payload.fileName}` : null,
    "",
    "PRÓXIMOS PASOS:",
    "1. Validar datos del retiro",
    "2. Ejecutar la transferencia según el rail",
    "3. Registrar la operación y notificar al usuario",
  ]

  return lines.filter(Boolean).join("\n")
}

export async function sendWithdrawalNotification(
  payload: WithdrawalNotificationPayload,
): Promise<void> {
  const resendApiKey = process.env.RESEND_API_KEY

  if (!resendApiKey) {
    console.warn("⚠️ RESEND_API_KEY no está configurada; se omite email de retiro")
    return
  }

  const resend = new Resend(resendApiKey)
  const recipients =
    process.env.NODE_ENV === "production"
      ? ["fermin@takenos.com", "thiago@takenos.com"]
      : ["grimini@takenos.com"]

  const fromEmail =
    process.env.NODE_ENV === "production"
      ? "Takenos B2B <grimini@takenos.com>"
      : "Takenos B2B <onboarding@resend.dev>"

  const { error } = await resend.emails.send({
    from: fromEmail,
    to: recipients,
    subject: `Withdrawal Request de ${payload.userEmail} - ${formatAmount(payload.amount)}`,
    text: buildPlainText(payload),
    replyTo: payload.userEmail,
  })

  if (error) {
    console.error("❌ Error al enviar email de retiro:", error)
  }

  const slackLines = [
    ":money_with_wings: *Nueva solicitud de retiro*",
    "",
    payload.companyName ? `*Empresa:* ${payload.companyName}` : null,
    `*Usuario:* ${payload.userEmail}`,
    payload.requestId ? `*ID solicitud:* ${payload.requestId}` : null,
    "",
    "*Cuenta Destino:*",
    `  • ID: ${payload.externalAccountId}`,
    payload.externalAccountNickname ? `  • Alias: ${payload.externalAccountNickname}` : null,
    "",
    `*Rail:* ${payload.rail} | *Moneda:* ${payload.currencyCode}`,
    `*Monto:* ${formatAmount(payload.amount)}`,
    payload.externalReference ? `*Referencia:* ${payload.externalReference}` : null,
    `*Comprobante:* ${payload.fileUrl ? `<${payload.fileUrl}|Ver archivo>` : "No adjuntado"}`,
  ]

  const slackMessage = slackLines.filter(Boolean).join("\n")
  await sendSlackNotification(slackMessage)
}

