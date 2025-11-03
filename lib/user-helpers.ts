// Helper para obtener el email del usuario
export const getUserEmail = (user: any) => {
  // Primero intentar desde localStorage
  try {
    const storedUser = localStorage.getItem("takenos_user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      if (parsedUser.email) return parsedUser.email;
    }
  } catch (e) {
    console.error("Error reading from localStorage:", e);
  }

  // Fallback a useAuth
  return user?.email || null;
};