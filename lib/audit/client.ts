import { v4 as uuid } from "uuid";

export function getUsageSessionId(): string {
  const key = "usage_session_id";
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = uuid();
    sessionStorage.setItem(key, id);
  }
  return id;
}

export function logAuditEvent(payload: {
  action: string;
  metadata?: Record<string, unknown>;
  flow_instance_id?: string | null;
  user_id?: string | null;
  company_id?: string | null;
}) {
  const usageSessionId = getUsageSessionId();
  const body = JSON.stringify({
    action: payload.action,
    metadata: payload.metadata ?? {},
    usage_session_id: usageSessionId,
    flow_instance_id: payload.flow_instance_id ?? null,
    user_id: payload.user_id ?? null,
    company_id: payload.company_id ?? null,
  });

  console.log("📤 [AUDIT CLIENT] Enviando evento:", {
    action: payload.action,
    metadata: payload.metadata,
    usage_session_id: usageSessionId,
    flow_instance_id: payload.flow_instance_id,
    user_id: payload.user_id,
    company_id: payload.company_id,
  });

  // Fire-and-forget
  if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
    const result = navigator.sendBeacon("/api/audit/event", body);
    console.log("📤 [AUDIT CLIENT] sendBeacon resultado:", result ? "✅ enviado" : "❌ falló");
    return;
  }

  console.log("📤 [AUDIT CLIENT] Usando fetch (fallback)");
  fetch("/api/audit/event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  })
    .then(res => {
      console.log("📤 [AUDIT CLIENT] Fetch response status:", res.status);
      return res.json();
    })
    .then(data => {
      console.log("📤 [AUDIT CLIENT] Fetch response data:", data);
    })
    .catch((err) => {
      console.error("📤 [AUDIT CLIENT] Fetch error:", err);
    });
}
export function newFlowInstanceId(): string {
  return uuid();
}

