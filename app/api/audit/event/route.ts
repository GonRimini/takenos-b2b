import { NextRequest, NextResponse } from "next/server";
import { supabaseServerWithToken } from "@/lib/supabase/supabase-server-auth";
import { supabaseServer } from "@/lib/supabase-server";

const ALLOWED_ACTIONS = new Set([
  "app.enter",
  "auth.login_success",
  "withdrawal.flow_started",
  "deposit.flow_started",
]);

function getBearerToken(req: NextRequest) {
  const auth = req.headers.get("authorization") || "";
  const [type, token] = auth.split(" ");
  if (type?.toLowerCase() !== "bearer" || !token) return null;
  return token.trim();
}

function getClientIp(req: NextRequest) {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0].trim();
  const xr = req.headers.get("x-real-ip");
  if (xr) return xr.trim();
  return null;
}

export async function POST(req: NextRequest) {
  try {
    console.log("🔍 [AUDIT] POST request recibido");
    
    const token = getBearerToken(req);
    console.log("🔍 [AUDIT] Bearer token:", token ? `✅ Presente (${token.substring(0, 20)}...)` : "⚠️ Ausente (usando service role)");
    
    // Token es opcional para audit logging (fire-and-forget)
    // Si no hay token, usar service role para poder insertar en la tabla
    const sb = token ? supabaseServerWithToken(token) : supabaseServer();

    const body = await req.json().catch(() => ({}));
    console.log("🔍 [AUDIT] Body parseado:", JSON.stringify(body, null, 2));
    
    const { 
      action, 
      metadata, 
      usage_session_id, 
      flow_instance_id,
      user_id: body_user_id,
      company_id: body_company_id 
    } = body || {};

    if (!action || typeof action !== "string") {
      console.log("❌ [AUDIT] Validación fallida: Missing action");
      return NextResponse.json({ ok: false, error: "Missing action" }, { status: 400 });
    }
    if (!ALLOWED_ACTIONS.has(action)) {
      console.log("❌ [AUDIT] Validación fallida: Invalid action", action);
      return NextResponse.json({ ok: false, error: "Invalid action" }, { status: 400 });
    }

    const ip = getClientIp(req);
    const userAgent = req.headers.get("user-agent");
    console.log("🔍 [AUDIT] IP:", ip, "| UserAgent:", userAgent?.substring(0, 50));

    // Obtener user_id: priorizar del body, sino del token si existe
    let userId: string | null = body_user_id ?? null;
    let companyId: string | null = body_company_id ?? null;
    
    if (!userId && token) {
      const { data: { user } } = await sb.auth.getUser();
      userId = user?.id ?? null;
      console.log("🔍 [AUDIT] User ID extraído del token:", userId);
    } else if (userId) {
      console.log("🔍 [AUDIT] User ID recibido del body:", userId);
    }

    const params = {
      p_action: action,
      p_metadata: metadata && typeof metadata === "object" ? metadata : {},
      p_usage_session_id: usage_session_id ?? null,
      p_flow_instance_id: flow_instance_id ?? null,
      p_ip: ip,
      p_user_agent: userAgent,
      p_user_id: userId,
      p_company_id: companyId,
    };
    console.log("🔍 [AUDIT] Params para log_audit_event:", JSON.stringify(params, null, 2));

    const { data, error } = await sb.rpc("log_audit_event", params);

    if (error) {
      console.error("❌ [AUDIT] Error al llamar log_audit_event:", error);
      console.error("❌ [AUDIT] Error details:", JSON.stringify(error, null, 2));
      // no rompas UX por logging
      return NextResponse.json({ ok: true, inserted_id: null });
    }

    console.log("✅ [AUDIT] Evento registrado exitosamente. Data:", data);
    return NextResponse.json({ ok: true, inserted_id: data ?? null });
  } catch (err) {
    console.error("❌ [AUDIT] Exception en POST:", err);
    return NextResponse.json({ ok: true, inserted_id: null });
  }
}