import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

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

    // Crear el contenido HTML del email
    // const htmlContent = `
    //   <!DOCTYPE html>
    //   <html>
    //     <head>
    //       <meta charset="utf-8">
    //       <title>Solicitud de Depósito</title>
    //       <style>
    //         body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    //         .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    //         .header { background: linear-gradient(135deg, #6d37d5 0%, #8b5cf6 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    //         .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
    //         .footer { background: #333; color: white; padding: 15px; border-radius: 0 0 8px 8px; text-align: center; font-size: 12px; }
    //         .info-box { background: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 15px 0; }
    //         .download-btn { 
    //           display: inline-block; 
    //           background: #6d37d5; 
    //           color: white; 
    //           padding: 12px 25px; 
    //           text-decoration: none; 
    //           border-radius: 6px; 
    //           margin: 15px 0;
    //           font-weight: bold;
    //         }
    //         .highlight { background: #fff3cd; padding: 10px; border-radius: 4px; margin: 10px 0; }
    //       </style>
    //     </head>
    //     <body>
    //       <div class="container">
    //         <div class="header">
    //           <h1 style="margin: 0;">🏦 Nueva Solicitud de Depósito</h1>
    //           <p style="margin: 5px 0 0 0; opacity: 0.9;">Takenos B2B Portal</p>
    //         </div>
            
    //         <div class="content">
    //           <h2 style="color: #6d37d5; margin-top: 0;">Detalles de la solicitud</h2>
              
    //           <div class="info-box">
    //             <p><strong>📧 Usuario:</strong> ${userEmail}</p>
    //             <p><strong>📅 Fecha de carga:</strong> ${uploadDate}</p>
    //             <a href="${fileUrl}" class="download-btn" target="_blank" rel="noopener">
    //             <p><strong>📎 Archivo:</strong> ${fileName}</p>
    //             </a>
    //           </div>

    //           <div class="highlight">
    //             <p><strong>⚡ Acción requerida:</strong> Un usuario ha subido un comprobante de depósito y requiere procesamiento manual.</p>
    //           </div>
              


    //           <div style="background: #f44336; color: white; padding: 15px; border-radius: 4px; margin: 20px 0;">
    //             <p style="margin: 0;"><strong>⚠️ Importante:</strong> Este es un proceso manual que requiere atención inmediata. El usuario estará esperando la acreditación de sus fondos.</p>
    //           </div>
    //         </div>

    //         <div class="footer">
    //           <p>Este email fue generado automáticamente por el sistema Takenos B2B Portal</p>
    //           <p>📧 ${userEmail} • 🕐 ${uploadDate}</p>
    //         </div>
    //       </div>
    //     </body>
    //   </html>
    // `;

    // Crear también la versión en texto plano
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
