import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { sendSlackNotification } from "@/lib/slack";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { to, subject, userEmail, fileName, fileUrl, uploadDate } =
      await request.json();

    // Validar datos requeridos
    if (!to || !subject || !userEmail || !fileName || !fileUrl) {
      return NextResponse.json(
        { error: "Faltan datos requeridos" },
        { status: 400 }
      );
    }

    const textContent = `
Nueva Solicitud de Depósito - Takenos B2B Portal

DETALLES DE LA SOLICITUD:
- Usuario: ${userEmail}
- Fecha de carga: ${uploadDate}  
- Archivo: ${fileName}

COMPROBANTE:
Descargar: ${fileUrl}

PRÓXIMOS PASOS:
1. Revisar el comprobante de depósito
2. Validar los datos de la transacción  
3. Procesar la acreditación en el sistema
4. Notificar al usuario sobre el estado

IMPORTANTE: Este es un proceso manual que requiere atención inmediata.

---
Este email fue generado automáticamente por el sistema TakeNos B2B Portal
Usuario: ${userEmail} | Fecha: ${uploadDate}
    `;

    // Función para limpiar strings para tags de Resend (solo ASCII letters, numbers, underscores, dashes)
    const sanitizeTagValue = (value: string): string => {
      return value
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, "_") // Reemplazar caracteres no válidos con guión bajo
        .replace(/_+/g, "_") // Reemplazar múltiples guiones bajos con uno solo
        .replace(/^_|_$/g, "") // Remover guiones bajos al inicio y final
        .substring(0, 256); // Limitar longitud (Resend tiene límite de 256 caracteres)
    };

    // Enviar el email usando Resend
    const { data, error } = await resend.emails.send({
      from: "Takenos B2B <onboarding@resend.dev>", // Cambiar por tu dominio verificado
      to: [to],
      subject: subject,
      // html: htmlContent, // Comentado - solo enviamos texto plano
      text: textContent,
      // Agregar reply-to para facilitar respuesta
      replyTo: userEmail,
      // Tags para organización (sanitizadas para cumplir con reglas de Resend)
      tags: [
        { name: "type", value: "deposit-notification" },
        { name: "user", value: sanitizeTagValue(userEmail) },
      ],
    });

    // Enviar notificación a Slack
    const slackMessage = `:bank: *Nueva Solicitud de Depósito*\n*Usuario:* ${userEmail}\n*Fecha de carga:* ${uploadDate}\n*Archivo:* <${fileUrl}|${fileName}>\n*Acción requerida:* Procesar la acreditación manualmente.`;
    // await sendSlackNotification(slackMessage);

    if (error) {
      console.error("Error sending email:", error);
      return NextResponse.json(
        { error: "Error al enviar el email: " + error.message },
        { status: 500 }
      );
    }

    console.log("Email sent successfully:", data);
    return NextResponse.json({
      success: true,
      data,
      message: "Email enviado correctamente",
    });
  } catch (error) {
    console.error("Error in send-deposit-notification:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
