/**
 * Utilidades para limpiar sesiones inválidas cuando se detectan tokens inválidos
 */

/**
 * Limpia completamente la sesión del usuario, incluyendo localStorage y sessionStorage
 */
export function clearAllSessionData(): void {
  if (typeof window === "undefined") return;

  // Limpiar todo el almacenamiento local
  localStorage.clear();
  sessionStorage.clear();

  // Limpiar también las cookies relacionadas con Supabase si existen
  const cookies = document.cookie.split(";");
  for (let cookie of cookies) {
    const eqPos = cookie.indexOf("=");
    const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
    // Limpiar cookies de Supabase
    if (name.includes("supabase") || name.includes("sb-")) {
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
    }
  }
}

/**
 * Valida si una respuesta HTTP indica un error de autenticación
 */
export function isAuthError(status: number): boolean {
  return status === 401 || status === 403;
}

/**
 * Verifica si un error es un error de autenticación basado en su mensaje
 */
export function isAuthErrorFromMessage(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes("token") ||
      message.includes("authentication") ||
      message.includes("authorization") ||
      message.includes("unauthorized") ||
      message.includes("forbidden") ||
      message.includes("session expired") ||
      message.includes("invalid token")
    );
  }
  return false;
}

/**
 * Intercepta fetch globalmente para detectar errores de autenticación
 * Esto se debe llamar una vez al iniciar la aplicación
 */
export function setupGlobalAuthErrorHandler(
  onAuthError: () => void | Promise<void>
): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  // Guardar el fetch original
  const originalFetch = window.fetch;

  // Reemplazar fetch con una versión que intercepta errores
  window.fetch = async function (...args) {
    try {
      const response = await originalFetch.apply(this, args);

      // Si la respuesta indica un error de autenticación, ejecutar el callback
      if (isAuthError(response.status)) {
        console.error(
          `❌ Error de autenticación detectado (${response.status}) en:`,
          args[0]
        );
        await onAuthError();
      }

      return response;
    } catch (error) {
      // Si hay un error y parece ser de autenticación, ejecutar el callback
      if (isAuthErrorFromMessage(error)) {
        console.error("❌ Error de autenticación detectado:", error);
        await onAuthError();
      }
      throw error;
    }
  };

  // Retornar función para restaurar el fetch original
  return () => {
    window.fetch = originalFetch;
  };
}

