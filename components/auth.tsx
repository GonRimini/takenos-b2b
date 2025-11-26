"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { User, Session, AuthError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase-client";
import { setupGlobalAuthErrorHandler, clearAllSessionData } from "@/lib/session-cleanup";

// 👇 agregá esto
interface DbUser {
  id: string;
  email: string;
  name: string;
  last_name: string;
  company_id: string;
  company: {
    id: string;
    name: string;
    // otros campos de la tabla companies si los necesitás
  } | null;
  nationality: string;
  // después le agregás los campos reales de tu tabla public.users
  [key: string]: unknown;
}

type EnrichedUser = User & {
  dbUser?: DbUser; // acá va lo que viene de public.users
};

interface AuthContextType {
  user: EnrichedUser | null;
  session: Session | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string
  ) => Promise<{ error: AuthError | null }>;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<EnrichedUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const loadUserWithDbData = async (authUser: User | null) => {
    if (!authUser) {
      setUser(null);
      return;
    }

    console.log(authUser);

    const { data, error } = await supabase
      .from("users") // 👈 tu tabla en schema public
      .select("*, company:companies(*)")
      .eq("id", authUser.id)
      .single();

    console.log("Loaded DB user data:", data);
    if (error) {
      // si falla el select, al menos guardamos el user “pelado”
      console.log("Error loading DB user data:", error.message);
      setUser({ ...authUser } as EnrichedUser);
      return;
    }

    const dbUser = data as DbUser;

    setUser({
      ...authUser,
      dbUser, // 👈 acá queda todo lo de public.users dentro de user
    } as EnrichedUser);
  };

  useEffect(() => {
    // Función para validar si un token es válido
    const validateToken = async (token: string | undefined): Promise<boolean> => {
      if (!token) return false;
      
      try {
        const { data: { user }, error } = await supabase.auth.getUser(token);
        return !error && !!user;
      } catch (error) {
        console.error("Error validating token:", error);
        return false;
      }
    };

    // Función para limpiar sesión inválida (NO bloquea el loading)
    const clearInvalidSession = () => {
      console.log("🔒 Limpiando sesión inválida...");
      setIsSigningOut(true);
      setUser(null);
      setSession(null);
      
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (err) {
        console.error("Error clearing storage:", err);
      }
      
      setIsSigningOut(false);
      setLoading(false); // CRÍTICO: Detener loading INMEDIATAMENTE
      
      // Hacer signOut en background (no bloquear)
      supabase.auth.signOut({ scope: "global" }).catch((err) => {
        console.error("Error signing out:", err);
      });
      
      // Redirigir solo si no estamos ya en login
      if (pathname !== "/login") {
        router.push("/login");
      }
    };

    // Obtener sesión inicial SOLO si no estamos haciendo logout
    const getInitialSession = async () => {
      if (isSigningOut) {
        setLoading(false);
        return;
      }

      try {
        // Timeout de seguridad para getSession (5 segundos max)
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error("Timeout getting session")), 5000);
        });

        const {
          data: { session },
          error,
        } = await Promise.race([sessionPromise, timeoutPromise]) as any;

        // Si hay error al obtener la sesión, limpiar y detener loading
        if (error) {
          console.error("❌ Error obteniendo sesión:", error);
          setUser(null);
          setSession(null);
          setLoading(false);
          clearInvalidSession();
          return;
        }

        // Si no hay sesión, limpiar y detener loading
        if (!session) {
          setUser(null);
          setSession(null);
          setLoading(false);
          return;
        }

        // Si hay una sesión, validar que el token sea válido (con timeout)
        if (session?.access_token) {
          try {
            const validationPromise = validateToken(session.access_token);
            const timeoutPromise = new Promise<boolean>((resolve) => {
              setTimeout(() => resolve(false), 3000); // 3 segundos max
            });
            
            const isValid = await Promise.race([validationPromise, timeoutPromise]);
            
            if (!isValid) {
              console.error("❌ Token inválido detectado, limpiando sesión...");
              setUser(null);
              setSession(null);
              setLoading(false);
              clearInvalidSession();
              return;
            }
          } catch (validationError) {
            console.error("❌ Error validando token:", validationError);
            setUser(null);
            setSession(null);
            setLoading(false);
            clearInvalidSession();
            return;
          }
        }

        // Sesión válida, continuar normalmente
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Cargar datos del usuario en background (no bloquear)
        loadUserWithDbData(session?.user ?? null).catch((err) => {
          console.error("Error loading user DB data:", err);
        });
      } catch (error) {
        console.error("❌ Error inesperado en getInitialSession:", error);
        setUser(null);
        setSession(null);
        setLoading(false);
        clearInvalidSession();
      }
    };

    getInitialSession();

    // Timeout de seguridad: si después de 8 segundos todavía está cargando, forzar detener
    const safetyTimeout = setTimeout(() => {
      console.warn("⚠️ Timeout de seguridad: deteniendo loading después de 8 segundos");
      setLoading(false);
    }, 8000);

    // Escuchar cambios de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Si estamos haciendo logout, ignorar cambios de sesión temporales
      if (isSigningOut && event !== "SIGNED_OUT") {
        return;
      }

      // Si el evento es SIGNED_OUT o no hay sesión, limpiar todo
      if (event === "SIGNED_OUT" || !session) {
        setSession(null);
        setUser(null);
        setIsSigningOut(false);
        setLoading(false);
        try {
          localStorage.clear();
          sessionStorage.clear();
        } catch (err) {
          console.error("Error clearing storage:", err);
        }
        return;
      }

      // Si el evento es TOKEN_REFRESHED o SIGNED_IN, validar el token (con timeout)
      if (session?.access_token && (event === "TOKEN_REFRESHED" || event === "SIGNED_IN")) {
        try {
          const validationPromise = validateToken(session.access_token);
          const timeoutPromise = new Promise<boolean>((resolve) => {
            setTimeout(() => resolve(false), 3000);
          });
          
          const isValid = await Promise.race([validationPromise, timeoutPromise]);
          
          if (!isValid) {
            console.error("❌ Token inválido después de refresh, limpiando sesión...");
            setSession(null);
            setUser(null);
            setLoading(false);
            clearInvalidSession();
            return;
          }
        } catch (validationError) {
          console.error("❌ Error validando token en refresh:", validationError);
          setSession(null);
          setUser(null);
          setLoading(false);
          clearInvalidSession();
          return;
        }
      }

      // Actualizar sesión y usuario INMEDIATAMENTE
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false); // CRÍTICO: Detener loading antes de cargar datos adicionales

      // Cargar datos del usuario en background (no bloquear)
      loadUserWithDbData(session?.user ?? null).catch((error) => {
        console.error("Error loading user DB data:", error);
      });
    });

    // Validar token periódicamente cada 5 minutos
    const tokenValidationInterval = setInterval(async () => {
      if (!isSigningOut) {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (currentSession?.access_token) {
          const isValid = await validateToken(currentSession.access_token);
          if (!isValid) {
            console.error("❌ Token inválido en validación periódica, limpiando sesión...");
            await clearInvalidSession();
          }
        }
      }
    }, 5 * 60 * 1000); // 5 minutos

    return () => {
      subscription.unsubscribe();
      clearInterval(tokenValidationInterval);
      clearTimeout(safetyTimeout);
    };
  }, [isSigningOut, router]);

  // Manejo de rutas protegidas
  useEffect(() => {
    if (loading) {
      return;
    }

    // Rutas públicas que no requieren autenticación
    const publicRoutes = ["/login", "/auth/callback"];

    // Si no hay usuario Y no estamos en una ruta pública
    if (!user && !publicRoutes.includes(pathname)) {
      router.push("/login");
      return;
    }

    // Si hay usuario Y estamos en login, redirigir al dashboard
    if (user && pathname === "/login") {
      router.push("/dashboard");
      return;
    }
  }, [user, loading, pathname, router]);

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    // Marcar que estamos haciendo logout para evitar consultas de sesión
    setIsSigningOut(true);

    // Forzar limpieza inmediata del estado
    setUser(null);
    setSession(null);
    setLoading(false);

    // Limpiar TODO el localStorage y sessionStorage
    localStorage.clear();
    sessionStorage.clear();

    // Hacer signOut de Supabase DESPUÉS de limpiar el estado local
    try {
      await supabase.auth.signOut({ scope: "global" });
    } catch (err) {}

    return { error: null };
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    return { error };
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
  };

  // Configurar interceptor global para detectar errores de autenticación en todas las peticiones
  useEffect(() => {
    const handleAuthError = async () => {
      // Solo limpiar si hay una sesión activa (evitar loops en páginas públicas)
      if (session || user) {
        console.log("🔒 Error de autenticación detectado globalmente, limpiando sesión...");
        await signOut();
        clearAllSessionData();
        router.push("/login");
      }
    };

    const cleanupFetch = setupGlobalAuthErrorHandler(handleAuthError);

    return () => {
      cleanupFetch();
    };
  }, [signOut, router, session, user]);

  // Mostrar loading mientras se inicializa la autenticación
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6d37d5] mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
