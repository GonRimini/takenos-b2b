interface DepositNotificationParams {
  userEmail: string;
  fileName: string;
  fileUrl: string;
}

export const useDepositNotification = () => {
  const sendDepositNotification = async ({ 
    userEmail, 
    fileName, 
    fileUrl 
  }: DepositNotificationParams): Promise<void> => {
    try {
      const notificationData = {
        to: "grimini@takenos.com",
        subject: `Nueva Solicitud de Depósito - ${userEmail}`,
        userEmail,
        fileName,
        fileUrl,
        uploadDate: new Date().toISOString()
      };

      const response = await fetch("/api/send-deposit-notification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(notificationData),
      });

      if (!response.ok) {
        console.warn("⚠️ Error enviando notificación de depósito:", await response.text());
      } else {
        console.log("✅ Notificación de depósito enviada correctamente");
      }
    } catch (error) {
      console.warn("⚠️ Error enviando notificación de depósito:", error);
    }
  };

  return {
    sendDepositNotification
  };
};