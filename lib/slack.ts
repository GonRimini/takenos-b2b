export async function sendSlackNotification(message: string, extra?: any) {
  const webhookUrl =
    process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn("⚠️ SLACK_WEBHOOK_URL no está configurado");
    return;
  }

  const payload = {
    text: message,
    ...extra,
  };

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.error("❌ Error al enviar a Slack:", await res.text());
    } else {
      console.log("✅ Notificación enviada a Slack");
    }
  } catch (err) {
    console.error("⚠️ Error en el envío a Slack:", err);
  }
}