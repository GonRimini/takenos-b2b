export async function sendSlackNotificationServer(message: string) {
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  
    if (!webhookUrl) {
      console.error("SLACK_WEBHOOK_URL no está configurada");
      return { success: false, error: "SLACK_WEBHOOK_URL no está configurada" };
    }
  
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: message }),
    });
  
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error al enviar mensaje a Slack:", errorText);
      return { success: false, error: `Error ${response.status}: ${errorText}` };
    }
  
    return { success: true };
  }