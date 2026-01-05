"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { User, Session, AuthError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase-client";
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
    country_code: string;
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
    let mounted = true;

    // Obtener sesión inicial
    const getInitialSession = async () => {
      if (isSigningOut) {
        setLoading(false);
        return;
      }

      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (error || !session) {
          setUser(null);
          setSession(null);
        } else {
          // Establecer sesión y usuario INMEDIATAMENTE
          setSession(session);
          setUser(session.user as EnrichedUser);
          // Cargar datos adicionales en background (NO bloquear)
          loadUserWithDbData(session.user).catch(() => {
            // Si falla, ya tenemos el usuario básico
          });
        }
      } catch (error) {
        console.error("Error obteniendo sesión:", error);
        if (mounted) {
          setUser(null);
          setSession(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    getInitialSession();

    // Escuchar cambios de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted || (isSigningOut && event !== "SIGNED_OUT")) {
        return;
      }

      if (!session) {
        setSession(null);
        setUser(null);
        setIsSigningOut(false);
        setLoading(false);
        return;
      }

      // Verificar si ya tenemos este usuario con dbUser cargado antes de actualizar
      setUser((prevUser) => {
        // Si es el mismo usuario y ya tiene dbUser cargado, mantenerlo
        if (prevUser?.id === session.user.id && prevUser?.dbUser) {
          // Actualizar datos básicos pero mantener dbUser existente
          return {
            ...session.user,
            dbUser: prevUser.dbUser,
          } as EnrichedUser;
        }
        
        // Usuario nuevo o sin dbUser - establecer básico y cargar datos en background
        const newUser = session.user as EnrichedUser;
        loadUserWithDbData(session.user).catch(() => {
          // Si falla, ya tenemos el usuario básico
        });
        return newUser;
      });

      // Actualizar sesión
      setSession(session);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [isSigningOut]);

  // Manejo de rutas protegidas
  useEffect(() => {
    if (loading) {
      return;
    }

    // Rutas públicas que no requieren autenticación
    const publicRoutes = ["/login", "/auth/callback", "/auth/reset-password", "/forgot-password"];

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
    const { data,error } = await supabase.auth.signUp({
      email,
      password,
    });
    if(data.user){
      // Enviar notificación a Slack a través de la API route
      fetch('/api/slack-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: `👤 Nuevo usuario registrado: ${email}` })
      }).catch(err => console.error('Error al enviar notificación a Slack:', err));
      return { error: null };
    }
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
