import { NextResponse } from "next/server";
import { sendSlackNotificationServer } from "@/lib/notifications/slack";

export const runtime = "nodejs"; // importante

export async function POST(req: Request) {
  const { message } = await req.json().catch(() => ({}));

  if (!message) {
    return NextResponse.json({ success: false, error: "message requerido" }, { status: 400 });
  }

  const result = await sendSlackNotificationServer(message);
  return NextResponse.json(result, { status: result.success ? 200 : 500 });
}