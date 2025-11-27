import { NextRequest, NextResponse } from "next/server";
import {
  sendDepositNotification,
  type DepositNotificationPayload,
} from "@/lib/notifications/deposit";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userEmail,
      fileName,
      fileUrl,
      fundingAccountId,
      externalAccountId,
      rail,
      currencyCode,
      initialAmount,
      externalReference,
      externalId,
      requestId,
      to,
    } = body ?? {};

    if (!userEmail) {
      return NextResponse.json(
        { error: "Falta userEmail" },
        { status: 400 }
      );
    }

    const payload: DepositNotificationPayload = {
      userEmail,
      requestId: requestId ?? null,
      fundingAccountId: fundingAccountId ?? null,
      externalAccountId: externalAccountId ?? null,
      rail: rail ?? null,
      currencyCode: currencyCode ?? null,
      initialAmount: initialAmount ?? null,
      externalReference: externalReference ?? null,
      externalId: externalId ?? null,
      fileUrl: fileUrl ?? null,
      fileName: fileName ?? null,
    };

    await sendDepositNotification(payload, {
      to: Array.isArray(to) ? to : to ? [to] : undefined,
    });

    return NextResponse.json({
      success: true,
      message: "Notificación enviada",
    });
  } catch (error) {
    console.error("Error in send-deposit-notification:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
