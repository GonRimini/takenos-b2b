import { Resend } from "resend"
import { sendSlackNotification } from "@/lib/slack"

export interface DepositNotificationPayload {
  userEmail: string
  requestId?: string | null
  fundingAccountId?: string | null
  rail?: string | null
  currencyCode?: string | null
  initialAmount?: number | null
  externalAccountId?: string | null
  externalReference?: string | null
  externalId?: string | null
  fileUrl?: string | null
  fileName?: string | null
  // Datos enriquecidos
  companyName?: string | null
  externalAccountNickname?: string | null
  externalAccountDetails?: string | null
  fundingAccountNickname?: string | null
  fundingAccountDetails?: string | null
}

interface SendOptions {
  to?: string[]
}

const sanitizeTagValue = (value: string): string => {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .substring(0, 256)
}

const buildPlainText = (payload: DepositNotificationPayload): string => {
  const {
    userEmail,
    requestId,
    fundingAccountId,
    rail,
    currencyCode,
    initialAmount,
    externalAccountId,
    externalReference,
    externalId,
    fileUrl,
    companyName,
    externalAccountNickname,
    externalAccountDetails,
    fundingAccountNickname,
    fundingAccountDetails,
  } = payload

  const lines = [
    "Nueva Solicitud de Depósito - Takenos B2B Portal",
    "",
    "EMPRESA Y USUARIO:",
    companyName ? `- Empresa: ${companyName}` : null,
    `- Usuario: ${userEmail}`,
    requestId ? `- ID de solicitud: ${requestId}` : null,
    "",
    "CUENTA ORIGEN (External Account):",
    externalAccountId ? `- ID: ${externalAccountId}` : "- No especificada",
    externalAccountNickname ? `- Alias: ${externalAccountNickname}` : null,
    externalAccountDetails ? `- Detalles: ${externalAccountDetails}` : null,
    "",
    "CUENTA DESTINO (Funding Account):",
    `- ID: ${fundingAccountId ?? "N/D"}`,
    fundingAccountNickname ? `- Alias: ${fundingAccountNickname}` : null,
    fundingAccountDetails ? `- Detalles: ${fundingAccountDetails}` : null,
    "",
    "DETALLES DE LA TRANSACCIÓN:",
    `- Rail: ${rail ?? "N/D"}`,
    `- Moneda: ${currencyCode ?? "N/D"}`,
    initialAmount != null ? `- Monto inicial informado: ${initialAmount}` : null,
    externalReference ? `- Referencia externa: ${externalReference}` : null,
    externalId ? `- External ID: ${externalId}` : null,
    "",
    "COMPROBANTE:",
    fileUrl ? `- URL: ${fileUrl}` : "- No adjuntado",
    fileUrl && payload.fileName ? `- Archivo: ${payload.fileName}` : null,
    "",
    "PRÓXIMOS PASOS:",
    "1. Revisar el comprobante (si aplica)",
    "2. Validar los datos de la transacción",
    "3. Procesar la acreditación en el sistema",
    "4. Notificar al usuario sobre el estado",
    "",
    "IMPORTANTE: Este es un proceso manual que requiere atención inmediata.",
  ]

  return lines.filter(Boolean).join("\n")
}

export async function sendDepositNotification(
  payload: DepositNotificationPayload,
  options: SendOptions = {},
): Promise<void> {
  const resendApiKey = process.env.RESEND_API_KEY

  if (!resendApiKey) {
    console.warn("⚠️ RESEND_API_KEY no está configurada; se omite email de depósito")
    return
  }

  const resend = new Resend(resendApiKey)

  const textContent = buildPlainText(payload)
  const recipients =
    process.env.NODE_ENV === "production"
      ? options.to ?? ["fermin@takenos.com", "thiago@takenos.com"]
      : ["grimini@takenos.com"]

  const fromEmail =
    process.env.NODE_ENV === "production"
      ? "Takenos B2B <grimini@takenos.com>"
      : "Takenos B2B <onboarding@resend.dev>"

  const { error } = await resend.emails.send({
    from: fromEmail,
    to: recipients,
    subject: `Nueva Solicitud de Depósito - ${payload.userEmail}`,
    text: textContent,
    replyTo: payload.userEmail,
    tags: [
      { name: "type", value: "deposit-notification" },
      { name: "user", value: sanitizeTagValue(payload.userEmail) },
    ],
  })

  if (error) {
    console.error("❌ Error al enviar email de depósito:", error)
  }

  const slackLines = [
    ":bank: *Nueva Solicitud de Depósito*",
    "",
    payload.companyName ? `*Empresa:* ${payload.companyName}` : null,
    `*Usuario:* ${payload.userEmail}`,
    payload.requestId ? `*ID solicitud:* ${payload.requestId}` : null,
    "",
    "*Cuenta Origen:*",
    payload.externalAccountId ? `  • ID: ${payload.externalAccountId}` : "  • No especificada",
    payload.externalAccountNickname ? `  • Alias: ${payload.externalAccountNickname}` : null,
    "",
    "*Cuenta Destino:*",
    `  • ID: ${payload.fundingAccountId ?? "N/D"}`,
    payload.fundingAccountNickname ? `  • Alias: ${payload.fundingAccountNickname}` : null,
    "",
    `*Rail:* ${payload.rail ?? "N/D"} | *Moneda:* ${payload.currencyCode ?? "N/D"}`,
    payload.initialAmount != null ? `*Monto:* ${payload.initialAmount}` : null,
    payload.externalReference ? `*Referencia:* ${payload.externalReference}` : null,
    `*Comprobante:* ${payload.fileUrl ? `<${payload.fileUrl}|Ver archivo>` : "No adjuntado"}`,
  ]

  const slackMessage = slackLines.filter(Boolean).join("\n")
  await sendSlackNotification(slackMessage)
}

